import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { Organization } from 'shared-types';
import { supabase } from '../lib/supabase';
import { AppStorage } from '../lib/storage';
import { useAuth } from './AuthContext';

interface OrganizationContextType {
  organization: Organization | null;
  organizations: Organization[];
  isLoading: boolean;
  selectOrganization: (orgId: string) => Promise<void>;
  refreshOrganizations: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(
  undefined
);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { dbUser, isAuthenticated } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrganizations = useCallback(async () => {
    if (!dbUser) {
      setOrganizations([]);
      setOrganization(null);
      setIsLoading(false);
      return;
    }

    try {
      // Fetch organizations the user belongs to
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', dbUser.organization_id);

      if (error) {
        console.error('Error fetching organizations:', error);
        setIsLoading(false);
        return;
      }

      const orgs = (data ?? []) as Organization[];
      setOrganizations(orgs);

      // Try to restore last selected org
      const savedOrgId = AppStorage.getSelectedOrgId();
      const savedOrg = orgs.find((o) => o.id === savedOrgId);

      if (savedOrg) {
        setOrganization(savedOrg);
      } else if (orgs.length > 0) {
        // Default to first org - safely access with explicit check
        const firstOrg = orgs[0];
        if (firstOrg) {
          setOrganization(firstOrg);
          AppStorage.setSelectedOrgId(firstOrg.id);
        }
      }
    } catch (error) {
      console.error('Error in fetchOrganizations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [dbUser]);

  useEffect(() => {
    if (isAuthenticated && dbUser) {
      fetchOrganizations();
    } else {
      setOrganization(null);
      setOrganizations([]);
      setIsLoading(false);
    }
  }, [isAuthenticated, dbUser, fetchOrganizations]);

  const selectOrganization = useCallback(async (orgId: string) => {
    const org = organizations.find((o) => o.id === orgId);
    if (org) {
      setOrganization(org);
      AppStorage.setSelectedOrgId(orgId);
    }
  }, [organizations]);

  const refreshOrganizations = useCallback(async () => {
    setIsLoading(true);
    await fetchOrganizations();
  }, [fetchOrganizations]);

  const value: OrganizationContextType = {
    organization,
    organizations,
    isLoading,
    selectOrganization,
    refreshOrganizations,
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
}
