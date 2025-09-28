'use client';

import * as React from 'react';

/**
 * Legend-like Switch for React (no observables required)
 *
 * Usage:
 * <Switch value={() => sectionId}>
 *   {{
 *     teams: () => <Teams />,
 *     private: () => <Private />,
 *     // Optional case for when value is undefined
 *     undefined: () => <UndefinedCase />,
 *     default: () => <Fallback />,
 *   }}
 * </Switch>
 */

type PropertyKeyLike = string | number | symbol;

type SwitchCases<T extends PropertyKeyLike> = Partial<Record<T, () => React.ReactNode>> & {
  /** Rendered when no case matches */
  default?: () => React.ReactNode;
  /** Rendered when the resolved value is strictly undefined */
  ['undefined']?: () => React.ReactNode;
};

export type SwitchProps<T extends PropertyKeyLike> = {
  /**
   * The value to match. Can be a raw value (e.g., 'chat') or a function returning the value.
   */
  value: T | undefined | (() => T | undefined);
  /**
   * Object of case renderers keyed by the case value, with an optional `default`.
   */
  children: SwitchCases<T>;
};

export function Switch<T extends PropertyKeyLike>({ value, children }: SwitchProps<T>) {
  // Resolve value whether a thunk or raw value; allow undefined
  const resolved = (typeof value === 'function' ? (value as () => T | undefined)() : value) as T | undefined;

  const render =
    (resolved === undefined
      ? children['undefined']
      : (children as Record<PropertyKeyLike, (() => React.ReactNode) | undefined>)[
          resolved as unknown as PropertyKeyLike
        ]) ?? children.default;

  return render ? <>{render()}</> : null;
}
