import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { AppStorage } from '../../lib/storage';

export default function LoginScreen() {
  const { signIn, authenticateWithBiometrics, checkBiometricsAvailable, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showBiometrics, setShowBiometrics] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Check if biometrics are available and enabled
    const checkBiometrics = async () => {
      const available = await checkBiometricsAvailable();
      const enabled = AppStorage.getBiometricsEnabled();
      setShowBiometrics(available && enabled);
    };
    checkBiometrics();
  }, [checkBiometricsAvailable]);

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated) {
      router.replace('/(app)/(tabs)');
    }
  }, [isAuthenticated]);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const { error } = await signIn(email, password);

    if (error) {
      setErrorMessage(error.message);
      setIsLoading(false);
    }
    // Navigation handled by auth state change in useEffect
  };

  const handleBiometricLogin = async () => {
    const success = await authenticateWithBiometrics();
    if (success) {
      // Biometric auth successful - session should be restored from secure storage
      router.replace('/(app)/(tabs)');
    } else {
      Alert.alert('Authentication Failed', 'Please try again or use your password.');
    }
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
            {errorMessage && (
              <View className="rounded-lg bg-red-50 p-3">
                <Text className="text-sm text-red-600">{errorMessage}</Text>
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
                editable={!isLoading}
                className="h-12 rounded-lg border border-gray-300 px-4 text-base"
              />
            </View>

            <View>
              <Text className="mb-2 text-sm font-medium text-gray-700">Password</Text>
              <TextInput
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setErrorMessage(null);
                }}
                placeholder="Enter your password"
                secureTextEntry
                editable={!isLoading}
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
              style={{ opacity: isLoading ? 0.7 : 1 }}
            >
              <Text className="text-base font-semibold text-white">
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Text>
            </TouchableOpacity>

            {showBiometrics && (
              <TouchableOpacity
                onPress={handleBiometricLogin}
                className="mt-2 h-12 flex-row items-center justify-center rounded-lg border border-gray-300"
              >
                <Ionicons
                  name={Platform.OS === 'ios' ? 'finger-print' : 'finger-print'}
                  size={20}
                  color="#374151"
                />
                <Text className="ml-2 text-base font-medium text-gray-700">
                  Use Biometrics
                </Text>
              </TouchableOpacity>
            )}

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
