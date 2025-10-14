'use client';

import * as React from 'react';
import { editableClassName, useEditableCore, composeRefs } from '../lib';
import { EditableDivProps } from '../types';

// Notion-style contentEditable div (multiline by default)
export const EditableDiv = React.forwardRef<HTMLDivElement, EditableDivProps>(
  (
    {
      initialValue = '',
      placeholder,
      debounceMs = 500,
      singleLine = false,
      onCommit,
      spellCheck = true,
      className,
      style,
      ...rest
    },
    ref,
  ) => {
    const {
      editableRef,
      initialTextRef,
      handleInput,
      handleBlur,
      handleKeyDown,
      handlePaste,
      handleCompositionStart,
      handleCompositionEnd,
    } = useEditableCore<HTMLDivElement>({
      onCommit,
      initialValue,
      debounceMs,
      singleLine,
    });

    return (
      <div
        ref={composeRefs<HTMLDivElement>(editableRef as React.Ref<HTMLDivElement>, ref)}
        spellCheck={spellCheck}
        contentEditable
        role="textbox"
        aria-multiline={!singleLine}
        tabIndex={0}
        aria-label={'Start typing to edit text'}
        data-content-editable-leaf="true"
        data-placeholder={placeholder}
        suppressContentEditableWarning
        onInput={handleInput}
        onBlur={handleBlur}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        className={editableClassName(className, singleLine)}
        style={{ caretColor: 'var(--foreground)', ...style }}
        {...rest}
      >
        {initialTextRef.current}
      </div>
    );
  },
);

EditableDiv.displayName = 'EditableDiv';

export default EditableDiv;
