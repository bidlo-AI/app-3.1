// FacePile: local presence avatars using shadcn/ui primitives and design tokens.
// Styling intentionally avoids raw Tailwind colors; uses tokenized classes only.
'use client';

import React from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
// Popover removed for "+N"; using Tooltip for hover instead
import AvatarCircle from './avatar-circle';

type PresenceState = {
  userId: string;
  online: boolean;
  lastDisconnected: number;
  name?: string;
  image?: string;
};

const AVATAR_LIMIT = 5;

// Renders up to 5 visible avatars and summarizes the remainder in a popover.
export default function FacePile({ presenceState }: { presenceState: PresenceState[] }) {
  const visible = presenceState.slice(0, AVATAR_LIMIT);
  const hidden = presenceState.slice(AVATAR_LIMIT);

  return (
    <div className="flex items-center ml-2">
      <div className="flex items-center">
        {visible.map((presence, idx) => (
          <Tooltip key={presence.userId}>
            <TooltipTrigger
              className="rounded-full relative -ml-2 first:ml-0 size-5.5 bg-background"
              style={{ zIndex: String(visible.length - idx) }}
            >
              <AvatarCircle
                online={presence.online}
                image={presence.image}
                className="size-5.5"
                alt={presence.name || presence.userId}
                fallback={<span className="text-xs">{getInitial(presence.name, presence.userId)}</span>}
              />
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-left">
                <div className="font-medium text-xs">{presence.name || presence.userId}</div>
                <div className="text-[10px] text-muted-foreground">
                  {presence.online ? 'Online now' : getTimeAgo(presence.lastDisconnected)}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
        {hidden.length > 0 && (
          <Tooltip>
            <TooltipTrigger className="ml-0.5 relative hover:bg-hover hover:text-foreground h-5.5 w-5 rounded-md bg-background text-muted-foreground flex items-center justify-center text-xs font-medium cursor-pointer">
              +{hidden.length}
            </TooltipTrigger>
            <TooltipContent align="end" className="p-0 w-45">
              <div className="py-1">
                <span className="px-2 pb-1 text-xs font-medium text-muted-foreground">Last viewed by</span>
                {hidden.slice(0, 10).map((presence) => (
                  <div key={presence.userId} className="flex items-center gap-2 px-2 py-1.5">
                    <AvatarCircle
                      online={presence.online}
                      image={presence.image}
                      alt={presence.name || presence.userId}
                      className="size-6 bg-muted"
                      fallback={<span className="text-sm">{getInitial(presence.name, presence.userId)}</span>}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-medium">{presence.name || presence.userId}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {presence.online ? 'Online now' : getTimeAgo(presence.lastDisconnected)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}

// Utility: human-friendly "last seen" times.
function getInitial(name?: string, userId?: string): string {
  const source = (name || userId || '').trim();
  return source ? source.charAt(0).toUpperCase() : '?';
}
function getTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diffSeconds = Math.floor((now - timestamp) / 1000);
  if (diffSeconds < 60) return 'Last seen just now';
  if (diffSeconds < 3600) return `Last seen ${Math.floor(diffSeconds / 60)} min ago`;
  if (diffSeconds < 86400) {
    const hours = Math.floor(diffSeconds / 3600);
    return `Last seen ${hours} hour${hours === 1 ? '' : 's'} ago`;
  }
  const days = Math.floor(diffSeconds / 86400);
  return `Last seen ${days} day${days === 1 ? '' : 's'} ago`;
}
