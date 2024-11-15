// HomeScreen.tsx

import React, { useRef, useEffect, useState, FC } from 'react';
import {
  View,
  Text,
  TextInput,
  Animated,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import Swiper from 'react-native-swiper';
import { LinearGradient } from 'expo-linear-gradient';
import { styled } from 'nativewind';

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
  const textOpacity1 = useRef(new Animated.Value(1)).current;
  const textOpacity2 = useRef(new Animated.Value(1)).current;

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
                <TextInput
                  className="text-white text-xl p-4 bg-transparent rounded-lg border border-white"
                  placeholder="Enter something you want to remember"
                  placeholderTextColor="rgba(255,255,255,0.7)"
                  multiline={true}
                  style={[styles.textInput, { textAlign: 'center' }]} // Added `textAlign: 'center'`
                  scrollEnabled={true}
                  textAlignVertical="top"
                />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
        <TouchableOpacity
          className="bg-white py-5 px-6 rounded-full self-center mb-20"
          onPress={() => {
            Animated.timing(textOpacity1, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }).start();
          }}
          activeOpacity={0.7}
        >
          <Text className="text-2xl font-bold text-blue-500">Commit</Text>
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
                <TextInput
                  className="text-white text-xl p-4 bg-transparent rounded-lg border border-white"
                  placeholder="Ask about something you previously stored"
                  placeholderTextColor="rgba(255,255,255,0.7)"
                  multiline={true}
                  style={[styles.textInput, { textAlign: 'center' }]} // Added `textAlign: 'center'`
                  scrollEnabled={true}
                  textAlignVertical="top"
                />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
        <TouchableOpacity
          className="bg-white py-5 px-6 rounded-full self-center mb-20"
          onPress={() => {
            Animated.timing(textOpacity2, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }).start();
          }}
          activeOpacity={0.7}
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
