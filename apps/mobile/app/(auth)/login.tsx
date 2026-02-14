import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { Link } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    // TODO: Implement login with Supabase
    console.log('Login:', { email, password });
    setIsLoading(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 justify-center px-6">
          <View className="mb-8">
            <Text className="text-3xl font-bold text-gray-900">Welcome back</Text>
            <Text className="mt-2 text-gray-500">Sign in to approve responses on the go</Text>
          </View>

          <View className="space-y-4">
            <View>
              <Text className="mb-2 text-sm font-medium text-gray-700">Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                className="h-12 rounded-lg border border-gray-300 px-4 text-base"
              />
            </View>

            <View>
              <Text className="mb-2 text-sm font-medium text-gray-700">Password</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                secureTextEntry
                className="h-12 rounded-lg border border-gray-300 px-4 text-base"
              />
            </View>

            <Link href="/(auth)/forgot-password" asChild>
              <TouchableOpacity>
                <Text className="text-right text-sm text-blue-600">Forgot password?</Text>
              </TouchableOpacity>
            </Link>

            <TouchableOpacity
              onPress={handleLogin}
              disabled={isLoading}
              className="mt-4 h-12 items-center justify-center rounded-lg bg-gray-900"
            >
              <Text className="text-base font-semibold text-white">
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Text>
            </TouchableOpacity>

            <View className="mt-6 flex-row items-center justify-center">
              <Text className="text-gray-500">Don't have an account? </Text>
              <Link href="/(auth)/signup" asChild>
                <TouchableOpacity>
                  <Text className="font-semibold text-blue-600">Sign up</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
