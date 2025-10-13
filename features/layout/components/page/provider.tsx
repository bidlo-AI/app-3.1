'use client';

import { createContext, useContext, useEffect } from 'react';
import { Observable, mergeIntoObservable } from '@legendapp/state';
import { Doc } from '@/convex/_generated/dataModel';
import { useObservable } from '@legendapp/state/react';
import { Preloaded, usePreloadedQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

type PageProviderState = {
  icon: Doc<'blocks'>['icon'];
  title: Doc<'blocks'>['title'];
  show_description: boolean;
  description: string;
};

export const PageProviderContext = createContext<Observable<PageProviderState> | null>(null);

export const PageProvider = ({
  data,
  preloaded,
  children,
}: {
  data: Doc<'blocks'>;
  preloaded: Preloaded<typeof api.blocks.getBlock>;
  children: React.ReactNode;
}) => {
  const state$ = useObservable({
    icon: data.icon,
    title: data.title,
    show_description: true,
    description: 'example description',
  }) as Observable<PageProviderState>;

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
  state$: Observable<PageProviderState>;
}) => {
  const data = usePreloadedQuery(preloaded);
  useEffect(() => {
    mergeIntoObservable(state$, data.block, {
      icon: 'icon',
      title: 'title',
    });
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
