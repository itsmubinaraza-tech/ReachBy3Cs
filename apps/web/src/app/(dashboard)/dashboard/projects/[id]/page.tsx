'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useProject, useProjects } from '@/hooks/use-projects';
import { useSearchConfigs, type CreateSearchConfigData } from '@/hooks/use-search-configs';
import { SearchConfigForm, type SearchConfigFormData } from '@/components/projects/search-config-form';
import type { ProjectSearchConfig, ProjectTone, ProjectStatus } from 'shared-types';

const statusColors: Record<ProjectStatus, { bg: string; text: string }> = {
  active: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400' },
  paused: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400' },
  archived: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-400' },
};

const toneLabels: Record<ProjectTone, string> = {
  professional: 'Professional',
  casual: 'Casual',
  friendly: 'Friendly',
  technical: 'Technical',
  empathetic: 'Empathetic',
};

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;

  const { project, isLoading, error, refresh } = useProject(projectId);
  const { deleteProject } = useProjects();
  const { createConfig, updateConfig, deleteConfig } = useSearchConfigs(projectId);

  const [showConfigForm, setShowConfigForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ProjectSearchConfig | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleSaveConfig = async (data: SearchConfigFormData) => {
    const configData: CreateSearchConfigData = {
      ...data,
    };

    if (editingConfig) {
      const result = await updateConfig(editingConfig.id, configData);
      if (result.success) {
        setEditingConfig(null);
        setShowConfigForm(false);
        refresh();
      }
      return result;
    } else {
      const result = await createConfig(configData);
      if (result.success) {
        setShowConfigForm(false);
        refresh();
      }
      return result;
    }
  };

  const handleDeleteConfig = async (configId: string) => {
    if (!confirm('Are you sure you want to delete this search configuration?')) {
      return;
    }

    const result = await deleteConfig(configId);
    if (result.success) {
      refresh();
    }
  };

  const handleDeleteProject = async () => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    const result = await deleteProject(projectId);

    if (result.success) {
      router.push('/dashboard/projects');
    } else {
      setDeleteError(result.error || 'Failed to delete project');
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 space-y-4">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">
            Error Loading Project
          </h2>
          <p className="text-red-600 dark:text-red-400">{error || 'Project not found'}</p>
          <Link
            href="/dashboard/projects"
            className="mt-4 inline-block text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  const statusStyle = statusColors[project.status];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <nav className="mb-6">
        <Link
          href="/dashboard/projects"
          className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Projects
        </Link>
      </nav>

      {/* Project Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {project.name}
            </h1>
            <span
              className={`px-2 py-0.5 text-xs font-medium rounded-full capitalize ${statusStyle.bg} ${statusStyle.text}`}
            >
              {project.status}
            </span>
          </div>
          {project.description && (
            <p className="text-gray-600 dark:text-gray-400">{project.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/projects/${project.id}/edit`}>
            <button className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors">
              Edit Project
            </button>
          </Link>
          <button
            onClick={handleDeleteProject}
            disabled={isDeleting}
            className="px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-md transition-colors disabled:opacity-50"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>

      {deleteError && (
        <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-600 dark:text-red-400">{deleteError}</p>
        </div>
      )}

      {/* Project Details Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Project Details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Tone</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">{toneLabels[project.tone]}</dd>
          </div>
          {project.target_audience && (
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Target Audience</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">{project.target_audience}</dd>
            </div>
          )}
          {project.value_proposition && (
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Value Proposition</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white italic">&quot;{project.value_proposition}&quot;</dd>
            </div>
          )}
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
              {new Date(project.created_at).toLocaleDateString()}
            </dd>
          </div>
        </div>
      </div>

      {/* Search Configurations Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Search Configurations
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {project.config_count} of 10 configurations
            </p>
          </div>
          {!showConfigForm && !editingConfig && project.config_count < 10 && (
            <button
              onClick={() => setShowConfigForm(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              Add Configuration
            </button>
          )}
        </div>

        {/* Config Form (shown when adding/editing) */}
        {(showConfigForm || editingConfig) && (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">
              {editingConfig ? 'Edit Configuration' : 'New Configuration'}
            </h3>
            <SearchConfigForm
              projectId={projectId}
              config={editingConfig || undefined}
              existingConfigCount={project.config_count}
              onSave={handleSaveConfig}
              onCancel={() => {
                setShowConfigForm(false);
                setEditingConfig(null);
              }}
            />
          </div>
        )}

        {/* Configs List */}
        {project.search_configs.length === 0 && !showConfigForm ? (
          <div className="text-center py-8">
            <svg
              className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No search configurations yet. Add one to start finding conversations.
            </p>
            <button
              onClick={() => setShowConfigForm(true)}
              className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              Add your first configuration
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {project.search_configs.map((config) => (
              <div
                key={config.id}
                className={`p-4 border rounded-lg ${
                  config.is_active
                    ? 'border-gray-200 dark:border-gray-700'
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 opacity-75'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {config.name}
                      </h3>
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full ${
                          config.is_active
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                        }`}
                      >
                        {config.is_active ? 'Active' : 'Paused'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {config.keywords.slice(0, 5).map((keyword) => (
                        <span
                          key={keyword}
                          className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded"
                        >
                          {keyword}
                        </span>
                      ))}
                      {config.keywords.length > 5 && (
                        <span className="px-2 py-0.5 text-xs text-gray-500 dark:text-gray-400">
                          +{config.keywords.length - 5} more
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>
                        {config.platforms.join(', ')}
                      </span>
                      <span>
                        {config.matching_mode} matching
                      </span>
                      <span>
                        {config.crawl_frequency}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => setEditingConfig(config)}
                      className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteConfig(config.id)}
                      className="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
