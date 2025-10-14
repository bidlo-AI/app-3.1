import * as React from 'react';
import { cn } from '@/lib/utils';
import { EditableCoreReturn, EditableOptions } from './types';

// Shared core behavior for contentEditable elements.
// - Schedules commits with debounce while typing
// - Commits immediately on blur
// - Normalizes Enter and paste behavior (single-line vs multiline)
export function useEditableCore<E extends HTMLElement = HTMLElement>(
  options: Required<Pick<EditableOptions, 'onCommit'>> & Omit<EditableOptions, 'onCommit'>,
): EditableCoreReturn<E> {
  const { onCommit, initialValue = '', debounceMs = 500, singleLine = false } = options;

  const editableRef = React.useRef<E | null>(null);
  const isComposingRef = React.useRef<boolean>(false);
  const suppressNextBlurCommitRef = React.useRef<boolean>(false);
  const lastCommittedRef = React.useRef<string>(initialValue);

  const bufferRef = React.useRef<string>(initialValue);
  const initialTextRef = React.useRef<string>(initialValue);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Normalize editor DOM when content is effectively empty so CSS :empty placeholders work.
  // This avoids stray "\n" or whitespace-only text nodes that would hide the placeholder.
  const normalizeEmptyEditor = React.useCallback((el: HTMLElement): string => {
    const rawText = el.innerText ?? '';
    // Trim regular spaces, non‑breaking spaces and zero‑width spaces
    const trimmed = rawText
      .replace(/\u200B/g, '')
      .replace(/\u00A0/g, ' ')
      .trim();
    if (trimmed.length === 0) {
      if (el.textContent !== '') {
        el.textContent = '';
      }
      return '';
    }
    return rawText;
  }, []);

  // Sync external changes; use innerText so visual line breaks are preserved
  React.useEffect(() => {
    const el = editableRef.current as unknown as HTMLElement | null;
    if (!el) return;
    // Do not clobber user input while focused or composing
    if (document.activeElement === el || isComposingRef.current) return;
    if ((el.innerText ?? '') !== initialValue) {
      el.innerText = initialValue;
      bufferRef.current = initialValue;
      lastCommittedRef.current = initialValue;
    }
    // Ensure placeholder state is consistent with current content
    normalizeEmptyEditor(el);
  }, [initialValue, normalizeEmptyEditor]);

  const scheduleCommit = React.useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onCommit(bufferRef.current);
      lastCommittedRef.current = bufferRef.current;
    }, debounceMs);
  }, [debounceMs, onCommit]);

  const handleInput = React.useCallback(
    (e: React.FormEvent<E>) => {
      if (isComposingRef.current) return;
      const el = editableRef.current as unknown as HTMLElement | null;
      if (el) {
        bufferRef.current = normalizeEmptyEditor(el);
      } else {
        const raw = (e.currentTarget as unknown as HTMLElement).innerText ?? '';
        bufferRef.current = raw.trim().length === 0 ? '' : raw;
      }
      scheduleCommit();
    },
    [scheduleCommit, normalizeEmptyEditor],
  );

  const handleBlur = React.useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (suppressNextBlurCommitRef.current) {
      suppressNextBlurCommitRef.current = false;
      return;
    }
    const el = editableRef.current as unknown as HTMLElement | null;
    if (el) bufferRef.current = normalizeEmptyEditor(el);
    onCommit(bufferRef.current);
    lastCommittedRef.current = bufferRef.current;
  }, [onCommit, normalizeEmptyEditor]);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<E>) => {
      if (isComposingRef.current) return;
      // Escape: revert to last committed value and blur without committing
      if (e.key === 'Escape') {
        e.preventDefault();
        const el = editableRef.current as unknown as HTMLElement | null;
        if (el) {
          el.innerText = lastCommittedRef.current ?? '';
          bufferRef.current = lastCommittedRef.current ?? '';
          suppressNextBlurCommitRef.current = true;
          (el as HTMLElement).blur();
        }
        return;
      }
      // Cmd/Ctrl + Enter: force commit immediately (for multiline)
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (timerRef.current) clearTimeout(timerRef.current);
        onCommit(bufferRef.current);
        lastCommittedRef.current = bufferRef.current;
        return;
      }
      // Enter behavior
      if (e.key !== 'Enter') return;
      e.preventDefault();
      if (singleLine) {
        (e.currentTarget as unknown as HTMLElement).blur();
        return;
      }
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode('\n'));
      range.collapse(false);
      const el = editableRef.current as unknown as HTMLElement | null;
      if (el) bufferRef.current = el.innerText ?? '';
      scheduleCommit();
    },
    [scheduleCommit, singleLine, onCommit],
  );

  const handlePaste = React.useCallback(
    (e: React.ClipboardEvent<E>) => {
      e.preventDefault();
      const raw = e.clipboardData.getData('text/plain');
      const text = singleLine ? raw.replace(/\s*\n\s*/g, ' ') : raw;
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(text));
      range.collapse(false);
      const el = editableRef.current as unknown as HTMLElement | null;
      if (el) bufferRef.current = normalizeEmptyEditor(el);
      scheduleCommit();
    },
    [scheduleCommit, singleLine, normalizeEmptyEditor],
  );

  const handleCompositionStart = React.useCallback(() => {
    isComposingRef.current = true;
  }, []);

  const handleCompositionEnd = React.useCallback(() => {
    isComposingRef.current = false;
    const el = editableRef.current as unknown as HTMLElement | null;
    if (el) bufferRef.current = normalizeEmptyEditor(el);
    scheduleCommit();
  }, [scheduleCommit, normalizeEmptyEditor]);

  React.useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  return {
    editableRef: editableRef as unknown as React.RefObject<E>,
    initialTextRef: initialTextRef as React.MutableRefObject<string>,
    handleInput,
    handleBlur,
    handleKeyDown,
    handlePaste,
    handleCompositionStart,
    handleCompositionEnd,
  };
}

// Compose multiple refs (callback or ref objects) into a single ref callback
export function composeRefs<T>(...refs: Array<React.Ref<T> | undefined>) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (!ref) continue;
      if (typeof ref === 'function') {
        ref(node);
      } else {
        (ref as React.MutableRefObject<T | null>).current = node;
      }
    }
  };
}

// Utility to build className for editable elements
export function editableClassName(base: string | undefined, singleLine: boolean) {
  const common =
    'max-w-full w-full ring-0 outline-none min-h-[1em] selection:bg-primary selection:text-primary-foreground';
  const wrap = singleLine ? 'whitespace-nowrap' : 'whitespace-pre-wrap break-words';
  return cn(common, wrap, base);
}
