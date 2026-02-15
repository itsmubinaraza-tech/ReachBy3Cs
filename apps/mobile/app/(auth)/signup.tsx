import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';

export default function SignupScreen() {
  const { signUp, isAuthenticated } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated) {
      router.replace('/(app)/(tabs)');
    }
  }, [isAuthenticated]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    return null;
  };

  const handleSignup = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validate full name
    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name');
      return;
    }

    // Validate email
    if (!email.trim()) {
      setErrorMessage('Please enter your email address');
      return;
    }

    if (!validateEmail(email.trim())) {
      setErrorMessage('Please enter a valid email address');
      return;
    }

    // Validate password
    if (!password) {
      setErrorMessage('Please enter a password');
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setErrorMessage(passwordError);
      return;
    }

    // Validate password confirmation
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    setIsLoading(true);

    const { error } = await signUp(email.trim(), password, fullName.trim());

    if (error) {
      setErrorMessage(error.message);
      setIsLoading(false);
    } else {
      setSuccessMessage(
        'Account created successfully! Please check your email to verify your account.'
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
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 justify-center px-6 py-8">
            <View className="mb-8">
              <Text className="text-3xl font-bold text-gray-900">Create account</Text>
              <Text className="mt-2 text-gray-500">
                Sign up to start managing your responses
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
                <Text className="mb-2 text-sm font-medium text-gray-700">Full Name</Text>
                <TextInput
                  value={fullName}
                  onChangeText={(text) => {
                    setFullName(text);
                    setErrorMessage(null);
                  }}
                  placeholder="John Doe"
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={!isLoading && !successMessage}
                  className="h-12 rounded-lg border border-gray-300 px-4 text-base"
                />
              </View>

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

              <View>
                <Text className="mb-2 text-sm font-medium text-gray-700">Password</Text>
                <TextInput
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setErrorMessage(null);
                  }}
                  placeholder="Create a strong password"
                  secureTextEntry
                  editable={!isLoading && !successMessage}
                  className="h-12 rounded-lg border border-gray-300 px-4 text-base"
                />
                <Text className="mt-1 text-xs text-gray-400">
                  Min 8 characters with uppercase, lowercase, and number
                </Text>
              </View>

              <View>
                <Text className="mb-2 text-sm font-medium text-gray-700">
                  Confirm Password
                </Text>
                <TextInput
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    setErrorMessage(null);
                  }}
                  placeholder="Confirm your password"
                  secureTextEntry
                  editable={!isLoading && !successMessage}
                  className="h-12 rounded-lg border border-gray-300 px-4 text-base"
                />
              </View>

              {!successMessage && (
                <TouchableOpacity
                  onPress={handleSignup}
                  disabled={isLoading}
                  className="mt-4 h-12 items-center justify-center rounded-lg bg-gray-900"
                  style={{ opacity: isLoading ? 0.7 : 1 }}
                >
                  <Text className="text-base font-semibold text-white">
                    {isLoading ? 'Creating account...' : 'Create account'}
                  </Text>
                </TouchableOpacity>
              )}

              {successMessage && (
                <Link href="/(auth)/login" asChild>
                  <TouchableOpacity className="mt-4 h-12 items-center justify-center rounded-lg bg-gray-900">
                    <Text className="text-base font-semibold text-white">
                      Go to Sign In
                    </Text>
                  </TouchableOpacity>
                </Link>
              )}

              <View className="mt-6 flex-row items-center justify-center">
                <Text className="text-gray-500">Already have an account? </Text>
                <Link href="/(auth)/login" asChild>
                  <TouchableOpacity>
                    <Text className="font-semibold text-blue-600">Sign in</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
