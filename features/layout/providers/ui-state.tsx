'use client';

import { observable } from '@legendapp/state';
import { syncObservable } from '@legendapp/state/sync';
import { ObservablePersistLocalStorage } from '@legendapp/state/persist-plugins/local-storage';
import { Color } from '@/types/ui';

/**
 * Locally persisted UI-only state.
 * - Persisted to localStorage for instant UX and per-device behavior.
 * - Do NOT store server-derived or org/team data here.
 * - Use theme tokens (e.g., 'primary') rather than raw Tailwind color values.
 */
export type UIState = {
  iconPicker: {
    tab: 'icons' | 'emoji' | 'upload';
    iconColor: Color;
  };
};

const DEFAULT_UI_STATE: UIState = {
  iconPicker: {
    tab: 'icons',
    iconColor: 'default',
  },
};

export const uiState$ = observable<UIState>(DEFAULT_UI_STATE);

const PERSIST_KEY = 'ui-state-v1';

// Initialize Local Storage persistence immediately per docs:
// This loads/merges saved values on init and persists subsequent changes.
syncObservable(uiState$, {
  persist: {
    name: PERSIST_KEY,
    plugin: ObservablePersistLocalStorage,
  },
});

export const UIStateProvider = () => null;
