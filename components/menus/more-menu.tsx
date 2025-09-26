import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function MoreMenu({
  tooltip,
  children,
  modal = false,
  ...buttonProps
}: {
  tooltip?: string;
  modal?: boolean;
} & React.ComponentProps<'button'>) {
  if (tooltip) {
    return (
      <Tooltip delayDuration={300}>
        <DropdownMenu>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" {...buttonProps}>
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <DropdownMenuContent className="max-w-48">{children}</DropdownMenuContent>
          <TooltipContent side="bottom">{tooltip}</TooltipContent>
        </DropdownMenu>
      </Tooltip>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" {...buttonProps}>
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="max-w-48">{children}</DropdownMenuContent>
    </DropdownMenu>
  );
}
