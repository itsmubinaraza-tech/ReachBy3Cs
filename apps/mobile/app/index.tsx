import { Redirect } from 'expo-router';
import { View, Text, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function Index() {
  const { isLoading, isAuthenticated } = useAuth();

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
