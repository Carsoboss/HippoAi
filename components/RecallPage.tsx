import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
  Alert,
} from 'react-native';
import ChatBox from '@/components/ChatBox'; // Adjust import if needed
import { useUser } from '@clerk/clerk-expo'; // Adjust import if needed
import { fetchAPI } from '@/lib/fetch'; // Adjust import if needed

const RecallPage: React.FC = React.memo(() => {
  const { user, isLoaded } = useUser();
  const [recallContent, setRecallContent] = useState<string>('');
  const [recallResponse, setRecallResponse] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // New state to track input focus
  const [isInputFocused, setIsInputFocused] = useState<boolean>(false);

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
      const apiResponse = await fetchAPI('https://www.hippoai.me/(api)/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clerkId: user.id,
          question: recallContent,
        }),
      });

      let assistantMessage = apiResponse?.data || 'No relevant notes found.';
      // Remove the specific text `4:0†note.txt` along with one character before and after
      assistantMessage = assistantMessage.replace(/.\s*4:0†note\.txt\s*./g, '').trim();

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
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20} // Adjust if necessary
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
          <View
            className={`flex-1 items-center w-full px-5 ${
              recallResponse && !isInputFocused ? '' : 'justify-center'
            }`}
          >
            {isSubmitting ? (
              <ActivityIndicator size="large" color="#fff" className="my-4" />
            ) : (
              <>
                {!isInputFocused && recallResponse && (
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

                {/* Input Box */}
                <View
                  className={`w-full pt-8 ${
                    recallResponse && !isInputFocused ? 'mt-4' : ''
                  }`}
                >
                  <ChatBox
                    placeholder="Type your question here..."
                    placeholderTextColor="#555"
                    value={recallContent}
                    onChangeText={setRecallContent}
                    className="h-44"
                    inputStyle="text-base"
                    // Add onFocus and onBlur handlers
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => setIsInputFocused(false)}
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
