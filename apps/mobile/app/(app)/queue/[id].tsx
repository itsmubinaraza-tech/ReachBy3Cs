import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import type { RiskLevel, ResponseType, CTALevel } from 'shared-types';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';

interface ResponseDetail {
  id: string;
  // Original post
  originalPost: {
    content: string;
    platform: string;
    platformName: string;
    externalUrl: string | null;
    authorHandle: string | null;
    detectedAt: string;
  };
  // Signal analysis
  signal: {
    emotionalIntensity: number;
    keywords: string[];
    problemCategory: string | null;
  };
  // Risk assessment
  risk: {
    level: RiskLevel;
    score: number;
    factors: string[];
  };
  // Response variants
  responses: {
    valueFirst: string | null;
    softCta: string | null;
    contextual: string | null;
    selected: string;
    selectedType: ResponseType;
  };
  // Scoring
  metrics: {
    ctaLevel: CTALevel;
    ctsScore: number;
    ctsBreakdown: {
      signal_component: number;
      risk_component: number;
      cta_component: number;
    } | null;
    canAutoPost: boolean;
    autoPostReason: string | null;
  };
  // Cluster
  cluster: {
    id: string;
    name: string;
  } | null;
  // Timestamps
  createdAt: string;
}

function getRiskColor(level: RiskLevel) {
  const colors = {
    low: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
    medium: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' },
    high: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
    blocked: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
  };
  return colors[level];
}

