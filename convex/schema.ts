import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  users: defineTable({
    email: v.string(),
    workos_id: v.string(),
    first_name: v.optional(v.string()),
    last_name: v.optional(v.string()),
    profile_picture: v.optional(v.string()),
    theme: v.union(v.literal('light'), v.literal('dark')),
    color: v.union(
      v.literal('gray'),
      v.literal('blue'),
      v.literal('green'),
      v.literal('yellow'),
      v.literal('orange'),
      v.literal('red'),
      v.literal('purple'),
      v.literal('pink'),
      v.literal('brown'),
      v.literal('default'),
    ),
    sidebar_hidden: v.optional(v.boolean()),
    sidebar_width: v.optional(v.number()),
    // Order of high-level sidebar sections for this user
    sidebar_sections_order: v.optional(v.array(v.union(v.literal('teams'), v.literal('private')))),
    agent_panel_hidden: v.optional(v.boolean()),
    agent_panel_width: v.optional(v.number()),
    agent_panel_page: v.optional(
      v.union(v.literal('chat'), v.literal('memory'), v.literal('tasks'), v.literal('history'), v.literal('new')),
    ),
  })
    .index('by_email', ['email'])
    .index('by_workos_id', ['workos_id']),
  organizations: defineTable({
    workos_id: v.string(),
    name: v.string(),
    avatar: v.optional(v.string()),
    default_state: v.optional(v.string()),
    default_contractor: v.optional(v.string()),
  }).index('by_workos_id', ['workos_id']),
  organization_members: defineTable({
    role: v.union(v.literal('admin'), v.literal('member'), v.literal('viewer')),
    status: v.union(v.literal('active'), v.literal('pending')),
    workos_org_id: v.string(),
    workos_user_id: v.string(),
    workos_membership_id: v.string(),
  })
    // Composite index to efficiently fetch active memberships by user
    .index('by_user_status', ['workos_user_id', 'status']),
  organization_invites: defineTable({
    email: v.string(),
    workos_org_id: v.string(), // WorkOS organization ID
    workos_invite_id: v.string(), // WorkOS invitation ID
    expires_at: v.number(),
    // workos_user_id: v.string(), //<-- you can't know this when the invite is created
  })
    .index('by_email', ['email'])
    .index('by_workos_invite_id', ['workos_invite_id']),

  // ------------------------------------------------------------
  // TEAMS
  // ------------------------------------------------------------
  teams: defineTable({
    organizationId: v.id('organizations'),
    name: v.string(),
    visibility: v.union(v.literal('open'), v.literal('closed'), v.literal('private')),
    createdAt: v.number(),
    createdBy: v.id('users'),
  })
    .index('by_org', ['organizationId'])
    .index('by_org_name', ['organizationId', 'name']),

  team_members: defineTable({
    teamId: v.id('teams'),
    userId: v.id('users'),
    role: v.union(v.literal('owner'), v.literal('admin'), v.literal('member')),
    createdAt: v.number(),
  })
    .index('by_team', ['teamId'])
    .index('by_user', ['userId'])
    // Composite index to check membership for a team+user without filtering
    .index('by_team_user', ['teamId', 'userId']),

  // ------------------------------------------------------------
  // BLOCK GRAPH
  // ------------------------------------------------------------
  blocks: defineTable({
    organizationId: v.id('organizations'),
    ownerId: v.id('users'),
    teamId: v.optional(v.id('teams')),
    scope: v.union(v.literal('private'), v.literal('team'), v.literal('org'), v.literal('custom')),
    type: v.union(
      v.literal('page'),
      v.literal('widget'),
      v.literal('file'),
      v.literal('thread'),
      v.literal('document'),
    ),
    title: v.optional(v.string()),

    // Hierarchy
    parentId: v.optional(v.id('blocks')),
    position: v.number(),
    ancestors: v.array(v.id('blocks')),
    depth: v.number(),
    // Optional during create; set to own id post-insert for top-level pages
    rootId: v.optional(v.id('blocks')),

    // Content
    content: v.optional(v.any()),

    // Lifecycle / audit
    isArchived: v.optional(v.boolean()),
    archivedAt: v.optional(v.number()),
    deletedAt: v.optional(v.number()),
    createdAt: v.number(),
    createdBy: v.id('users'),
    updatedAt: v.number(),
    updatedBy: v.id('users'),
  })
    .index('by_org', ['organizationId'])
    .index('by_parent_pos', ['parentId', 'position'])
    .index('by_owner_scope', ['ownerId', 'scope'])
    // Add organizationId to support queries scoped by org + owner + scope
    .index('by_owner_scope_org', ['ownerId', 'scope', 'organizationId'])
    .index('by_team', ['teamId'])
    .index('by_type', ['type'])
    .index('by_root_pos', ['rootId', 'position']),

  // ------------------------------------------------------------
  // PERMISSIONS
  // ------------------------------------------------------------
  block_permissions: defineTable({
    blockId: v.id('blocks'),
    subject: v.union(
      v.object({ kind: v.literal('user'), userId: v.id('users') }),
      v.object({ kind: v.literal('team'), teamId: v.id('teams') }),
      v.object({ kind: v.literal('org'), organizationId: v.id('organizations') }),
      v.object({ kind: v.literal('public') }),
    ),
    level: v.union(v.literal('read'), v.literal('write'), v.literal('admin')),
    subjectKey: v.string(), // e.g., user:ID, team:ID, org:ID, public
    createdAt: v.number(),
    createdBy: v.id('users'),
  })
    .index('by_block', ['blockId'])
    .index('by_subjectKey', ['subjectKey'])
    .index('by_block_subject', ['blockId', 'subjectKey']),

  // ------------------------------------------------------------
  // SHARE LINKS
  // ------------------------------------------------------------
  share_links: defineTable({
    blockId: v.id('blocks'),
    token: v.string(),
    level: v.union(v.literal('read'), v.literal('write')),
    expiresAt: v.optional(v.number()),
    createdAt: v.number(),
    createdBy: v.id('users'),
  })
    .index('by_token', ['token'])
    .index('by_block', ['blockId']),

  // ------------------------------------------------------------
  // FILES (metadata)
  //! shuold just be moved to conent or the content of a new "file-chunks" block type
  // ------------------------------------------------------------
  files: defineTable({
    blockId: v.id('blocks'),
    organizationId: v.id('organizations'),
    storageKey: v.string(),
    name: v.string(),
    mime: v.string(),
    size: v.number(),
    sha256: v.optional(v.string()),
    uploadedBy: v.id('users'),
    uploadedAt: v.number(),
  })
    .index('by_block', ['blockId'])
    .index('by_org', ['organizationId']),

  // ------------------------------------------------------------
  // THREADS (metadata)
  //! tbd on how to implement threads
  // ------------------------------------------------------------
  threads: defineTable({
    blockId: v.id('blocks'),
    organizationId: v.id('organizations'),
    createdBy: v.id('users'),
    model: v.optional(v.string()),
    status: v.optional(v.union(v.literal('open'), v.literal('closed'))),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_org', ['organizationId'])
    .index('by_block', ['blockId']),

  messages: defineTable({
    // legacy fields
    content: v.string(),
    author: v.string(), // user email or name
    authorId: v.string(), // workos user id
    organizationId: v.string(), // workos organization id
    timestamp: v.number(),

    // new optional fields
    threadId: v.optional(v.id('threads')),
    role: v.optional(v.union(v.literal('user'), v.literal('assistant'), v.literal('system'))),
    blockId: v.optional(v.id('blocks')),
    meta: v.optional(v.any()),
    orgId: v.optional(v.id('organizations')),
    userId: v.optional(v.id('users')),
  })
    .index('by_organization', ['organizationId'])
    .index('by_thread', ['threadId']),

  // ------------------------------------------------------------
  // PRESENCE
  // ------------------------------------------------------------
  // Presence component tables (localized copy from @convex-dev/presence)
  presence: defineTable({
    roomId: v.string(),
    userId: v.string(),
    online: v.boolean(),
    lastDisconnected: v.number(),
  })
    .index('user_online_room', ['userId', 'online', 'roomId'])
    .index('room_order', ['roomId', 'online', 'lastDisconnected']),

  presence_sessions: defineTable({
    roomId: v.string(),
    userId: v.string(),
    sessionId: v.string(),
  })
    .index('room_user_session', ['roomId', 'userId', 'sessionId'])
    .index('sessionId', ['sessionId']),

  presence_roomTokens: defineTable({
    token: v.string(),
    roomId: v.string(),
  })
    .index('token', ['token'])
    .index('room', ['roomId']),

  presence_sessionTokens: defineTable({
    token: v.string(),
    sessionId: v.string(),
  })
    .index('token', ['token'])
    .index('sessionId', ['sessionId']),

  presence_sessionTimeouts: defineTable({
    sessionId: v.string(),
    scheduledFunctionId: v.id('_scheduled_functions'),
  }).index('sessionId', ['sessionId']),
});
