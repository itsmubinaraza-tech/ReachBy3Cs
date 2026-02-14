import { View, Text, ScrollView } from 'react-native';

export default function AnalyticsScreen() {
  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        {/* Period selector */}
        <View className="mb-6 flex-row justify-center gap-2">
          <View className="rounded-full bg-gray-900 px-4 py-2">
            <Text className="text-sm font-medium text-white">Today</Text>
          </View>
          <View className="rounded-full bg-gray-100 px-4 py-2">
            <Text className="text-sm font-medium text-gray-700">Week</Text>
          </View>
          <View className="rounded-full bg-gray-100 px-4 py-2">
            <Text className="text-sm font-medium text-gray-700">Month</Text>
          </View>
        </View>

        {/* Key metrics */}
        <View className="mb-6">
          <Text className="mb-3 text-lg font-semibold text-gray-900">Key Metrics</Text>
          <View className="flex-row flex-wrap gap-3">
            <View className="flex-1 min-w-[45%] rounded-xl bg-white p-4 shadow-sm">
              <Text className="text-3xl font-bold text-gray-900">156</Text>
              <Text className="text-sm text-gray-500">Posts Detected</Text>
              <Text className="mt-1 text-xs text-green-600">+12% vs yesterday</Text>
            </View>
            <View className="flex-1 min-w-[45%] rounded-xl bg-white p-4 shadow-sm">
              <Text className="text-3xl font-bold text-green-600">78%</Text>
              <Text className="text-sm text-gray-500">Approval Rate</Text>
              <Text className="mt-1 text-xs text-green-600">+5% vs yesterday</Text>
            </View>
            <View className="flex-1 min-w-[45%] rounded-xl bg-white p-4 shadow-sm">
              <Text className="text-3xl font-bold text-blue-600">42</Text>
              <Text className="text-sm text-gray-500">Auto-Posted</Text>
              <Text className="mt-1 text-xs text-green-600">+8% vs yesterday</Text>
            </View>
            <View className="flex-1 min-w-[45%] rounded-xl bg-white p-4 shadow-sm">
              <Text className="text-3xl font-bold text-gray-900">0.82</Text>
              <Text className="text-sm text-gray-500">Avg CTS Score</Text>
              <Text className="mt-1 text-xs text-green-600">+0.03 vs yesterday</Text>
            </View>
          </View>
        </View>

        {/* Platform breakdown */}
        <View className="mb-6">
          <Text className="mb-3 text-lg font-semibold text-gray-900">By Platform</Text>
          <View className="rounded-xl bg-white p-4 shadow-sm">
            <View className="mb-3 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="mr-3 h-3 w-3 rounded-full bg-orange-500" />
                <Text className="text-sm text-gray-700">Reddit</Text>
              </View>
              <Text className="font-medium text-gray-900">89 posts</Text>
            </View>
            <View className="mb-3 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="mr-3 h-3 w-3 rounded-full bg-blue-500" />
                <Text className="text-sm text-gray-700">Twitter</Text>
              </View>
              <Text className="font-medium text-gray-900">45 posts</Text>
            </View>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="mr-3 h-3 w-3 rounded-full bg-red-500" />
                <Text className="text-sm text-gray-700">Quora</Text>
              </View>
              <Text className="font-medium text-gray-900">22 posts</Text>
            </View>
          </View>
        </View>

        {/* Risk distribution */}
        <View>
          <Text className="mb-3 text-lg font-semibold text-gray-900">Risk Distribution</Text>
          <View className="rounded-xl bg-white p-4 shadow-sm">
            <View className="mb-3 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="mr-3 h-3 w-3 rounded-full bg-green-500" />
                <Text className="text-sm text-gray-700">Low Risk</Text>
              </View>
              <Text className="font-medium text-gray-900">68%</Text>
            </View>
            <View className="mb-3 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="mr-3 h-3 w-3 rounded-full bg-yellow-500" />
                <Text className="text-sm text-gray-700">Medium Risk</Text>
              </View>
              <Text className="font-medium text-gray-900">24%</Text>
            </View>
            <View className="mb-3 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="mr-3 h-3 w-3 rounded-full bg-orange-500" />
                <Text className="text-sm text-gray-700">High Risk</Text>
              </View>
              <Text className="font-medium text-gray-900">6%</Text>
            </View>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="mr-3 h-3 w-3 rounded-full bg-red-500" />
                <Text className="text-sm text-gray-700">Blocked</Text>
              </View>
              <Text className="font-medium text-gray-900">2%</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
