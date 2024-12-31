// CommitPage.tsx

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
} from 'react-native';
import ChatBox from '@/components/ChatBox';
import { useUser } from '@clerk/clerk-expo';
import { fetchAPI } from '@/lib/fetch';

const CommitPage: React.FC = React.memo(() => {
  const { user, isLoaded } = useUser();
  const [noteContent, setNoteContent] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleCommitNote = useCallback(async () => {
    if (!isLoaded || !user) {
      alert('Please sign in to add notes.');
      return;
    }

    if (noteContent.trim() === '') {
      alert('Note content cannot be empty.');
      return;
    }

    setIsSubmitting(true);
    Keyboard.dismiss();

    try {
      const apiResponse = await fetchAPI('https://hippoai.me/note', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: noteContent,
          clerkId: user.id,
        }),
      });

      if (apiResponse.data) {
        setSuccessMessage('Note committed successfully!');
        setNoteContent('');
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      }
    } catch (error: any) {
      console.error('Error committing note:', error);
      alert(error.message || 'Failed to commit note.');
    } finally {
      setIsSubmitting(false);
    }
  }, [isLoaded, user, noteContent]);

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
              Commit to memory
            </Text>
            <Text className="text-white text-lg text-center">
              Enter something you want to remember
            </Text>
          </View>

          {/* Content */}
          <View className="flex-1 justify-center items-center w-full px-5">
            {isSubmitting ? (
              <ActivityIndicator size="large" color="#fff" className="my-4" />
            ) : (
              <>
                {successMessage && (
                  <View className="w-full mt-4 p-4 rounded-lg bg-green-100">
                    <Text className="text-lg text-green-700">{successMessage}</Text>
                  </View>
                )}

                <View className="w-full pt-8">
                  <ChatBox
                    placeholder="Type your note here..."
                    placeholderTextColor="#555"
                    value={noteContent}
                    onChangeText={setNoteContent}
                    className="h-44"
                    inputStyle="text-base"
                  />
                </View>
              </>
            )}
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity
        className={`bg-white py-5 px-6 rounded-full self-center mb-10 ${
          isSubmitting ? 'opacity-50' : 'opacity-100'
        }`}
        onPress={handleCommitNote}
        activeOpacity={0.7}
        disabled={isSubmitting}
      >
        <Text className="text-2xl font-bold text-blue-500">Commit</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
});

export default CommitPage;