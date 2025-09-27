'use client';

import { Button } from '@/components/ui/button';

export default function Error() {
  return (
    <div className="content flex items-center justify-center h-full">
      <div className="max-w-sm w-full mx-auto px-1.5 text-center flex flex-col items-center gap-1">
        <svg
          aria-hidden="true"
          role="graphics-symbol"
          viewBox="0 0 20 20"
          className="exclamationMarkTriangleFill"
          style={{
            width: '29px',
            height: '24px',
            display: 'block',
            fill: 'rgb(168, 164, 156)',
            flexShrink: '0',
            marginBottom: '8px',
          }}
        >
          <path d="M11.84 3.563c-.817-1.417-2.862-1.417-3.68 0L2.314 13.688c-.818 1.416.205 3.187 1.84 3.187h11.692c1.636 0 2.658-1.77 1.84-3.187zM9.876 6.75c.345 0 .625.28.625.625v3.5a.625.625 0 1 1-1.25 0v-3.5c0-.345.28-.625.625-.625m0 7.375a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5"></path>
        </svg>{' '}
        <span className="font-h4 text-muted-foreground" style={{ fontWeight: 600 }}>
          Oops, there was an error loading this page. Refresh the page to try again.
        </span>
        <Button className="mt-4" size="sm" onClick={() => window.location.reload()}>
          Refresh
        </Button>
      </div>
    </div>
  );
}
