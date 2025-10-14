'use client';

import { createContext, useContext, useEffect } from 'react';
import { Observable, mergeIntoObservable } from '@legendapp/state';
import { useObservable } from '@legendapp/state/react';
import { Preloaded, usePreloadedQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

// Use the API return type as the base shape and add a derived field
type PageState = (typeof api.blocks.getBlock._returnType)['block'];

export const PageProviderContext = createContext<Observable<PageState> | null>(null);

// Provider for the page state uses observables to keep the state in sync without causing re-renders
export const PageProvider = ({
  data,
  preloaded,
  children,
}: {
  data: typeof api.blocks.getBlock._returnType;
  preloaded: Preloaded<typeof api.blocks.getBlock>;
  children: React.ReactNode;
}) => {
  const state$ = useObservable(data.block);

  return (
    <PageProviderContext.Provider value={state$}>
      {children}
      <PageListener preloaded={preloaded} state$={state$} />
    </PageProviderContext.Provider>
  );
};

const PageListener = ({
  preloaded,
  state$,
}: {
  preloaded: Preloaded<typeof api.blocks.getBlock>;
  state$: Observable<PageState>;
}) => {
  const data = usePreloadedQuery(preloaded);
  useEffect(() => {
    mergeIntoObservable(state$, data.block);
  }, [data.block, state$]);

  return null;
};

export const usePage = () => {
  const context = useContext(PageProviderContext);
  if (!context) {
    throw new Error('usePage must be used within a PageProvider');
  }
  return context;
};
