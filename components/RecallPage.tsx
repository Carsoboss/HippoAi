// RecallPage.tsx

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Keyboard,
} from 'react-native';
import ChatBox from '@/components/ChatBox';
import { useUser } from '@clerk/clerk-expo';
import { fetchAPI } from '@/lib/fetch';

const RecallPage: React.FC = React.memo(() => {
  const { user, isLoaded } = useUser();
  const [recallContent, setRecallContent] = useState<string>('');
  const [recallResponse, setRecallResponse] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleRecallNote = useCallback(async () => {
    if (!isLoaded || !user) {
      Alert.alert('Authentication Required', 'Please sign in to recall notes.');
      return;
    }

    if (recallContent.trim() === '') {
      Alert.alert('Validation Error', 'Please enter a question to recall.');
      return;
    }

    setIsSubmitting(true);
    setRecallResponse(null);
    Keyboard.dismiss();

    try {
      const apiResponse = await fetchAPI('/(api)/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clerkId: user.id,
          question: recallContent,
        }),
      });

      const assistantMessage = apiResponse?.data || 'No relevant notes found.';
      setRecallResponse(assistantMessage);
      setRecallContent('');
    } catch (error: any) {
      console.error('Error recalling notes:', error);
      Alert.alert(
        'Error',
        error.response?.data?.error || error.message || 'Failed to recall notes.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [isLoaded, user, recallContent]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 pt-36 pb-20">
          {/* Title */}
          <View className="items-center">
            <Text className="text-white text-4xl font-bold text-center mb-4">
              Recall anything
            </Text>
            <Text className="text-white text-lg text-center">
              Ask about something you previously stored
            </Text>
          </View>

          {/* Content */}
          <View className="flex-1 justify-center items-center w-full px-5">
            {isSubmitting ? (
              <ActivityIndicator size="large" color="#fff" className="my-4" />
            ) : (
              <>
                {recallResponse && (
                  <View
                    className={`w-full mt-4 p-4 rounded-lg ${
                      recallResponse.includes('No relevant notes')
                        ? 'bg-red-100'
                        : 'bg-white'
                    }`}
                  >
                    <Text
                      className={`text-lg ${
                        recallResponse.includes('No relevant notes')
                          ? 'text-red-500'
                          : 'text-gray-700'
                      }`}
                    >
                      {recallResponse}
                    </Text>
                  </View>
                )}

                <View className="w-full pt-8">
                  <ChatBox
                    placeholder="Type your question here..."
                    placeholderTextColor="#555"
                    value={recallContent}
                    onChangeText={setRecallContent}
                    className="h-48"
                    inputStyle="text-base"
                  />
                </View>
              </>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Recall Button */}
      <TouchableOpacity
        className={`bg-white py-5 px-6 rounded-full self-center mb-10 ${
          isSubmitting ? 'opacity-50' : 'opacity-100'
        }`}
        onPress={handleRecallNote}
        activeOpacity={0.7}
        disabled={isSubmitting}
      >
        <Text className="text-2xl font-bold text-orange-500">Recall</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
});

export default RecallPage;
