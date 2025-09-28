import { MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useState } from 'react';
import { Switch } from '@/components/utils/switch';

export const MoreMenu = ({
  tooltip,
  children,
}: {
  tooltip?: string;
} & React.ComponentProps<'button'>) => {
  return (
    <Switch value={tooltip}>
      {{
        undefined: () => <Menu>{children}</Menu>,
        default: () => <TooltipMenu tooltip={tooltip}>{children}</TooltipMenu>,
      }}
    </Switch>
  );
};

const Menu = ({ children }: { children: React.ReactNode }) => (
  <DropdownMenu>
    <DropdownMenuTrigger className="opacity-0 group-hover/list-row:opacity-100 size-5 hover:bg-hover rounded flex items-center justify-center text-muted-foreground-opaque hover:text-foreground cursor-pointer">
      <MoreHorizontal className="size-4" />
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" alignOffset={-60} side="bottom" sideOffset={-10} className="max-w-48">
      {children}
    </DropdownMenuContent>
  </DropdownMenu>
);

function TooltipMenu({
  tooltip,
  children,
}: {
  tooltip?: string;
} & React.ComponentProps<'button'>) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
      <Tooltip delayDuration={300}>
        <TooltipTrigger
          onClick={() => setDropdownOpen(true)}
          className="opacity-0 group-hover/list-row:opacity-100 size-5 hover:bg-hover rounded flex items-center justify-center text-muted-foreground-opaque hover:text-foreground cursor-pointer"
        >
          <MoreHorizontal className="size-4" />
        </TooltipTrigger>
        <DropdownMenuTrigger tabIndex={-1} />
        <TooltipContent side="bottom">{tooltip}</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="start" alignOffset={-60} side="bottom" sideOffset={-10} className="max-w-48">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
