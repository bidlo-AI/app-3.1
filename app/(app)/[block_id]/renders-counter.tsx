'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

// Client-side counter to help debug rerenders and state updates.
export function RendersCounter() {
  const rendersRef = useRef(0);
  const [value, setValue] = useState(0);

  // Increment the render count on every render.
  rendersRef.current += 1;

  return (
    <div className="rounded-md border p-3 text-sm">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="font-medium">Renders: {rendersRef.current}</div>
          <div className="text-muted-foreground">State value: {value}</div>
        </div>
        <Button size="sm" onClick={() => setValue((v) => v + 1)}>
          +1
        </Button>
      </div>
    </div>
  );
}
