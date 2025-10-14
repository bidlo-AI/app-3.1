'use client';

import { api } from '@/convex/_generated/api';
// import usePresence from '@convex-dev/presence/react';
import usePresence from './hooks/usePresence/index.js';
import FacePile from './components/facepile';
import { Separator } from '@/features/layout/components/header/components/header-seporator';

export function Presence({ block_id }: { block_id: string }) {
  const presenceState = usePresence(api.presence, block_id);

  return (
    <div className="presence flex items-center">
      <FacePile presenceState={presenceState ?? []} />
      <Separator className="ml-2.5" />
    </div>
  );
}
