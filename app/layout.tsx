import './globals.css';
import type { Metadata } from 'next';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { ConvexClientProvider } from '@/features/layout/providers/ConvexClientProvider';
import { ThemeSubscription } from '@/features/layout/components/theme/server';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { UIStateProvider } from '@/features/layout/providers/ui-state';

const enviorment = `${process.env.NEXT_PUBLIC_ENVIROMENT ?? 'production'}` as 'production' | 'staging' | 'development';
const fav_icon = {
  light: {
    production: '/meta/favicons/favicon-light.ico',
    staging: '/meta/favicons/favicon-light-staging.ico',
    development: '/meta/favicons/favicon-light-development.ico',
  },
  dark: {
    production: '/meta/favicons/favicon-dark.ico',
    staging: '/meta/favicons/favicon-dark-staging.ico',
    development: '/meta/favicons/favicon-dark-development.ico',
  },
};

export const metadata: Metadata = {
  title: {
    template: '%s | Bidlo',
    default: 'Bidlo',
  },
  description: 'AI bidding and analytics for civil and public works contractors',
  icons: {
    icon: [
      {
        url: fav_icon.light[enviorment],
        media: '(prefers-color-scheme: light)',
      },
      {
        url: fav_icon.dark[enviorment],
        media: '(prefers-color-scheme: dark)',
      },
    ],
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased flex min-h-screen text-sm">
        <ConvexClientProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem={false}>
            <NuqsAdapter>
              {children}
              <Toaster position="top-center" />
              <ThemeSubscription />
              <UIStateProvider />
            </NuqsAdapter>
          </ThemeProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
