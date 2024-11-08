import { SignedIn } from '@clerk/clerk-expo';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, TouchableOpacity } from 'react-native';
import LottieView from 'lottie-react-native';
import { useEffect, useRef } from 'react';
import { router } from 'expo-router';
import CustomButton from '@/components/CustomButton'; // Ensure the path is correct
import { animations } from '@/constants'; // Replace with your actual path

const JoinedWaitlist = () => {
  const animation = useRef<LottieView>(null);

  useEffect(() => {
    if (animation.current) {
      animation.current.play(); // Start the animation
    }
  }, []);

  return (
    <SafeAreaView className="flex h-full items-center justify-between bg-white">
      {/* Skip Button */}


      {/* Main Content with Lottie Animation */}
      <View className="flex items-center justify-center p-5 w-full mt-32">
        <LottieView
          ref={animation}
          source={animations.success} // Replace with the path to your Lottie JSON file
          autoPlay={false}
          loop={false}
          style={{ width: '100%', height: 300 }} // Adjusted to maintain aspect ratio
        />
        <View className="flex flex-row items-center justify-center w-full">
          <Text className="text-black text-3xl font-bold mx-10 text-center">
            You're On the Waitlist!
          </Text>
        </View>
        <Text className="text-md font-JakartaSemiBold text-center text-[#858585] mx-10 mt-3">
          Congratulations! You've successfully joined the alpha waitlist. Stay tuned for exclusive early access updates.
        </Text>
      </View>

      {/* Action Button */}
      {/* <CustomButton
        title="Explore More"
        onPress={() => router.replace("/(auth)/sign-up")}
        className="w-11/12 mt-10 mb-5"
      /> */}
    </SafeAreaView>
  );
};

export default JoinedWaitlist;
