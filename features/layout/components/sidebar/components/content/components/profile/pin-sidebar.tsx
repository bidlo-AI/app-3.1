import { Show } from '@legendapp/state/react';
import { ChevronsLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useSidebar } from '@/features/layout/components/sidebar/providers/SidebarProvider';
import { CmdKey } from '@/components/ui/cmd-key';

export const PinSidebar = () => {
  const sidebar$ = useSidebar();
  const handleUnpin = () => {
    sidebar$.setSidebar(true);
    sidebar$.openOverlay();
  };

  return (
    <Show if={() => !sidebar$.sidebar_hidden.get()}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="group-hover/sidebar:flex hidden text-muted-foreground-opaque"
            onClick={handleUnpin}
            aria-label="Unpin sidebar"
          >
            <ChevronsLeft className="size-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Close sidebar</p>
          <p className="text-xs text-muted-foreground">
            <CmdKey /> + H
          </p>
        </TooltipContent>
      </Tooltip>
    </Show>
  );
};
