'use client';

import * as React from 'react';
import { editableClassName, useEditableCore } from '../lib';
import { EditableH1Props } from '../types';

// Notion-style contentEditable h1 with single-line behavior.
export function EditableH1({
  initialValue = '',
  placeholder,
  debounceMs = 500,
  singleLine = true,
  onCommit,
  spellCheck = true,
  className,
  style,
  ...rest
}: EditableH1Props) {
  const {
    editableRef,
    initialTextRef,
    handleInput,
    handleBlur,
    handleKeyDown,
    handlePaste,
    handleCompositionStart,
    handleCompositionEnd,
  } = useEditableCore<HTMLHeadingElement>({
    onCommit,
    initialValue,
    debounceMs,
    singleLine,
  });

  return (
    <h1
      ref={editableRef}
      spellCheck={spellCheck}
      contentEditable
      role="textbox"
      aria-multiline={!singleLine}
      tabIndex={0}
      aria-label={'Edit title'}
      data-content-editable-leaf="true"
      data-placeholder={placeholder}
      suppressContentEditableWarning
      onInput={handleInput}
      onBlur={handleBlur}
      onPaste={handlePaste}
      onKeyDown={handleKeyDown}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
      className={editableClassName(
        className ??
          'truncate w-full font-bold h-auto p-0 border-0 bg-transparent shadow-none rounded-none leading-tight focus-visible:ring-0 focus-visible:border-0',
        singleLine,
      )}
      style={{ caretColor: 'var(--foreground)', ...style }}
      {...rest}
    >
      {initialTextRef.current}
    </h1>
  );
}

export default EditableH1;
