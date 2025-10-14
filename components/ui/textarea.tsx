import * as React from 'react';

import { cn } from '@/lib/utils';
import { $React } from '@legendapp/state/react-web';
import { Observable } from '@legendapp/state';

// Textarea component with optional auto-grow behavior.
// When `autoGrow` is true, the textarea adjusts its height to fit its content.
type TextareaProps = React.ComponentProps<'textarea'> & { autoGrow?: boolean };

function Textarea({ className, autoGrow, ...props }: TextareaProps) {
  const ref = React.useRef<HTMLTextAreaElement>(null);

  const resizeToFitContent = React.useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  React.useEffect(() => {
    if (!autoGrow) return;
    // Resize on mount and when the value changes (controlled usage)
    resizeToFitContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoGrow, props.value]);

  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (autoGrow) {
        const el = e.currentTarget;
        el.style.height = 'auto';
        el.style.height = `${el.scrollHeight}px`;
      }
      props.onChange?.(e);
    },
    [autoGrow, props],
  );

  return (
    <textarea
      ref={ref}
      data-slot="textarea"
      className={cn(
        'border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        className,
      )}
      onChange={handleChange}
      {...props}
    />
  );
}

// Textarea$ supports Legend State via `$value` and the same `autoGrow` behavior.
type Textarea$Props = React.ComponentProps<'textarea'> & { $value: Observable<string>; autoGrow?: boolean };

function Textarea$({ className, $value, autoGrow, ...props }: Textarea$Props) {
  const ref = React.useRef<HTMLTextAreaElement>(null);

  const resizeToFitContent = React.useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  React.useEffect(() => {
    if (!autoGrow) return;
    // Resize on mount; reactive updates will trigger via onInput below
    resizeToFitContent();
  }, [autoGrow, resizeToFitContent]);

  const handleInput = React.useCallback(
    (e: React.FormEvent<HTMLTextAreaElement>) => {
      if (autoGrow) {
        const el = e.currentTarget;
        el.style.height = 'auto';
        el.style.height = `${el.scrollHeight}px`;
      }
      props.onInput?.(e);
    },
    [autoGrow, props],
  );

  return <$React.textarea ref={ref} className={cn(className)} $value={$value} onInput={handleInput} {...props} />;
}

export { Textarea, Textarea$ };
