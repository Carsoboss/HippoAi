import CustomButton from "@/components/CustomButton";
import OAuth from "@/components/OAuth";
import InputField from "@/components/InputField";
import { icons, images } from "@/constants";
import { Link, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, Text, View, Image } from "react-native";
import React from "react";
import { useSignIn } from "@clerk/clerk-expo";

const SignIn = () => {

  const { signIn, setActive, isLoaded } = useSignIn()
  const router = useRouter()
  
  const [form, setForm] = useState({
    email:"",
    password:"",
  })

  const onSignInPress = useCallback(async () => {
    if (!isLoaded) {
      return
    }

    try {
      const signInAttempt = await signIn.create({
        identifier: form.email,
        password: form.password,
      })

      if (signInAttempt.status === 'complete') {
        await setActive({ session: signInAttempt.createdSessionId })
        router.replace('/')
      } else {
        // See https://clerk.com/docs/custom-flows/error-handling
        // for more info on error handling
        console.error(JSON.stringify(signInAttempt, null, 2))
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2))
    }
  }, [isLoaded, form.email, form.password])

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-1 bg-white">
        <View className="relative w-full h-[250px]">
          <Image
            source={images.signUpHippo}
            className="z-0 w-full h-[232px]"
          />
        </View>
        <View className="px-5">
          <Text className="text-2xl text-black font-JakartaSemiBold">
            Welcome
          </Text>
        </View>

        <View className="p-5">
          <InputField
            label="Email"
            placeholder="Enter your email"
            icon={icons.email}
            value={form.email}
            autoCapitalize="none"
            onChangeText={(value) => 
              setForm({
               ... form,
               email: value
              })
            }
          />
          <InputField
            label="Password"
            placeholder="Enter your password"
            icon={icons.lock}
            secureTextEntry={true}
            value={form.password}
            onChangeText={(value) => 
              setForm({
               ... form,
               password: value
              })
            }
          />

          <CustomButton 
            title="Sign In" 
            onPress={onSignInPress} 
            className="mt-6"/>

            {/* <OAuth /> */}

            <Link href="/sign-up" className="text-lg text-center text-general-200 mt-10">
              <Text>Don't have an account? </Text>
              <Text className="text-primary-500">Sign up</Text>
            </Link>
        </View>

        {/* Verification Modal*/}
      </View>
    </ScrollView>
  );
};

export default SignIn;