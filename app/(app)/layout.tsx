import { Header } from '@/features/layout/components/header';
import { HotkeysProvider } from '@/features/layout/providers/hotkeys';
import { Sidebar } from '@/features/layout/components/sidebar';
import { Suspense } from 'react';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { preloadQuery, preloadedQueryResult } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';
import { SidebarProvider } from '@/features/layout/components/sidebar/providers/SidebarProvider';
import { AgentPanel } from '@/features/agent/features/panel';
import { AgentProvider } from '@/features/agent/features/panel/providers/agentProvider';
import { CommandProvider } from '@/features/layout/components/command/providers/CommandProvider';
import { redirect } from 'next/navigation';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const { accessToken } = await withAuth();
  const preloaded = await preloadQuery(api.users.getUser, {}, { token: accessToken });
  const u = await preloadedQueryResult(preloaded);

  //get orgId from accessToken
  const orgId = accessToken && JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64url').toString())?.organization;
  if (!orgId) return redirect('/organizations');

  return (
    <SidebarProvider sidebar_hidden={u.sidebar_hidden}>
      <CommandProvider>
        <AgentProvider agent_panel_hidden={u.agent_panel_hidden} agent_panel_page={u.agent_panel_page}>
          <Sidebar startingWidth={u.sidebar_width} preloadedUser={preloaded} orgId={orgId} />
          <div className="grid grid-app-layout flex-1 overflow-hidden relative">
            <Header preloadedUser={preloaded} orgId={orgId} />
            {children}
            {/* <Peek /> */}
          </div>
          <AgentPanel startingWidth={u.agent_panel_width} />
          <Suspense fallback={null}>
            <HotkeysProvider />
          </Suspense>
        </AgentProvider>
      </CommandProvider>
    </SidebarProvider>
  );
}
