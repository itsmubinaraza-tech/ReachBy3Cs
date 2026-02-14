import { Redirect } from 'expo-router';
import { View, Text, ActivityIndicator } from 'react-native';

export default function Index() {
  // TODO: Check auth state and redirect accordingly
  // For now, show a loading screen and redirect to auth
  const isLoading = false;
  const isAuthenticated = false;

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#0a0a0a" />
        <Text className="mt-4 text-gray-500">Loading...</Text>
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(app)/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
