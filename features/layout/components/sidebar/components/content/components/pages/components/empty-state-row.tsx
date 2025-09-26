'use client';

import { memo, useMemo } from 'react';

export const EmptyStateRow = memo(function EmptyStateRow({
  indent,
  label = 'No pages inside',
}: {
  indent: number;
  label?: string;
}) {
  const indentStyle = useMemo(() => ({ padding: '0 8px', paddingLeft: 8 + indent * 8 }), [indent]);
  return (
    <div className="flex items-center h-7.5 text-muted-foreground-opaque" style={indentStyle}>
      <span className="opacity-50">{label}</span>
    </div>
  );
});
