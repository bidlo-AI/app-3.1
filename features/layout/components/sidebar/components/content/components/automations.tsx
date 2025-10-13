import { GitFork } from 'lucide-react';
import { NavLink } from './nav-link';

export const Automations = () => (
  <NavLink
    href="/automations"
    aria-label="Automations"
    label="Automations"
    icon={<GitFork className="rotate-90 size-4.5" />}
  />
);
