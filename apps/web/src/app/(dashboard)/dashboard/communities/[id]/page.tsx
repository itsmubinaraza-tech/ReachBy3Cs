'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ClusterDetailView, ClusterPagination } from '@/components/communities';
import { useClusterDetail, useClusterPosts } from '@/hooks/use-clusters';
import { useState } from 'react';

export default function ClusterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clusterId = params.id as string;

  const [postsPage, setPostsPage] = useState(1);

  // Fetch cluster details
  const {
    cluster,
    loading: clusterLoading,
    error: clusterError,
  } = useClusterDetail(clusterId);

  // Fetch cluster posts
  const {
    posts,
    total: totalPosts,
    loading: postsLoading,
    totalPages: postsTotalPages,
  } = useClusterPosts(clusterId, {
    page: postsPage,
    pageSize: 20,
  });

  // Handle seed community
  const handleSeedCommunity = () => {
    // TODO: Implement seed community functionality
    console.log('Seed community:', clusterId);
  };

  // Handle view all posts
  const handleViewAllPosts = () => {
    // Scroll to posts section or open modal
    const postsSection = document.getElementById('posts-section');
    if (postsSection) {
      postsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Loading state
  if (clusterLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-5xl mx-auto">
          {/* Back button skeleton */}
          <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-6 animate-pulse" />

          {/* Header skeleton */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6 animate-pulse">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-14 h-14 rounded-xl bg-gray-200 dark:bg-gray-700" />
              <div className="flex-1">
                <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (clusterError || !cluster) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-5xl mx-auto">
          <Link
            href="/dashboard/communities"
            className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-6"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Communities
          </Link>

          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Community Not Found
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {clusterError || 'The community you are looking for does not exist.'}
            </p>
            <button
              onClick={() => router.push('/dashboard/communities')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Communities
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/dashboard/communities"
            className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Communities
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <ClusterDetailView
          cluster={cluster}
          posts={posts}
          postsLoading={postsLoading}
          onViewAllPosts={handleViewAllPosts}
          onSeedCommunity={handleSeedCommunity}
        />

        {/* All Posts Section */}
        <div id="posts-section" className="mt-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                All Posts ({totalPosts})
              </h2>
            </div>

            {postsLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                No posts in this community
              </div>
            ) : (
              <>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {posts.map((post) => (
                    <div key={post.id} className="p-4">
                      <p className="text-gray-800 dark:text-gray-200 mb-2">
                        {post.content}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        {post.author && <span>@{post.author}</span>}
                        <span>{new Date(post.detected_at).toLocaleDateString()}</span>
                        <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                          {Math.round(post.similarity_score * 100)}% match
                        </span>
                        {post.url && (
                          <a
                            href={post.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                          >
                            View original
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Posts Pagination */}
                {postsTotalPages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                    <ClusterPagination
                      page={postsPage}
                      totalPages={postsTotalPages}
                      onPageChange={setPostsPage}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
