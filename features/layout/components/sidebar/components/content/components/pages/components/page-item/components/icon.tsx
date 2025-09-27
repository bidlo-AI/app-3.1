import { observer } from '@legendapp/state/react';
import { Observable } from '@legendapp/state';
import { File } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ExpandButton } from '../../buttons/expand-button'; // Add this import

// Presentational icon content for a page row with inline expand affordance
export const PageIcon = observer(({ open$ }: { open$: Observable<boolean> }) => (
  <span className="relative inline-flex items-center justify-center size-5 shrink-0">
    <File className={cn('size-5 group-hover/list-row:opacity-0')} />
    <ExpandButton open$={open$} className="group-hover/list-row:opacity-100 opacity-0 absolute -inset-px" />
  </span>
));
