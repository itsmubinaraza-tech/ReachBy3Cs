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
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';

export default function ForgotPasswordScreen() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleResetPassword = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setErrorMessage('Please enter your email address');
      return;
    }

    if (!validateEmail(email.trim())) {
      setErrorMessage('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    const { error } = await resetPassword(email.trim());

    if (error) {
      setErrorMessage(error.message);
      setIsLoading(false);
    } else {
      setSuccessMessage(
        'Password reset instructions have been sent to your email address.'
      );
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 px-6">
          {/* Back button */}
          <View className="mt-4">
            <TouchableOpacity
              onPress={() => router.back()}
              className="h-10 w-10 items-center justify-center rounded-full"
            >
              <Ionicons name="arrow-back" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <View className="flex-1 justify-center">
            <View className="mb-8">
              <Text className="text-3xl font-bold text-gray-900">Reset password</Text>
              <Text className="mt-2 text-gray-500">
                Enter your email address and we'll send you instructions to reset your
                password.
              </Text>
            </View>

            <View className="space-y-4">
              {errorMessage && (
                <View className="rounded-lg bg-red-50 p-3">
                  <Text className="text-sm text-red-600">{errorMessage}</Text>
                </View>
              )}

              {successMessage && (
                <View className="rounded-lg bg-green-50 p-3">
                  <Text className="text-sm text-green-600">{successMessage}</Text>
                </View>
              )}

              <View>
                <Text className="mb-2 text-sm font-medium text-gray-700">Email</Text>
                <TextInput
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setErrorMessage(null);
                  }}
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading && !successMessage}
                  className="h-12 rounded-lg border border-gray-300 px-4 text-base"
                />
              </View>

              {!successMessage && (
                <TouchableOpacity
                  onPress={handleResetPassword}
                  disabled={isLoading}
                  className="mt-4 h-12 items-center justify-center rounded-lg bg-gray-900"
                  style={{ opacity: isLoading ? 0.7 : 1 }}
                >
                  <Text className="text-base font-semibold text-white">
                    {isLoading ? 'Sending...' : 'Send reset instructions'}
                  </Text>
                </TouchableOpacity>
              )}

              {successMessage && (
                <Link href="/(auth)/login" asChild>
                  <TouchableOpacity className="mt-4 h-12 items-center justify-center rounded-lg bg-gray-900">
                    <Text className="text-base font-semibold text-white">
                      Back to Sign In
                    </Text>
                  </TouchableOpacity>
                </Link>
              )}

              <View className="mt-6 flex-row items-center justify-center">
                <Text className="text-gray-500">Remember your password? </Text>
                <Link href="/(auth)/login" asChild>
                  <TouchableOpacity>
                    <Text className="font-semibold text-blue-600">Sign in</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
