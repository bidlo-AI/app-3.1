'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useMutation, useConvex } from 'convex/react';
import useSingleFlight from './useSingleFlight.js';
// React hook for maintaining presence state.
//
// This hook is designed to be efficient and only sends a message to users
// whenever a member joins or leaves the room, not on every heartbeat.
//
// Use of this hook requires passing in a reference to the Convex presence
// component defined in your Convex app. See ../../example/src/App.tsx for an
// example of how to incorporate this hook into your application.
export default function usePresence(presence, roomId, interval = 10000, convexUrl) {
  const hasMounted = useRef(false);
  const convex = useConvex();
  const baseUrl = convexUrl ?? convex.url;
  // Each session (browser tab etc) has a unique ID and a token used to disconnect it.
  const [sessionId, setSessionId] = useState(() => crypto.randomUUID());
  const [sessionToken, setSessionToken] = useState(null);
  const sessionTokenRef = useRef(null);
  const [roomToken, setRoomToken] = useState(null);
  const roomTokenRef = useRef(null);
  const intervalRef = useRef(null);
  const heartbeat = useSingleFlight(useMutation(presence.heartbeat));
  const disconnect = useSingleFlight(useMutation(presence.disconnect));
  useEffect(() => {
    // Reset session state when roomId changes.
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (sessionTokenRef.current) {
      void disconnect({ sessionToken: sessionTokenRef.current });
    }
    setSessionId(crypto.randomUUID());
    setSessionToken(null);
    setRoomToken(null);
  }, [roomId, disconnect]);
  useEffect(() => {
    // Update refs whenever tokens change.
    sessionTokenRef.current = sessionToken;
    roomTokenRef.current = roomToken;
  }, [sessionToken, roomToken]);
  useEffect(() => {
    // Periodic heartbeats.
    const sendHeartbeat = async () => {
      const result = await heartbeat({ roomId, sessionId, interval });
      setRoomToken(result.roomToken);
      setSessionToken(result.sessionToken);
    };
    // Send initial heartbeat
    void sendHeartbeat();
    // Clear any existing interval before setting a new one
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(sendHeartbeat, interval);
    // Handle page unload.
    const handleUnload = () => {
      if (sessionTokenRef.current) {
        const blob = new Blob(
          [
            JSON.stringify({
              path: 'presence:disconnect',
              args: { sessionToken: sessionTokenRef.current },
            }),
          ],
          {
            type: 'application/json',
          },
        );
        navigator.sendBeacon(`${baseUrl}/api/mutation`, blob);
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    // Handle visibility changes.
    const handleVisibility = async () => {
      if (document.hidden) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        if (sessionTokenRef.current) {
          await disconnect({ sessionToken: sessionTokenRef.current });
        }
      } else {
        void sendHeartbeat();
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        intervalRef.current = setInterval(sendHeartbeat, interval);
      }
    };
    const wrappedHandleVisibility = () => {
      handleVisibility().catch(console.error);
    };
    document.addEventListener('visibilitychange', wrappedHandleVisibility);
    // Cleanup.
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener('visibilitychange', wrappedHandleVisibility);
      window.removeEventListener('beforeunload', handleUnload);
      // Don't disconnect on first render in strict mode.
      if (hasMounted.current) {
        if (sessionTokenRef.current) {
          void disconnect({ sessionToken: sessionTokenRef.current });
        }
      }
    };
  }, [heartbeat, disconnect, roomId, baseUrl, interval, sessionId]);
  useEffect(() => {
    hasMounted.current = true;
  }, []);
  const state = useQuery(presence.list, roomToken ? { roomToken } : 'skip');
  return useMemo(() => state, [state]);
}
//# sourceMappingURL=index.js.map
