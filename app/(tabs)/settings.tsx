import { useAuth, useUser } from "@clerk/expo";
import clsx from "clsx";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { colors } from "@/constants/theme";
import { getDisplayName } from "@/lib/auth";
import { posthog } from "@/lib/posthog";

const SafeAreaView = styled(RNSafeAreaView);

const Settings = () => {
  const { signOut } = useAuth();
  const { user } = useUser();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const displayName = getDisplayName(user);
  const email = user?.primaryEmailAddress?.emailAddress;

  const handleSignOut = async () => {
    setError(undefined);
    setIsSigningOut(true);

    try {
      await signOut();
      posthog?.reset();
    } catch {
      setError("Unable to sign out. Please try again.");
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <Text className="subs-title">Settings</Text>

      <View className="auth-card mt-6">
        <View className="auth-form">
          <View className="auth-field">
            <Text className="auth-label">Profile</Text>
            <Text className="text-lg font-sans-bold text-primary">{displayName}</Text>
            {email ? (
              <Text className="auth-helper">{email}</Text>
            ) : null}
          </View>

          {error ? <Text className="auth-error">{error}</Text> : null}

          <Pressable
            className={clsx("auth-button", isSigningOut && "auth-button-disabled")}
            onPress={handleSignOut}
            disabled={isSigningOut}
          >
            {isSigningOut ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text className="auth-button-text">Sign out</Text>
            )}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Settings;
