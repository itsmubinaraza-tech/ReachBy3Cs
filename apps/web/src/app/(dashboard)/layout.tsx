'use client';

import type { ReactNode } from 'react';
import { AuthProvider } from '@/contexts/auth-context';
import { OrgProvider } from '@/contexts/org-context';
import { ResponsiveLayout } from '@/components/layout';
import { TrialBanner } from '@/components/trial/trial-banner';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <AuthProvider>
      <OrgProvider>
        <TrialBanner />
        <ResponsiveLayout>{children}</ResponsiveLayout>
      </OrgProvider>
    </AuthProvider>
  );
}
