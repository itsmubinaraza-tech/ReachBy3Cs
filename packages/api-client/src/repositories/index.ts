import type { SupabaseClient } from '@supabase/supabase-js';
import { OrganizationRepository } from './organizations';
import { UserRepository } from './users';
import { PostRepository } from './posts';
import { ResponseRepository } from './responses';
import { ClusterRepository } from './clusters';
import { AuditLogRepository } from './audit';
import { ProjectRepository } from './projects';
import { ProjectSearchConfigRepository } from './project-search-configs';

// Export individual repositories
export { BaseRepository } from './base';
export { OrganizationRepository } from './organizations';
export { UserRepository } from './users';
export { PostRepository } from './posts';
export { ResponseRepository } from './responses';
export { ClusterRepository } from './clusters';
export { AuditLogRepository } from './audit';
export { ProjectRepository } from './projects';
export { ProjectSearchConfigRepository } from './project-search-configs';

// Export audit log insert type
export type { AuditLogInsert } from './audit';

/**
 * Repository factory that creates all repositories with a shared Supabase client
 */
export interface Repositories {
  organizations: OrganizationRepository;
  users: UserRepository;
  posts: PostRepository;
  responses: ResponseRepository;
  clusters: ClusterRepository;
  auditLog: AuditLogRepository;
  projects: ProjectRepository;
  projectSearchConfigs: ProjectSearchConfigRepository;
}

/**
 * Create all repositories with a shared Supabase client
 */
export function createRepositories(supabase: SupabaseClient): Repositories {
  return {
    organizations: new OrganizationRepository(supabase),
    users: new UserRepository(supabase),
    posts: new PostRepository(supabase),
    responses: new ResponseRepository(supabase),
    clusters: new ClusterRepository(supabase),
    auditLog: new AuditLogRepository(supabase),
    projects: new ProjectRepository(supabase),
    projectSearchConfigs: new ProjectSearchConfigRepository(supabase),
  };
}

// Singleton instance for server-side usage
let repositoriesInstance: Repositories | null = null;

/**
 * Get or create repositories singleton
 * For server-side usage where we want to reuse connections
 */
export function getRepositories(supabase: SupabaseClient): Repositories {
  if (!repositoriesInstance) {
    repositoriesInstance = createRepositories(supabase);
  }
  return repositoriesInstance;
}

/**
 * Reset repositories singleton (useful for testing)
 */
export function resetRepositories(): void {
  repositoriesInstance = null;
}
