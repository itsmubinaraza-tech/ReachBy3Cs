import { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

// Mock data for queue items
const MOCK_QUEUE = [
  {
    id: '1',
    platform: 'reddit',
    subreddit: 'r/relationships',
    originalText: "I've been struggling to communicate with my partner about finances...",
    responsePreview: 'I hear you - financial conversations can be really charged...',
    riskLevel: 'low' as const,
    ctaLevel: 0,
    ctsScore: 0.85,
    canAutoPost: true,
    createdAt: '2h ago',
  },
  {
    id: '2',
    platform: 'twitter',
    subreddit: null,
    originalText: 'How do I tell my boss I need a mental health day?',
    responsePreview: "It's great that you're prioritizing your wellbeing...",
    riskLevel: 'medium' as const,
    ctaLevel: 1,
    ctsScore: 0.72,
    canAutoPost: false,
    createdAt: '3h ago',
  },
  {
    id: '3',
    platform: 'reddit',
    subreddit: 'r/emotionalintelligence',
    originalText: "I can't seem to understand why I react so strongly to criticism...",
    responsePreview: 'Strong reactions to criticism often stem from...',
    riskLevel: 'low' as const,
    ctaLevel: 0,
    ctsScore: 0.91,
    canAutoPost: true,
    createdAt: '4h ago',
  },
];

type QueueItem = (typeof MOCK_QUEUE)[0];

function getRiskColor(level: 'low' | 'medium' | 'high' | 'blocked') {
  const colors = {
    low: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-orange-100 text-orange-700',
    blocked: 'bg-red-100 text-red-700',
  };
  return colors[level];
}

function getPlatformIcon(platform: string) {
  switch (platform) {
    case 'reddit':
      return 'logo-reddit';
    case 'twitter':
      return 'logo-twitter';
    default:
      return 'globe-outline';
  }
}

function QueueItemCard({
  item,
  onApprove,
  onReject,
}: {
  item: QueueItem;
  onApprove: () => void;
  onReject: () => void;
}) {
  const translateX = useSharedValue(0);
  const SWIPE_THRESHOLD = 100;

  const handleSwipeComplete = useCallback(
    (direction: 'left' | 'right') => {
      if (direction === 'right') {
        onApprove();
      } else {
        onReject();
      }
    },
    [onApprove, onReject]
  );

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      if (event.translationX > SWIPE_THRESHOLD) {
        translateX.value = withSpring(400, {}, () => {
          runOnJS(handleSwipeComplete)('right');
        });
      } else if (event.translationX < -SWIPE_THRESHOLD) {
        translateX.value = withSpring(-400, {}, () => {
          runOnJS(handleSwipeComplete)('left');
        });
      } else {
        translateX.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View className="relative mb-3 overflow-hidden rounded-xl">
      {/* Background actions */}
      <View className="absolute inset-0 flex-row">
        <View className="flex-1 items-start justify-center bg-green-500 pl-6">
          <View className="flex-row items-center">
            <Ionicons name="checkmark-circle" size={28} color="white" />
            <Text className="ml-2 text-lg font-semibold text-white">Approve</Text>
          </View>
        </View>
        <View className="flex-1 items-end justify-center bg-red-500 pr-6">
          <View className="flex-row items-center">
            <Text className="mr-2 text-lg font-semibold text-white">Reject</Text>
            <Ionicons name="close-circle" size={28} color="white" />
          </View>
        </View>
      </View>

      {/* Card content */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={animatedStyle}>
          <TouchableOpacity
            onPress={() => router.push(`/(app)/queue/${item.id}`)}
            activeOpacity={0.9}
            className="bg-white p-4 shadow-sm"
          >
            {/* Header */}
            <View className="mb-2 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Ionicons
                  name={getPlatformIcon(item.platform) as any}
                  size={18}
                  color="#3b82f6"
                />
                <Text className="ml-2 text-sm font-medium text-gray-700">
                  {item.subreddit || item.platform}
                </Text>
              </View>
              <Text className="text-xs text-gray-400">{item.createdAt}</Text>
            </View>

            {/* Original text preview */}
            <Text className="mb-2 text-sm text-gray-600" numberOfLines={2}>
              "{item.originalText}"
            </Text>

            {/* Response preview */}
            <View className="mb-3 rounded-lg bg-gray-50 p-3">
              <Text className="text-sm text-gray-800" numberOfLines={2}>
                {item.responsePreview}
              </Text>
            </View>

            {/* Metadata */}
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <View className={`rounded-full px-2 py-1 ${getRiskColor(item.riskLevel)}`}>
                  <Text className="text-xs font-medium">
                    {item.riskLevel.charAt(0).toUpperCase() + item.riskLevel.slice(1)}
                  </Text>
                </View>
                <Text className="text-xs text-gray-500">CTA: {item.ctaLevel}</Text>
                <Text className="text-xs text-gray-500">
                  CTS: {(item.ctsScore * 100).toFixed(0)}%
                </Text>
              </View>
              {item.canAutoPost && (
                <View className="flex-row items-center">
                  <Ionicons name="flash" size={14} color="#22c55e" />
                  <Text className="ml-1 text-xs text-green-600">Auto</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

export default function QueueScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [queue, setQueue] = useState(MOCK_QUEUE);

  const onRefresh = async () => {
    setRefreshing(true);
    // TODO: Fetch fresh queue data
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleApprove = (id: string) => {
    Alert.alert('Approved', `Response ${id} has been approved.`);
    setQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const handleReject = (id: string) => {
    Alert.alert('Rejected', `Response ${id} has been rejected.`);
    setQueue((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Filter bar */}
      <View className="flex-row items-center gap-2 bg-white px-4 py-3 shadow-sm">
        <TouchableOpacity className="rounded-full bg-gray-900 px-3 py-1">
          <Text className="text-sm font-medium text-white">All</Text>
        </TouchableOpacity>
        <TouchableOpacity className="rounded-full bg-gray-100 px-3 py-1">
          <Text className="text-sm font-medium text-gray-700">Low Risk</Text>
        </TouchableOpacity>
        <TouchableOpacity className="rounded-full bg-gray-100 px-3 py-1">
          <Text className="text-sm font-medium text-gray-700">High CTS</Text>
        </TouchableOpacity>
      </View>

      {/* Swipe hint */}
      <View className="flex-row items-center justify-center bg-gray-100 py-2">
        <Ionicons name="arrow-back" size={14} color="#ef4444" />
        <Text className="mx-2 text-xs text-gray-500">Swipe to approve/reject</Text>
        <Ionicons name="arrow-forward" size={14} color="#22c55e" />
      </View>

      {/* Queue list */}
      <FlatList
        data={queue}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <QueueItemCard
            item={item}
            onApprove={() => handleApprove(item.id)}
            onReject={() => handleReject(item.id)}
          />
        )}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View className="items-center justify-center py-12">
            <Ionicons name="checkmark-circle" size={48} color="#22c55e" />
            <Text className="mt-4 text-lg font-medium text-gray-900">All caught up!</Text>
            <Text className="mt-1 text-sm text-gray-500">No pending items to review</Text>
          </View>
        }
      />
    </View>
  );
}
