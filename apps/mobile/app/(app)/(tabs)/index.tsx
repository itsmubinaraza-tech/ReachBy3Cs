import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { useState } from 'react';

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    // TODO: Fetch fresh data
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View className="p-4">
        {/* Quick Stats */}
        <View className="mb-6">
          <Text className="mb-3 text-lg font-semibold text-gray-900">Today's Overview</Text>
          <View className="flex-row flex-wrap gap-3">
            <View className="flex-1 min-w-[140px] rounded-xl bg-white p-4 shadow-sm">
              <Text className="text-2xl font-bold text-gray-900">12</Text>
              <Text className="text-sm text-gray-500">Pending Review</Text>
            </View>
            <View className="flex-1 min-w-[140px] rounded-xl bg-white p-4 shadow-sm">
              <Text className="text-2xl font-bold text-green-600">8</Text>
              <Text className="text-sm text-gray-500">Approved Today</Text>
            </View>
            <View className="flex-1 min-w-[140px] rounded-xl bg-white p-4 shadow-sm">
              <Text className="text-2xl font-bold text-blue-600">5</Text>
              <Text className="text-sm text-gray-500">Auto-Posted</Text>
            </View>
            <View className="flex-1 min-w-[140px] rounded-xl bg-white p-4 shadow-sm">
              <Text className="text-2xl font-bold text-gray-900">45</Text>
              <Text className="text-sm text-gray-500">Total Detected</Text>
            </View>
          </View>
        </View>

        {/* Recent Activity */}
        <View className="mb-6">
          <Text className="mb-3 text-lg font-semibold text-gray-900">Recent Activity</Text>
          <View className="rounded-xl bg-white p-4 shadow-sm">
            <View className="space-y-3">
              <View className="flex-row items-center">
                <View className="mr-3 h-2 w-2 rounded-full bg-green-500" />
                <Text className="flex-1 text-sm text-gray-700">Response approved for r/relationships</Text>
                <Text className="text-xs text-gray-400">2m ago</Text>
              </View>
              <View className="flex-row items-center">
                <View className="mr-3 h-2 w-2 rounded-full bg-blue-500" />
                <Text className="flex-1 text-sm text-gray-700">Auto-posted to Twitter</Text>
                <Text className="text-xs text-gray-400">15m ago</Text>
              </View>
              <View className="flex-row items-center">
                <View className="mr-3 h-2 w-2 rounded-full bg-yellow-500" />
                <Text className="flex-1 text-sm text-gray-700">New high-risk item flagged</Text>
                <Text className="text-xs text-gray-400">1h ago</Text>
              </View>
            </View>
          </View>
        </View>

        {/* System Status */}
        <View>
          <Text className="mb-3 text-lg font-semibold text-gray-900">System Status</Text>
          <View className="rounded-xl bg-white p-4 shadow-sm">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-gray-700">All Systems Operational</Text>
              <View className="h-3 w-3 rounded-full bg-green-500" />
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
