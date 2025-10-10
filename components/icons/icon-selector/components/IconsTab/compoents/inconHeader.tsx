import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/icons/icon-selector/components/search-input';
import { ArrowRightLeft } from 'lucide-react';
import { Observable } from '@legendapp/state';

export const Header = ({ search$, onRandom }: { search$: Observable<string>; onRandom: () => void }) => (
  <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-1.5 pb-1 pt-2">
    <SearchInput search$={search$} />
    <Button aria-label="Random icon" variant="outline" size="icon" onClick={onRandom}>
      <ArrowRightLeft className="size-4" />
    </Button>
    <Button aria-label="Random icon" variant="outline" size="icon" onClick={onRandom}>
      <div className="size-3 rounded-full bg-muted-foreground" />
    </Button>
  </div>
);
