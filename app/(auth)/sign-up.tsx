import CustomButton from "@/components/CustomButton";
import OAuth from "@/components/OAuth";
import InputField from "@/components/InputField";
import { icons, images } from "@/constants";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, View, Image, Keyboard } from "react-native";
import { useSignUp } from "@clerk/clerk-expo";
import ReactNativeModal from "react-native-modal";
import { fetchAPI } from "@/lib/fetch";


const SignUp = () => {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [verification, setVerification] = useState({
    state: "default",
    error: "",
    code: "",
  });

  const [isLoading, setIsLoading] = useState(false);

  const onSignUpPress = async () => {

    if (!isLoaded) {
      console.warn("Clerk SignUp object is not loaded yet.");
      return;
    }

    setIsLoading(true);
    try {
      // Attempt to create the user in Clerk
      await signUp.create({
        emailAddress: form.email,
        password: form.password,
      });

      // Prepare the email code verification
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });

      // If all went well, switch to the code verification modal
      setVerification({
        ...verification,
        state: "pending",
      });
    } catch (err: any) {
      // 3) Log the entire error object:
      console.error("SignUp Error =>", err);

      const errorMessage = err.errors?.[0]?.longMessage || "Sign up failed.";
      setVerification({
        ...verification,
        error: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onPressVerify = async () => {
    if (!isLoaded) return;

    setIsLoading(true);
    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: verification.code,
      });

      if (completeSignUp.status === "complete") {
        // Send user data to the backend
        const apiResponse = await fetchAPI("https://www.hippoai.me/(api)/user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            clerkId: completeSignUp.createdUserId,
          }),
        });

        const { data } = apiResponse;

        await setActive({ session: completeSignUp.createdSessionId });
        setVerification({ state: "default", error: "", code: "" });
        router.push("/(root)/(tabs)/home");
      } else {
        setVerification({
          ...verification,
          error: "Verification failed. Please check your code and try again.",
          state: "failed",
        });
      }
    } catch (err: unknown) {
      console.error("Verification Error =>", err);
      const errorMessage = err instanceof Error ? err.message : "Verification failed.";
      setVerification({
        ...verification,
        error: errorMessage,
        state: "failed",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-1 bg-white">
        <View className="relative w-full h-[230px]">
          <Image source={images.signUpHippo} className="z-0 w-full h-[232px]" />
        </View>
        <View className="px-5">
          <Text className="text-2xl mt-2 text-black font-JakartaSemiBold">
            Create Your Account
          </Text>
        </View>

        <View className="p-5">
          <InputField
            label="Name"
            placeholder="Enter your name"
            icon={icons.person}
            value={form.name}
            onChangeText={(value) =>
              setForm({
                ...form,
                name: value,
              })
            }
          />
          <InputField
            label="Email"
            placeholder="Enter your email"
            icon={icons.email}
            autoCapitalize="none"
            value={form.email}
            onChangeText={(value) =>
              setForm({
                ...form,
                email: value,
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
                ...form,
                password: value,
              })
            }
          />

          <CustomButton
            title={isLoading ? "Processing..." : "Sign Up"}
            onPress={onSignUpPress}
            disabled={isLoading}
            className="mt-6"
          />

          {/* <OAuth /> */}

          <Link
            href="/sign-in"
            className="text-lg text-center text-general-200 mt-10"
          >
            <Text>Already have an account? </Text>
            <Text className="text-primary-500">Log In</Text>
          </Link>
        </View>

        {/* Verification Modal */}
        <ReactNativeModal
          isVisible={verification.state === "pending" || verification.state === "failed"}
          onBackdropPress={() => setVerification({ ...verification, state: "default" })}
        >
          <View className="bg-white px-7 py-9 rounded-2xl min-h-[300px]">
            <Text className="text-2xl font-JakartaExtraBold mb-2">Verification</Text>
            <Text className="font-Jakarta mb-5">
              We've sent a verification code to {form.email}
            </Text>

            <InputField
              label="Code"
              icon={icons.lock}
              placeholder="123456"
              value={verification.code}
              keyboardType="numeric"
              onChangeText={(code) => {
                setVerification({ ...verification, code });
                if (code.length === 6) {
                  Keyboard.dismiss();
                }
              }}
            />

            {verification.error && (
              <Text className="text-red-500 text-sm mt-1">{verification.error}</Text>
            )}

            <CustomButton
              title={isLoading ? "Verifying..." : "Verify Email"}
              onPress={onPressVerify}
              disabled={isLoading}
              className="mt-5 bg-success-500"
            />
          </View>
        </ReactNativeModal>
      </View>
    </ScrollView>
  );
};

export default SignUp;
