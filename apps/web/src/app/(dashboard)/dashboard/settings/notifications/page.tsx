'use client';

import { NotificationToggles, type NotificationPreferencesData } from '@/components/settings';
import { useNotificationPreferences } from '@/hooks/use-settings';

export default function NotificationsSettingsPage() {
  const { preferences, isLoading, savePreferences } = useNotificationPreferences();

  if (isLoading || !preferences) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading notification preferences...</p>
        </div>
      </div>
    );
  }

  const handleSave = async (data: NotificationPreferencesData) => {
    return savePreferences(data);
  };

  return (
    <div className="space-y-6">
      <NotificationToggles
        initialPreferences={preferences}
        onSave={handleSave}
      />

      {/* Info Card */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
          About Notifications
        </h3>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
          <li>
            <strong>Push notifications</strong> are delivered in real-time to your browser or mobile device when you have the app open.
          </li>
          <li>
            <strong>Email notifications</strong> are sent to your registered email address and can be used for digest summaries.
          </li>
          <li>
            High-risk alerts are important for immediate attention and help maintain your brand's reputation.
          </li>
        </ul>
      </div>

      {/* Browser Permission Notice */}
      {typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted' && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <BellIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                Enable Browser Notifications
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                To receive push notifications, you need to allow notifications in your browser.
              </p>
              <button
                onClick={() => {
                  Notification.requestPermission();
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Enable Notifications
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}
