import { mutation, query, type QueryCtx, type MutationCtx } from './_generated/server';
import { api } from './_generated/api';
import { v } from 'convex/values';

// --------------------------------
// MUTATIONS
// --------------------------------
// Localized presence server implementation (adapted from @convex-dev/presence)

export const heartbeat = mutation({
  args: {
    roomId: v.string(),
    sessionId: v.string(),
    interval: v.number(),
  },
  handler: async (ctx, { roomId, sessionId, interval }) => {
    // Derive the user identity server-side to avoid trusting client-provided identifiers.
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('User not authenticated');
    const userId = identity.subject; // Use stable subject as the presence user id
    // Scope presence by organization to prevent cross-org visibility.
    // WorkOS identity includes an organization id; fall back to 'default' if unavailable.
    const organization = (identity as { organization?: string }).organization ?? 'default';
    const effectiveRoomId = `${organization}::${roomId}`;

    const session = await ctx.db
      .query('presence_sessions')
      .withIndex('sessionId', (q) => q.eq('sessionId', sessionId))
      .unique();
    if (!session) {
      await ctx.db.insert('presence_sessions', { roomId: effectiveRoomId, userId, sessionId });
    } else if (session.roomId !== effectiveRoomId || session.userId !== userId) {
      throw new Error(`sessionId ${sessionId} must be unique for a given room/user`);
    }

    const userPresence = await getUserPresence(ctx, userId, effectiveRoomId);
    if (!userPresence) {
      await ctx.db.insert('presence', { roomId: effectiveRoomId, userId, online: true, lastDisconnected: 0 });
    } else if (!userPresence.online) {
      await ctx.db.patch(userPresence._id, { online: true, lastDisconnected: 0 });
    }

    const existingTimeout = await ctx.db
      .query('presence_sessionTimeouts')
      .withIndex('sessionId', (q) => q.eq('sessionId', sessionId))
      .unique();
    if (existingTimeout) {
      await ctx.scheduler.cancel(existingTimeout.scheduledFunctionId);
      await ctx.db.delete(existingTimeout._id);
    }

    let roomToken: string;
    const roomTokenRecord = await ctx.db
      .query('presence_roomTokens')
      .withIndex('room', (q) => q.eq('roomId', effectiveRoomId))
      .unique();
    if (roomTokenRecord) {
      roomToken = roomTokenRecord.token;
    } else {
      roomToken = crypto.randomUUID();
      await ctx.db.insert('presence_roomTokens', { roomId: effectiveRoomId, token: roomToken });
    }

    let sessionToken: string;
    const sessionTokenRecord = await ctx.db
      .query('presence_sessionTokens')
      .withIndex('sessionId', (q) => q.eq('sessionId', sessionId))
      .unique();
    if (sessionTokenRecord) {
      sessionToken = sessionTokenRecord.token;
    } else {
      sessionToken = crypto.randomUUID();
      await ctx.db.insert('presence_sessionTokens', { sessionId, token: sessionToken });
    }

    const timeout = await ctx.scheduler.runAfter(interval * 2.5, api.presence.disconnect, {
      sessionToken: sessionToken,
    });
    await ctx.db.insert('presence_sessionTimeouts', { sessionId, scheduledFunctionId: timeout });

    return { roomToken, sessionToken };
  },
});

// --------------------------------
// QUERIES
// --------------------------------
export const list = query({
  args: { roomToken: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, { roomToken, limit = 104 }) => {
    if (!roomToken) return [];
    const roomTokenRecord = await ctx.db
      .query('presence_roomTokens')
      .withIndex('token', (q) => q.eq('token', roomToken))
      .unique();
    if (!roomTokenRecord) return [];
    const { roomId } = roomTokenRecord;

    const online = await ctx.db
      .query('presence')
      .withIndex('room_order', (q) => q.eq('roomId', roomId).eq('online', true))
      .take(limit);
    const offline = await ctx.db
      .query('presence')
      .withIndex('room_order', (q) => q.eq('roomId', roomId).eq('online', false))
      .order('desc')
      .take(limit - online.length);
    const results = [...online, ...offline];
    // Attach user display info (name, profile picture) when available.
    const enriched = await Promise.all(
      results.map(async ({ userId, online, lastDisconnected }) => {
        let name: string | undefined = undefined;
        let image: string | undefined = undefined;
        try {
          // Prefer joining by stable WorkOS subject id when presence.userId is the subject.
          // Fall back to matching by email to support any legacy presence rows keyed by email.
          const byWorkos = await ctx.db
            .query('users')
            .withIndex('by_workos_id', (q) => q.eq('workos_id', userId))
            .unique();
          const userRecord =
            byWorkos ||
            (await ctx.db
              .query('users')
              .withIndex('by_email', (q) => q.eq('email', userId))
              .unique());
          if (userRecord) {
            const first = userRecord.first_name ?? '';
            const last = userRecord.last_name ?? '';
            const fullName = `${first} ${last}`.trim();
            name = fullName.length > 0 ? fullName : undefined;
            image = userRecord.profile_picture ?? undefined;
          }
        } catch {
          // If the index isn't available or multiple users exist with same email, silently ignore.
        }
        return { userId, online, lastDisconnected, name, image };
      }),
    );
    return enriched;
  },
});

// --------------------------------
// MUTATIONS
// --------------------------------
export const disconnect = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    const sessionTokenRecord = await ctx.db
      .query('presence_sessionTokens')
      .withIndex('token', (q) => q.eq('token', sessionToken))
      .unique();
    if (!sessionTokenRecord) return null;

    await ctx.db.delete(sessionTokenRecord._id);
    const { sessionId } = sessionTokenRecord;

    const session = await ctx.db
      .query('presence_sessions')
      .withIndex('sessionId', (q) => q.eq('sessionId', sessionId))
      .unique();
    if (!session) return null;

    const { roomId, userId } = session;
    await ctx.db.delete(session._id);

    const userPresence = await getUserPresence(ctx, userId, roomId);
    if (!userPresence) return null;

    const remainingSessions = await ctx.db
      .query('presence_sessions')
      .withIndex('room_user_session', (q) => q.eq('roomId', roomId).eq('userId', userId))
      .collect();
    if (userPresence.online && remainingSessions.length === 0) {
      await ctx.db.patch(userPresence._id, { online: false, lastDisconnected: Date.now() });
    }

    const timeout = await ctx.db
      .query('presence_sessionTimeouts')
      .withIndex('sessionId', (q) => q.eq('sessionId', sessionId))
      .unique();
    if (timeout) {
      await ctx.scheduler.cancel(timeout.scheduledFunctionId);
      await ctx.db.delete(timeout._id);
    }
    return null;
  },
});

async function getUserPresence(ctx: QueryCtx | MutationCtx, userId: string, roomId: string) {
  return (
    (await ctx.db
      .query('presence')
      .withIndex('user_online_room', (q) => q.eq('userId', userId).eq('online', true).eq('roomId', roomId))
      .unique()) ||
    (await ctx.db
      .query('presence')
      .withIndex('user_online_room', (q) => q.eq('userId', userId).eq('online', false).eq('roomId', roomId))
      .unique())
  );
}
