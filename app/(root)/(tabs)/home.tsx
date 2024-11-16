import React, { useRef, useEffect, useState, FC } from 'react';
import {
  View,
  Text,
  Animated,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Keyboard,
} from 'react-native';
import Swiper from 'react-native-swiper';
import { LinearGradient } from 'expo-linear-gradient';
import { styled } from 'nativewind';
import { useUser } from "@clerk/clerk-expo";

import InputField from '@/components/InputField'; // Adjust the path as necessary
import { fetchAPI } from '@/lib/fetch'; // Ensure the correct path
import { icons } from '@/constants';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);
const StyledLinearGradient = styled(AnimatedLinearGradient);

/**
 * TypeWriter Component
 * Handles typing and deleting animations for a list of texts.
 */
interface TypeWriterProps {
  texts: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseTime?: number;
}

const TypeWriter: FC<TypeWriterProps> = ({
  texts,
  typingSpeed = 150,
  deletingSpeed = 100,
  pauseTime = 1500,
}) => {
  const [currentTextIndex, setCurrentTextIndex] = useState<number>(0);
  const [displayedText, setDisplayedText] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const loopRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleType = () => {
      const fullText = texts[currentTextIndex];
      setDisplayedText((prev) =>
        isDeleting
          ? fullText.substring(0, prev.length - 1)
          : fullText.substring(0, prev.length + 1)
      );

      if (!isDeleting && displayedText === fullText) {
        loopRef.current = setTimeout(() => setIsDeleting(true), pauseTime);
      } else if (isDeleting && displayedText === '') {
        setIsDeleting(false);
        setCurrentTextIndex((prev) => (prev + 1) % texts.length);
      } else {
        const timeout = isDeleting ? deletingSpeed : typingSpeed;
        loopRef.current = setTimeout(handleType, timeout);
      }
    };

    loopRef.current = setTimeout(handleType, isDeleting ? deletingSpeed : typingSpeed);

    return () => {
      if (loopRef.current) {
        clearTimeout(loopRef.current);
      }
    };
  }, [displayedText, isDeleting, texts, currentTextIndex, typingSpeed, deletingSpeed, pauseTime]);

  return (
    <View className="h-8 mb-5">
      <Text className="text-white text-lg text-center">
        {displayedText}
        <Text className="animate-pulse">|</Text>
      </Text>
    </View>
  );
};

