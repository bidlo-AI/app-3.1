import { FunctionReference } from 'convex/server';
export interface PresenceAPI {
  list: FunctionReference<
    'query',
    'public',
    {
      roomToken: string;
    },
    PresenceState[]
  >;
  heartbeat: FunctionReference<
    'mutation',
    'public',
    {
      roomId: string;
      sessionId: string;
      interval: number;
    },
    {
      roomToken: string;
      sessionToken: string;
    }
  >;
  disconnect: FunctionReference<
    'mutation',
    'public',
    {
      sessionToken: string;
    }
  >;
}
export interface PresenceState {
  userId: string;
  online: boolean;
  lastDisconnected: number;
  name?: string;
  image?: string;
}
export default function usePresence(
  presence: PresenceAPI,
  roomId: string,
  interval?: number,
  convexUrl?: string,
): PresenceState[] | undefined;
//# sourceMappingURL=index.d.ts.map