function getPlatformIcon(platform: string) {
  switch (platform) {
    case 'reddit':
      return 'logo-reddit';
    case 'twitter':
      return 'logo-twitter';
    case 'quora':
      return 'help-circle-outline';
    default:
      return 'globe-outline';
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ResponseVariantCard({
  title,
  type,
  content,
  isSelected,
  onSelect,
}: {
  title: string;
  type: ResponseType;
  content: string | null;
  isSelected: boolean;
  onSelect: () => void;
}) {
  if (!content) return null;

  return (
    <TouchableOpacity
      onPress={onSelect}
      className={`mb-3 rounded-lg border-2 p-4 ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
      }`}
    >
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-sm font-semibold text-gray-700">{title}</Text>
        {isSelected && (
          <View className="flex-row items-center">
            <Ionicons name="checkmark-circle" size={18} color="#3b82f6" />
            <Text className="ml-1 text-xs font-medium text-blue-600">Selected</Text>
          </View>
        )}
      </View>
      <Text className="text-sm leading-relaxed text-gray-600">{content}</Text>
    </TouchableOpacity>
  );
}

function ScoreBar({ label, value, maxValue = 1 }: { label: string; value: number; maxValue?: number }) {
  const percentage = Math.min((value / maxValue) * 100, 100);

  return (
    <View className="mb-2">
      <View className="mb-1 flex-row items-center justify-between">
        <Text className="text-xs text-gray-500">{label}</Text>
        <Text className="text-xs font-medium text-gray-700">{(value * 100).toFixed(0)}%</Text>
      </View>
      <View className="h-2 overflow-hidden rounded-full bg-gray-200">
        <View
          className="h-full rounded-full bg-blue-500"
          style={{ width: `${percentage}%` }}
        />
      </View>
    </View>
  );
}

export default function QueueDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { dbUser } = useAuth();
  const [response, setResponse] = useState<ResponseDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedType, setSelectedType] = useState<ResponseType>('value_first');
  const [editedResponse, setEditedResponse] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  const fetchResponse = useCallback(async () => {
    if (!id) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('responses')
        .select(`
          id,
          value_first_response,
          soft_cta_response,
          contextual_response,
          selected_response,
          selected_type,
          cta_level,
          cts_score,
          cts_breakdown,
          can_auto_post,
          auto_post_reason,
          created_at,
          signals (
            id,
            emotional_intensity,
            keywords,
            problem_categories (
              name
            ),
            posts (
              id,
              content,
              external_url,
              author_handle,
              detected_at,
              platforms (
                id,
                name,
                slug
              )
            ),
            risk_scores (
              risk_level,
              risk_score,
              risk_factors
            )
          ),
          clusters (
            id,
            name
          )
        `)
        .eq('id', id)
        .single();

      if (queryError) {
        throw queryError;
      }

      if (!data) {
        throw new Error('Response not found');
      }

      const responseData = data as any;
      const detail: ResponseDetail = {
        id: responseData.id,
        originalPost: {
          content: responseData.signals?.posts?.content ?? '',
          platform: responseData.signals?.posts?.platforms?.slug ?? 'unknown',
          platformName: responseData.signals?.posts?.platforms?.name ?? 'Unknown',
          externalUrl: responseData.signals?.posts?.external_url,
          authorHandle: responseData.signals?.posts?.author_handle,
          detectedAt: responseData.signals?.posts?.detected_at ?? responseData.created_at,
        },
        signal: {
          emotionalIntensity: responseData.signals?.emotional_intensity ?? 0,
          keywords: responseData.signals?.keywords ?? [],
          problemCategory: responseData.signals?.problem_categories?.name ?? null,
        },
        risk: {
          level: responseData.signals?.risk_scores?.[0]?.risk_level ?? 'low',
          score: responseData.signals?.risk_scores?.[0]?.risk_score ?? 0,
          factors: Object.keys(responseData.signals?.risk_scores?.[0]?.risk_factors ?? {}),
        },
        responses: {
          valueFirst: responseData.value_first_response,
          softCta: responseData.soft_cta_response,
          contextual: responseData.contextual_response,
          selected: responseData.selected_response,
          selectedType: responseData.selected_type ?? 'value_first',
        },
        metrics: {
          ctaLevel: responseData.cta_level ?? 0,
          ctsScore: responseData.cts_score ?? 0,
          ctsBreakdown: responseData.cts_breakdown,
          canAutoPost: responseData.can_auto_post ?? false,
          autoPostReason: responseData.auto_post_reason,
        },
        cluster: responseData.clusters
          ? { id: responseData.clusters.id, name: responseData.clusters.name }
          : null,
        createdAt: responseData.created_at,
      };

      setResponse(detail);
      setSelectedType(detail.responses.selectedType);
      setEditedResponse(detail.responses.selected);
    } catch (err) {
      console.error('Error fetching response:', err);
      setError('Failed to load response details');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchResponse();
  }, [fetchResponse]);

  const handleApprove = useCallback(async () => {
    if (!response || !dbUser) return;

    setIsSubmitting(true);

    try {
      const { error: updateError } = await supabase
        .from('responses')
        .update({
          status: isEditing ? 'edited' : 'approved',
          selected_type: selectedType,
          selected_response: isEditing ? editedResponse : getSelectedResponse(),
          edited_response: isEditing ? editedResponse : null,
          edited_by: isEditing ? dbUser.id : null,
          edited_at: isEditing ? new Date().toISOString() : null,
          reviewed_by: dbUser.id,
          reviewed_at: new Date().toISOString(),
          review_device: 'mobile_ios',
        })
        .eq('id', response.id);

      if (updateError) {
        throw updateError;
      }

      // Log audit event
      await supabase.from('audit_log').insert({
        organization_id: dbUser.organization_id,
        user_id: dbUser.id,
        action_type: isEditing ? 'response.edited' : 'response.approved',
        entity_type: 'response',
        entity_id: response.id,
        device_type: 'mobile_ios',
        action_data: {
          selected_type: selectedType,
          was_edited: isEditing,
        },
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Alert.alert(
        'Success',
        isEditing ? 'Response edited and approved!' : 'Response approved!',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err) {
      console.error('Error approving response:', err);
      Alert.alert('Error', 'Failed to approve response. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [response, dbUser, selectedType, isEditing, editedResponse]);

  const handleReject = useCallback(async () => {
    if (!response || !dbUser) return;

    if (!showRejectInput) {
      setShowRejectInput(true);
      return;
    }

    setIsSubmitting(true);

    try {
      const { error: updateError } = await supabase
        .from('responses')
        .update({
          status: 'rejected',
          reviewed_by: dbUser.id,
          reviewed_at: new Date().toISOString(),
          review_device: 'mobile_ios',
          review_notes: rejectReason || null,
        })
        .eq('id', response.id);

      if (updateError) {
        throw updateError;
      }

      // Log audit event
      await supabase.from('audit_log').insert({
        organization_id: dbUser.organization_id,
        user_id: dbUser.id,
        action_type: 'response.rejected',
        entity_type: 'response',
        entity_id: response.id,
        device_type: 'mobile_ios',
        action_data: { reason: rejectReason || null },
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

      Alert.alert(
        'Rejected',
        'Response has been rejected.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err) {
      console.error('Error rejecting response:', err);
      Alert.alert('Error', 'Failed to reject response. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [response, dbUser, rejectReason, showRejectInput]);

  const handleOpenExternalUrl = useCallback(async () => {
    if (response?.originalPost.externalUrl) {
      try {
        await Linking.openURL(response.originalPost.externalUrl);
      } catch (err) {
        Alert.alert('Error', 'Could not open URL');
      }
    }
  }, [response]);

  const getSelectedResponse = useCallback(() => {
    if (!response) return '';
    switch (selectedType) {
      case 'value_first':
        return response.responses.valueFirst ?? response.responses.selected;
      case 'soft_cta':
        return response.responses.softCta ?? response.responses.selected;
      case 'contextual':
        return response.responses.contextual ?? response.responses.selected;
      default:
        return response.responses.selected;
    }
  }, [response, selectedType]);

  const handleSelectVariant = useCallback((type: ResponseType) => {
    setSelectedType(type);
    if (response) {
      switch (type) {
        case 'value_first':
          setEditedResponse(response.responses.valueFirst ?? response.responses.selected);
          break;
        case 'soft_cta':
          setEditedResponse(response.responses.softCta ?? response.responses.selected);
          break;
        case 'contextual':
          setEditedResponse(response.responses.contextual ?? response.responses.selected);
          break;
      }
    }
    setIsEditing(false);
  }, [response]);

  // Loading state
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-4 text-gray-600">Loading response details...</Text>
      </View>
    );
  }

  // Error state
  if (error || !response) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 px-8">
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text className="mt-4 text-center text-lg font-medium text-gray-900">
          {error || 'Response not found'}
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-6 rounded-lg bg-gray-200 px-6 py-3"
        >
          <Text className="font-medium text-gray-700">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const riskColors = getRiskColor(response.risk.level);

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Original Post Section */}
        <View className="bg-white p-4">
          <View className="mb-3 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons
                name={getPlatformIcon(response.originalPost.platform) as any}
                size={20}
                color="#3b82f6"
              />
              <Text className="ml-2 font-medium text-gray-700">
                {response.originalPost.platformName}
              </Text>
              {response.originalPost.authorHandle && (
                <Text className="ml-2 text-sm text-gray-500">
                  @{response.originalPost.authorHandle}
                </Text>
              )}
            </View>
            {response.originalPost.externalUrl && (
              <TouchableOpacity
                onPress={handleOpenExternalUrl}
                className="flex-row items-center"
              >
                <Ionicons name="open-outline" size={16} color="#3b82f6" />
                <Text className="ml-1 text-sm text-blue-500">View</Text>
              </TouchableOpacity>
            )}
          </View>

          <View className="rounded-lg bg-gray-50 p-4">
            <Text className="leading-relaxed text-gray-800">
              {response.originalPost.content}
            </Text>
          </View>

          <Text className="mt-2 text-xs text-gray-400">
            Detected: {formatDate(response.originalPost.detectedAt)}
          </Text>
        </View>

        {/* Risk & Analysis Section */}
        <View className="mt-2 bg-white p-4">
          <Text className="mb-3 text-lg font-semibold text-gray-900">Analysis</Text>

          {/* Risk Level */}
          <View className={`mb-4 rounded-lg border p-3 ${riskColors.bg} ${riskColors.border}`}>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Ionicons
                  name={response.risk.level === 'blocked' ? 'close-circle' : 'shield-checkmark'}
                  size={20}
                  color={response.risk.level === 'low' ? '#22c55e' : response.risk.level === 'medium' ? '#eab308' : '#ef4444'}
                />
                <Text className={`ml-2 font-semibold ${riskColors.text}`}>
                  {response.risk.level.charAt(0).toUpperCase() + response.risk.level.slice(1)} Risk
                </Text>
              </View>
              <Text className={`text-sm font-medium ${riskColors.text}`}>
                Score: {(response.risk.score * 100).toFixed(0)}%
              </Text>
            </View>
            {response.risk.factors.length > 0 && (
              <View className="mt-2 flex-row flex-wrap gap-1">
                {response.risk.factors.map((factor, index) => (
                  <View key={index} className="rounded bg-white/50 px-2 py-0.5">
                    <Text className={`text-xs ${riskColors.text}`}>{factor}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Signal Details */}
          <View className="mb-4">
            <Text className="mb-2 text-sm font-medium text-gray-700">Emotional Intensity</Text>
            <View className="h-3 overflow-hidden rounded-full bg-gray-200">
              <View
                className="h-full rounded-full bg-purple-500"
                style={{ width: `${response.signal.emotionalIntensity * 100}%` }}
              />
            </View>
            <Text className="mt-1 text-right text-xs text-gray-500">
              {(response.signal.emotionalIntensity * 100).toFixed(0)}%
            </Text>
          </View>

          {response.signal.problemCategory && (
            <View className="mb-4">
              <Text className="mb-1 text-sm font-medium text-gray-700">Problem Category</Text>
              <View className="rounded-lg bg-purple-50 px-3 py-2">
                <Text className="text-sm text-purple-700">{response.signal.problemCategory}</Text>
              </View>
            </View>
          )}

          {response.signal.keywords.length > 0 && (
            <View className="mb-4">
              <Text className="mb-2 text-sm font-medium text-gray-700">Keywords</Text>
              <View className="flex-row flex-wrap gap-2">
                {response.signal.keywords.map((keyword, index) => (
                  <View key={index} className="rounded-full bg-gray-100 px-3 py-1">
                    <Text className="text-xs text-gray-600">{keyword}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {response.cluster && (
            <View className="flex-row items-center rounded-lg bg-blue-50 p-3">
              <Ionicons name="people" size={18} color="#3b82f6" />
              <Text className="ml-2 text-sm font-medium text-blue-700">
                Community: {response.cluster.name}
              </Text>
            </View>
          )}
        </View>

        {/* CTS Score Section */}
        <View className="mt-2 bg-white p-4">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-gray-900">CTS Score</Text>
            <View className="flex-row items-center">
              <Text className="text-2xl font-bold text-blue-600">
                {(response.metrics.ctsScore * 100).toFixed(0)}%
              </Text>
              {response.metrics.canAutoPost && (
                <View className="ml-2 flex-row items-center rounded-full bg-green-100 px-2 py-1">
                  <Ionicons name="flash" size={12} color="#22c55e" />
                  <Text className="ml-1 text-xs font-medium text-green-700">Auto</Text>
                </View>
              )}
            </View>
          </View>

          {response.metrics.ctsBreakdown && (
            <View>
              <ScoreBar label="Signal Component" value={response.metrics.ctsBreakdown.signal_component} />
              <ScoreBar label="Risk Component" value={response.metrics.ctsBreakdown.risk_component} />
              <ScoreBar label="CTA Component" value={response.metrics.ctsBreakdown.cta_component} />
            </View>
          )}

          <View className="mt-3 flex-row items-center justify-between rounded-lg bg-gray-50 p-3">
            <Text className="text-sm text-gray-600">CTA Level</Text>
            <View className="flex-row items-center">
              {[0, 1, 2, 3].map((level) => (
                <View
                  key={level}
                  className={`ml-1 h-3 w-3 rounded-full ${
                    level <= response.metrics.ctaLevel ? 'bg-blue-500' : 'bg-gray-200'
                  }`}
                />
              ))}
              <Text className="ml-2 text-sm font-medium text-gray-700">
                {response.metrics.ctaLevel}
              </Text>
            </View>
          </View>

          {response.metrics.autoPostReason && (
            <Text className="mt-2 text-xs text-gray-500">
              {response.metrics.autoPostReason}
            </Text>
          )}
        </View>

        {/* Response Variants Section */}
        <View className="mt-2 bg-white p-4">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-gray-900">Response Variants</Text>
            <TouchableOpacity
              onPress={() => {
                setIsEditing(!isEditing);
                if (!isEditing) {
                  setEditedResponse(getSelectedResponse());
                }
              }}
              className="flex-row items-center"
            >
              <Ionicons
                name={isEditing ? 'close' : 'create-outline'}
                size={18}
                color="#3b82f6"
              />
              <Text className="ml-1 text-sm text-blue-500">
                {isEditing ? 'Cancel' : 'Edit'}
              </Text>
            </TouchableOpacity>
          </View>

          {isEditing ? (
            <View className="rounded-lg border-2 border-blue-500 bg-blue-50 p-4">
              <Text className="mb-2 text-sm font-medium text-gray-700">Editing Response</Text>
              <TextInput
                value={editedResponse}
                onChangeText={setEditedResponse}
                multiline
                numberOfLines={6}
                className="min-h-32 rounded-lg bg-white p-3 text-sm leading-relaxed text-gray-800"
                textAlignVertical="top"
              />
            </View>
          ) : (
            <>
              <ResponseVariantCard
                title="Value First"
                type="value_first"
                content={response.responses.valueFirst}
                isSelected={selectedType === 'value_first'}
                onSelect={() => handleSelectVariant('value_first')}
              />
              <ResponseVariantCard
                title="Soft CTA"
                type="soft_cta"
                content={response.responses.softCta}
                isSelected={selectedType === 'soft_cta'}
                onSelect={() => handleSelectVariant('soft_cta')}
              />
              <ResponseVariantCard
                title="Contextual"
                type="contextual"
                content={response.responses.contextual}
                isSelected={selectedType === 'contextual'}
                onSelect={() => handleSelectVariant('contextual')}
              />
            </>
          )}
        </View>

        {/* Reject reason input */}
        {showRejectInput && (
          <View className="mt-2 bg-white p-4">
            <Text className="mb-2 text-sm font-medium text-gray-700">Rejection Reason (optional)</Text>
            <TextInput
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholder="Why are you rejecting this response?"
              multiline
              numberOfLines={3}
              className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm"
              textAlignVertical="top"
            />
          </View>
        )}

        {/* Bottom spacing for action buttons */}
        <View className="h-24" />
      </ScrollView>

      {/* Action Buttons */}
      <View className="absolute bottom-0 left-0 right-0 flex-row border-t border-gray-200 bg-white px-4 py-3">
        <TouchableOpacity
          onPress={handleReject}
          disabled={isSubmitting}
          className="mr-2 flex-1 flex-row items-center justify-center rounded-lg bg-red-100 py-3"
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#ef4444" />
          ) : (
            <>
              <Ionicons name="close-circle" size={20} color="#ef4444" />
              <Text className="ml-2 font-semibold text-red-600">
                {showRejectInput ? 'Confirm Reject' : 'Reject'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleApprove}
          disabled={isSubmitting}
          className="ml-2 flex-1 flex-row items-center justify-center rounded-lg bg-green-500 py-3"
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="white" />
              <Text className="ml-2 font-semibold text-white">
                {isEditing ? 'Save & Approve' : 'Approve'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
