'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './auth-context';
import type { Organization, OrganizationSettings } from 'shared-types';

export interface OrgContextType {
  organization: Organization | null;
  settings: OrganizationSettings | null;
  isLoading: boolean;
  error: Error | null;
  refreshOrganization: () => Promise<void>;
  updateSettings: (settings: Partial<OrganizationSettings>) => Promise<{ error: Error | null }>;
}

const OrgContext = createContext<OrgContextType | undefined>(undefined);

interface OrgProviderProps {
  children: ReactNode;
}

export function OrgProvider({ children }: OrgProviderProps) {
  const { user, isAuthenticated } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [settings, setSettings] = useState<OrganizationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();

  const fetchOrganization = useCallback(async () => {
    if (!user?.organizationId) {
      setOrganization(null);
      setSettings(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', user.organizationId)
      .single();

    if (fetchError) {
      setError(new Error(fetchError.message));
      setIsLoading(false);
      return;
    }

    setOrganization(data as Organization);
    setSettings(data.settings as OrganizationSettings);
    setIsLoading(false);
  }, [user?.organizationId, supabase]);

  useEffect(() => {
    if (isAuthenticated && user?.organizationId) {
      fetchOrganization();
    } else {
      setOrganization(null);
      setSettings(null);
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.organizationId, fetchOrganization]);

  const refreshOrganization = async () => {
    await fetchOrganization();
  };

  const updateSettings = async (newSettings: Partial<OrganizationSettings>) => {
    if (!organization) {
      return { error: new Error('No organization loaded') };
    }

    const mergedSettings = {
      ...settings,
      ...newSettings,
    };

    const { error: updateError } = await supabase
      .from('organizations')
      .update({
        settings: mergedSettings,
        updated_at: new Date().toISOString(),
      })
      .eq('id', organization.id);

    if (updateError) {
      return { error: new Error(updateError.message) };
    }

    setSettings(mergedSettings as OrganizationSettings);
    return { error: null };
  };

  return (
    <OrgContext.Provider
      value={{
        organization,
        settings,
        isLoading,
        error,
        refreshOrganization,
        updateSettings,
      }}
    >
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  const context = useContext(OrgContext);
  if (context === undefined) {
    throw new Error('useOrg must be used within an OrgProvider');
  }
  return context;
}
