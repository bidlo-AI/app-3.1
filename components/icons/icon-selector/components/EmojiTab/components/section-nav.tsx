'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Clock, Smile, Leaf, Utensils, Plane, Dumbbell, Package, Hash, Flag } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { CategoryKey } from '../types';
import type { Observable } from '@legendapp/state';
import { Show } from '@legendapp/state/react';

const ICON_MAP: Record<CategoryKey, LucideIcon> = {
  smileys_people: Smile,
  animals_nature: Leaf,
  food_drink: Utensils,
  travel_places: Plane,
  activities: Dumbbell,
  objects: Package,
  symbols: Hash,
  flags: Flag,
};

export function SectionNav({
  hasRecent$,
  currentSection,
  groups,
  onScrollToSection,
}: {
  hasRecent$: Observable<boolean>;
  currentSection: ('recent' | CategoryKey) | null;
  groups: Array<{ key: CategoryKey; label: string }>;
  onScrollToSection: (section: 'recent' | CategoryKey) => void;
}) {
  return (
    <div className=" border-t py-2 px-3 flex items-center justify-between gap-1 overflow-x-auto">
      <Show if={hasRecent$}>
        <SectionButton
          label="Recent"
          isActive={currentSection === 'recent'}
          onClick={() => onScrollToSection('recent')}
        >
          <Clock className="size-5" />
        </SectionButton>
      </Show>
      {groups.map((g) => {
        const Icon = ICON_MAP[g.key];
        return (
          <SectionButton
            key={g.key}
            label={g.label}
            isActive={currentSection === g.key}
            onClick={() => onScrollToSection(g.key)}
          >
            <Icon className="size-5" />
          </SectionButton>
        );
      })}
    </div>
  );
}

// Small reusable button with tooltip for a section item.
const SectionButton = React.memo(function SectionButton({
  label,
  isActive,
  onClick,
  children,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost_muted"
          size="icon"
          aria-label={label}
          className={isActive ? 'bg-hover' : ''}
          onClick={onClick}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
});