const HomeScreen: FC = () => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const { user, isLoaded } = useUser(); // Access authenticated user

  const [noteContent, setNoteContent] = useState<string>('');
  const [recallContent, setRecallContent] = useState<string>('');
  const [recallResponse, setRecallResponse] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 10000,
        useNativeDriver: false,
      })
    ).start();
  }, [animatedValue]);

  const gradientStart = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const gradientEnd = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const commitExamples: string[] = [
    'Call mom tomorrow',
    'Buy groceries',
    'Schedule meeting at 3 PM',
  ];
  const recallExamples: string[] = [
    'What did I commit earlier?',
    'Show my tasks for today',
    'Retrieve my notes',
  ];

  /**
   * Handles the commit note action.
   */
  const handleCommitNote = async () => {
    if (!isLoaded || !user) {
      Alert.alert("Authentication Required", "Please sign in to add notes.");
      return;
    }

    if (noteContent.trim() === "") {
      Alert.alert("Validation Error", "Note content cannot be empty.");
      return;
    }

    setIsSubmitting(true);
    try {
      const apiResponse = await fetchAPI("/(api)/note", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: noteContent,
          clerkId: user.id,
        }),
      });

      if (apiResponse.data) {
        Alert.alert("Success", "Note committed successfully!");
        setNoteContent('');
        Keyboard.dismiss();
      }
    } catch (error: any) {
      console.error("Error committing note:", error);
      Alert.alert("Error", error.message || "Failed to commit note.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handles the recall note action.
   */
/**
 * Handles the recall note action.
 */
const handleRecallNote = async () => {
  if (!isLoaded || !user) {
    Alert.alert("Authentication Required", "Please sign in to recall notes.");
    return;
  }

  if (recallContent.trim() === "") {
    Alert.alert("Validation Error", "Please enter a question to recall.");
    return;
  }

  setIsSubmitting(true);
  setRecallResponse(null); // Clear previous response

  try {
    const apiResponse = await fetchAPI("/(api)/ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        clerkId: user.id,
        question: recallContent, // Corrected key
      }),
    });

    // Extract and display the assistant's response
    const assistantMessage = apiResponse?.data || "No relevant notes found.";
    setRecallResponse(assistantMessage); // Set the assistant's message
    Keyboard.dismiss();
  } catch (error: any) {
    console.error("Error recalling notes:", error);
    Alert.alert(
      "Error",
      error.response?.data?.error || error.message || "Failed to recall notes."
    );
  } finally {
    setIsSubmitting(false);
  }
};


  return (
    <Swiper
      showsPagination={true}
      dotStyle={{ backgroundColor: 'rgba(0,0,0,.2)', width: 8, height: 8 }}
      activeDotStyle={{ backgroundColor: '#000', width: 8, height: 8 }}
      loop={false}
    >
      {/* Commit to Memory Page */}
      <StyledLinearGradient
        colors={['#00c6ff', '#0072ff']}
        start={{ x: gradientStart, y: 0 }}
        end={{ x: gradientEnd, y: 1 }}
        className="flex-1 px-5"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            <View className="flex-1 justify-between items-center pt-36 pb-20">
              <View className="items-center">
                <Text className="text-white text-4xl font-bold text-center mb-4">
                  Commit to memory
                </Text>
                <TypeWriter texts={commitExamples} />
              </View>

              <View className="w-5/6 pt-8">
                <InputField
                  label="Note"
                  placeholder="Enter something you want to remember"
                  icon={icons.person}
                  value={noteContent}
                  onChangeText={setNoteContent}
                />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        <TouchableOpacity
          className={`bg-white py-5 px-6 rounded-full self-center mb-20 ${isSubmitting ? 'opacity-50' : 'opacity-100'}`}
          onPress={handleCommitNote}
          activeOpacity={0.7}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#0072ff" />
          ) : (
            <Text className="text-2xl font-bold text-blue-500">Commit</Text>
          )}
        </TouchableOpacity>
      </StyledLinearGradient>

      {/* Recall Anything Page */}
      <StyledLinearGradient
        colors={['#9D50BB', '#6E48AA']}
        start={{ x: gradientStart, y: 0 }}
        end={{ x: gradientEnd, y: 1 }}
        className="flex-1 px-5"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            <View className="flex-1 justify-between items-center pt-36 pb-20">
              <View className="items-center">
                <Text className="text-white text-4xl font-bold text-center mb-4">
                  Recall anything
                </Text>
                <TypeWriter texts={recallExamples} />
              </View>

              <View className="w-5/6 pt-8">
                <InputField
                  label="Recall"
                  placeholder="Ask about something you previously stored"
                  icon={icons.person}
                  value={recallContent}
                  onChangeText={setRecallContent}
                />
              </View>

              {isSubmitting && (
                <ActivityIndicator size="large" color="#fff" className="my-4" />
              )}
              {recallResponse && (
                <View className={`w-5/6 mt-4 p-4 rounded-lg ${recallResponse.includes("No relevant notes") ? "bg-red-100" : "bg-white"}`}>
                  <Text className={`text-lg ${recallResponse.includes("No relevant notes") ? "text-red-500" : "text-gray-700"}`}>
                    {recallResponse}
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        <TouchableOpacity
          className={`bg-white py-5 px-6 rounded-full self-center mb-20 ${isSubmitting ? 'opacity-50' : 'opacity-100'}`}
          onPress={handleRecallNote}
          activeOpacity={0.7}
          disabled={isSubmitting}
        >
          <Text className="text-2xl font-bold text-purple-500">Recall</Text>
        </TouchableOpacity>
      </StyledLinearGradient>
    </Swiper>
  );
};

const styles = StyleSheet.create({
  textInput: {
    height: 300,
    width: '100%',
    paddingHorizontal: 16,
  },
});

export default HomeScreen;
