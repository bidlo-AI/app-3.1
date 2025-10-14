import * as React from 'react';

// Shared options for editable components (div, h1, etc.)
export type EditableOptions = {
  /** Initial value to display; external changes sync when not focused. */
  initialValue?: string;
  /** Placeholder shown when empty. */
  placeholder?: string;
  /** Debounce for onCommit in ms when typing; onBlur commits immediately. */
  debounceMs?: number;
  /** If true, enforce single-line behavior (no newlines, Enter blurs). */
  singleLine?: boolean;
  /** Called with latest value on blur and after debounce. */
  onCommit: (value: string) => void;
  /** Whether to enable browser spellcheck. */
  spellCheck?: boolean;
};

// Base prop omission for contentEditable elements
export type OmittedContentEditableProps<T extends keyof React.JSX.IntrinsicElements> = Omit<
  React.ComponentProps<T>,
  'contentEditable' | 'children' | 'onInput' | 'onBlur' | 'onPaste' | 'onKeyDown'
>;

// Typed props for specific elements
export type EditableDivProps = OmittedContentEditableProps<'div'> & EditableOptions;
export type EditableH1Props = OmittedContentEditableProps<'h1'> & EditableOptions;

// Return type for the editable core hook
export type EditableCoreReturn<E extends HTMLElement> = {
  editableRef: React.RefObject<E>;
  initialTextRef: React.MutableRefObject<string>;
  handleInput: (e: React.FormEvent<E>) => void;
  handleBlur: () => void;
  handleKeyDown: (e: React.KeyboardEvent<E>) => void;
  handlePaste: (e: React.ClipboardEvent<E>) => void;
  handleCompositionStart: (e: React.CompositionEvent<E>) => void;
  handleCompositionEnd: (e: React.CompositionEvent<E>) => void;
};
