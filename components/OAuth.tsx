// OAuth.tsx
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Image } from 'react-native';
import CustomButton from '@/components/CustomButton';
import { icons } from '@/constants';
import { useOAuth, useUser } from '@clerk/clerk-expo';
import { router } from 'expo-router';
import { fetchAPI } from '@/lib/fetch';
import ReactNativeModal from 'react-native-modal';
import LoadingSpinner from './loadingSpinner';

// 1. Import expo-linking
import * as Linking from 'expo-linking';

const OAuth: React.FC = () => {
  // 2. Create a redirectUrl from your custom scheme
  const redirectUrl = Linking.createURL('/oauth-native-callback');

  // 3. Pass redirectUrl into useOAuth
  const { startOAuthFlow } = useOAuth({
    strategy: 'oauth_google',
    redirectUrl,
  });

  const { isLoaded, user } = useUser();
  const [oauthSuccess, setOauthSuccess] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleGoogleSignIn = useCallback(async () => {
    try {
      setIsLoading(true); // Start loading
      const result = await startOAuthFlow();

      // Now check for createdSessionId
      if (result.createdSessionId) {
        // If session exists, we mark success
        setOauthSuccess(true);
      } else {
        // If no session, OAuth was canceled or failed
        setIsLoading(false);
      }
    } catch (err) {
      console.error('OAuth error', err);
      setIsLoading(false);
    }
  }, [startOAuthFlow]);

  useEffect(() => {
    const createUserInDB = async () => {
      if (!isLoaded || !user) {
        console.error('User is not loaded');
        setIsLoading(false);
        return;
      }

      const email = user.primaryEmailAddress?.emailAddress;
      const name = user.fullName || user.firstName || 'User';
      const clerkId = user.id;

      try {
        // Send user data to the backend
        const apiResponse = await fetchAPI('https://hippoai.me/(api)/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, clerkId }),
        });

        const { data } = apiResponse;
        console.log('User data from API:', data);

        setIsLoading(false);
        router.push('/(root)/(tabs)/home');
      } catch (error) {
        console.error('API error:', error);
        setIsLoading(false);
      }
    };

    if (oauthSuccess) {
      createUserInDB();
    }
  }, [oauthSuccess, isLoaded, user]);

  return (
    <View>
      {/* Loading spinner */}
      <ReactNativeModal
        isVisible={isLoading}
        backdropOpacity={0.5}
        useNativeDriver={true}
        animationIn="fadeIn"
        animationOut="fadeOut"
      >
        <LoadingSpinner />
      </ReactNativeModal>

      {/* Main content */}
      <View className="flex flex-row justify-center items-center mt-4 gap-x-3">
        <View className="flex-1 h-[1px] bg-general-100" />
        <Text className="text-lg">Or</Text>
        <View className="flex-1 h-[1px] bg-general-100" />
      </View>

      <CustomButton
        title="Continue With Google"
        className="mt-5 w-full shadow-none"
        IconLeft={() => (
          <Image
            source={icons.google}
            resizeMode="contain"
            className="w-5 h-5 mx-2"
          />
        )}
        bgVariant="outline"
        textVariant="primary"
        onPress={handleGoogleSignIn}
      />
    </View>
  );
};

export default OAuth;
