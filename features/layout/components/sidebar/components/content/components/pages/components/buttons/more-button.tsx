import { MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function MoreMenu({
  tooltip,
  children,
}: {
  tooltip: string;
} & React.ComponentProps<'button'>) {
  return (
    <DropdownMenu modal={true}>
      <DropdownMenuTrigger className="opacity-0 group-hover/list-row:opacity-100 size-5 hover:bg-hover rounded flex items-center justify-center text-muted-foreground-opaque hover:text-foreground cursor-pointer">
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-w-48">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
  // return (
  //   <DropdownMenu modal={true}>
  //     <Tooltip delayDuration={300}>
  //       <TooltipTrigger asChild>
  //         <DropdownMenuTrigger className="opacity-0 group-hover/list-row:opacity-100 size-5 hover:bg-hover rounded flex items-center justify-center text-muted-foreground-opaque hover:text-foreground cursor-pointer">
  //           <MoreHorizontal className="size-4" />
  //         </DropdownMenuTrigger>
  //       </TooltipTrigger>
  //       <TooltipContent side="bottom">{tooltip}</TooltipContent>
  //     </Tooltip>
  //     <DropdownMenuContent align="end" className="max-w-48">
  //       {children}
  //     </DropdownMenuContent>
  //   </DropdownMenu>
  // );
}
