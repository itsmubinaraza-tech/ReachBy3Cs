import { View, Text, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [autoApprove, setAutoApprove] = useState(false);

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        {/* User Profile */}
        <View className="mb-6 rounded-xl bg-white p-4 shadow-sm">
          <View className="flex-row items-center">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-gray-200">
              <Text className="text-2xl font-bold text-gray-600">JD</Text>
            </View>
            <View className="ml-4">
              <Text className="text-lg font-semibold text-gray-900">John Doe</Text>
              <Text className="text-sm text-gray-500">john@weattuned.com</Text>
              <Text className="mt-1 text-xs text-blue-600">Admin</Text>
            </View>
          </View>
        </View>

        {/* Notifications */}
        <View className="mb-6">
          <Text className="mb-3 text-sm font-medium uppercase text-gray-500">Notifications</Text>
          <View className="rounded-xl bg-white shadow-sm">
            <View className="flex-row items-center justify-between border-b border-gray-100 p-4">
              <View className="flex-row items-center">
                <Ionicons name="notifications-outline" size={22} color="#374151" />
                <Text className="ml-3 text-base text-gray-700">Push Notifications</Text>
              </View>
              <Switch value={pushEnabled} onValueChange={setPushEnabled} />
            </View>
            <TouchableOpacity className="flex-row items-center justify-between p-4">
              <View className="flex-row items-center">
                <Ionicons name="time-outline" size={22} color="#374151" />
                <Text className="ml-3 text-base text-gray-700">Notification Schedule</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Security */}
        <View className="mb-6">
          <Text className="mb-3 text-sm font-medium uppercase text-gray-500">Security</Text>
          <View className="rounded-xl bg-white shadow-sm">
            <View className="flex-row items-center justify-between border-b border-gray-100 p-4">
              <View className="flex-row items-center">
                <Ionicons name="finger-print-outline" size={22} color="#374151" />
                <Text className="ml-3 text-base text-gray-700">Biometric Login</Text>
              </View>
              <Switch value={biometricEnabled} onValueChange={setBiometricEnabled} />
            </View>
            <TouchableOpacity className="flex-row items-center justify-between p-4">
              <View className="flex-row items-center">
                <Ionicons name="key-outline" size={22} color="#374151" />
                <Text className="ml-3 text-base text-gray-700">Change Password</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Automation */}
        <View className="mb-6">
          <Text className="mb-3 text-sm font-medium uppercase text-gray-500">Automation</Text>
          <View className="rounded-xl bg-white shadow-sm">
            <View className="flex-row items-center justify-between border-b border-gray-100 p-4">
              <View className="flex-1 flex-row items-center">
                <Ionicons name="flash-outline" size={22} color="#374151" />
                <View className="ml-3 flex-1">
                  <Text className="text-base text-gray-700">Auto-approve Low Risk</Text>
                  <Text className="text-xs text-gray-500">CTS 0.9+ with risk=low</Text>
                </View>
              </View>
              <Switch value={autoApprove} onValueChange={setAutoApprove} />
            </View>
            <TouchableOpacity className="flex-row items-center justify-between p-4">
              <View className="flex-row items-center">
                <Ionicons name="options-outline" size={22} color="#374151" />
                <Text className="ml-3 text-base text-gray-700">CTS Threshold</Text>
              </View>
              <View className="flex-row items-center">
                <Text className="mr-2 text-sm text-gray-500">0.70</Text>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Organization */}
        <View className="mb-6">
          <Text className="mb-3 text-sm font-medium uppercase text-gray-500">Organization</Text>
          <View className="rounded-xl bg-white shadow-sm">
            <TouchableOpacity className="flex-row items-center justify-between border-b border-gray-100 p-4">
              <View className="flex-row items-center">
                <Ionicons name="business-outline" size={22} color="#374151" />
                <Text className="ml-3 text-base text-gray-700">weattuned.com</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
            <TouchableOpacity className="flex-row items-center justify-between p-4">
              <View className="flex-row items-center">
                <Ionicons name="people-outline" size={22} color="#374151" />
                <Text className="ml-3 text-base text-gray-700">Team Members</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        </View>

        {/* About & Support */}
        <View className="mb-6">
          <Text className="mb-3 text-sm font-medium uppercase text-gray-500">About</Text>
          <View className="rounded-xl bg-white shadow-sm">
            <TouchableOpacity className="flex-row items-center justify-between border-b border-gray-100 p-4">
              <View className="flex-row items-center">
                <Ionicons name="help-circle-outline" size={22} color="#374151" />
                <Text className="ml-3 text-base text-gray-700">Help & Support</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
            <View className="flex-row items-center justify-between p-4">
              <View className="flex-row items-center">
                <Ionicons name="information-circle-outline" size={22} color="#374151" />
                <Text className="ml-3 text-base text-gray-700">Version</Text>
              </View>
              <Text className="text-sm text-gray-500">0.1.0</Text>
            </View>
          </View>
        </View>

        {/* Sign Out */}
        <TouchableOpacity className="rounded-xl bg-white p-4 shadow-sm">
          <View className="flex-row items-center justify-center">
            <Ionicons name="log-out-outline" size={22} color="#ef4444" />
            <Text className="ml-2 text-base font-medium text-red-500">Sign Out</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
