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
 *     default: () => <Fallback />,
 *   }}
 * </Switch>
 */

type PropertyKeyLike = string | number | symbol;

type SwitchCases<T extends PropertyKeyLike> = Partial<Record<T, () => React.ReactNode>> & {
  default?: () => React.ReactNode;
};

export type SwitchProps<T extends PropertyKeyLike> = {
  /**
   * The value to match. Can be a raw value (e.g., 'chat') or a function returning the value.
   */
  value: T | (() => T);
  /**
   * Object of case renderers keyed by the case value, with an optional `default`.
   */
  children: SwitchCases<T>;
};

export function Switch<T extends PropertyKeyLike>({ value, children }: SwitchProps<T>) {
  const resolved = (typeof value === 'function' ? (value as () => T)() : value) as T;
  const render =
    (children as Record<PropertyKeyLike, (() => React.ReactNode) | undefined>)[resolved] ?? children.default;
  return render ? <>{render()}</> : null;
}
