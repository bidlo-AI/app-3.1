import { Observable } from '@legendapp/state';
import { Memo, Show } from '@legendapp/state/react';

export const Empty = ({ show$, search$ }: { show$: Observable<boolean>; search$: Observable<string> }) => (
  <Show if={show$}>
    <div className="py-6 text-center text-sm text-muted-foreground">
      No results for{' '}
      <span className="text-foreground">
        <Memo>{search$}</Memo>
      </span>
      .
    </div>
  </Show>
);
