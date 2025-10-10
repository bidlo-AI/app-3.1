import { BlocksIcon } from 'lucide-react';
import { NavLink } from './nav-link';

export const Apps = () => (
  <NavLink href="/apps" aria-label="Apps" label="Apps" icon={<BlocksIcon className="size-4.5" />} />
);
