import { useAuth, useSignUp } from "@clerk/expo";
import clsx from "clsx";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import AuthBrand from "@/components/auth/AuthBrand";
import AuthScreen from "@/components/auth/AuthScreen";
import { colors } from "@/constants/theme";
import {
  getClerkFieldError,
  getClerkFormError,
  validateCode,
  validateEmail,
  validateName,
  validatePassword,
  type AuthFieldErrors,
} from "@/lib/auth";

export default function SignUpScreen() {
  const { signUp, errors, fetchStatus } = useSignUp();
  const { isSignedIn } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});
  const [formError, setFormError] = useState<string | undefined>();
  const [pendingVerification, setPendingVerification] = useState(false);

  const isFetching = fetchStatus === "fetching";
  const canSubmit =
    name.trim().length > 0 && emailAddress.trim().length > 0 && password.length > 0;
  const canVerify = code.trim().length > 0;

  const clerkNameError = getClerkFieldError(errors, "firstName", "name");
  const clerkEmailError = getClerkFieldError(errors, "emailAddress");
  const clerkPasswordError = getClerkFieldError(errors, "password");
  const clerkCodeError = getClerkFieldError(errors, "code");
  const clerkFormError = getClerkFormError(errors);

  const showVerification =
    pendingVerification ||
    (signUp.status === "missing_requirements" &&
      signUp.unverifiedFields?.includes("email_address") &&
      (signUp.missingFields?.length ?? 0) === 0);

  const finishSignUp = async () => {
    const { error } = await signUp.finalize({
      navigate: async () => {
        router.replace("/(tabs)");
      },
    });

    if (error) {
      setFormError(error.message || "Unable to finish creating your account.");
    }
  };

  const handleSubmit = async () => {
    const nextErrors: AuthFieldErrors = {
      name: validateName(name),
      email: validateEmail(emailAddress),
      password: validatePassword(password, { isSignUp: true }),
    };

    setFieldErrors(nextErrors);
    setFormError(undefined);

    if (nextErrors.name || nextErrors.email || nextErrors.password) return;

    const firstName = name.trim().split(/\s+/)[0];
    const lastNameParts = name.trim().split(/\s+/).slice(1);
    const lastName = lastNameParts.length > 0 ? lastNameParts.join(" ") : undefined;

    const { error } = await signUp.password({
      emailAddress: emailAddress.trim(),
      password,
      firstName,
      ...(lastName ? { lastName } : {}),
    });

    if (error) {
      setFormError(error.message || "Unable to create your account. Please try again.");
      return;
    }

    const { error: sendError } = await signUp.verifications.sendEmailCode();
    if (sendError) {
      setFormError(sendError.message || "Unable to send verification code.");
      return;
    }

    setPendingVerification(true);
  };

  const handleVerify = async () => {
    const codeError = validateCode(code);
    setFieldErrors({ code: codeError });
    setFormError(undefined);

    if (codeError) return;

    const { error } = await signUp.verifications.verifyEmailCode({
      code: code.trim(),
    });

    if (error) {
      setFormError(error.message || "Invalid verification code.");
      return;
    }

    if (signUp.status === "complete") {
      await finishSignUp();
      return;
    }

    setFormError("Verification could not be completed. Please try again.");
  };

  const handleResendCode = async () => {
    setFormError(undefined);
    const { error } = await signUp.verifications.sendEmailCode();
    if (error) {
      setFormError(error.message || "Unable to resend verification code.");
    }
  };

  if (signUp.status === "complete" || isSignedIn) {
    return null;
  }

  if (showVerification) {
    return (
      <AuthScreen
        footer={
          <View className="auth-link-row">
            <Text className="auth-link-copy">Wrong email?</Text>
            <Pressable
              hitSlop={8}
              onPress={() => {
                setPendingVerification(false);
                setCode("");
                setFieldErrors({});
                setFormError(undefined);
              }}
            >
              <Text className="auth-link">Go back</Text>
            </Pressable>
          </View>
        }
      >
        <AuthBrand />

        <View className="mt-8 items-center">
          <Text className="auth-title">Check your email</Text>
          <Text className="auth-subtitle">
            We sent a 6-digit code to {emailAddress.trim()}. Enter it below to activate your
            Recurly account.
          </Text>
        </View>

        <View className="auth-card">
          <View className="auth-form">
            <View className="auth-field">
              <Text className="auth-label">Verification code</Text>
              <TextInput
                className={clsx(
                  "auth-input",
                  (fieldErrors.code || clerkCodeError) && "auth-input-error",
                )}
                placeholder="Enter 6-digit code"
                placeholderTextColor={colors.mutedForeground}
                value={code}
                onChangeText={(value) => {
                  setCode(value.replace(/\D/g, "").slice(0, 6));
                  if (fieldErrors.code) {
                    setFieldErrors((current) => ({
                      ...current,
                      code: validateCode(value),
                    }));
                  }
                }}
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                autoComplete="one-time-code"
                returnKeyType="done"
                onSubmitEditing={handleVerify}
              />
              {(fieldErrors.code || clerkCodeError) && (
                <Text className="auth-error">{fieldErrors.code || clerkCodeError}</Text>
              )}
              <Text className="auth-helper">Codes expire quickly for your security.</Text>
            </View>

            {(formError || clerkFormError) && (
              <Text className="auth-error">{formError || clerkFormError}</Text>
            )}

            <Pressable
              className={clsx("auth-button", (!canVerify || isFetching) && "auth-button-disabled")}
              onPress={handleVerify}
              disabled={!canVerify || isFetching}
            >
              {isFetching ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text className="auth-button-text">Verify email</Text>
              )}
            </Pressable>

            <Pressable
              className="auth-secondary-button"
              onPress={handleResendCode}
              disabled={isFetching}
            >
              <Text className="auth-secondary-button-text">Resend code</Text>
            </Pressable>
          </View>
        </View>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      footer={
        <View className="auth-link-row">
          <Text className="auth-link-copy">Already have an account?</Text>
          <Link href="/(auth)/sign-in" asChild>
            <Pressable hitSlop={8}>
              <Text className="auth-link">Sign in</Text>
            </Pressable>
          </Link>
        </View>
      }
    >
      <AuthBrand />

      <View className="mt-8 items-center">
        <Text className="auth-title">Create your account</Text>
        <Text className="auth-subtitle">
          Start tracking renewals, spend, and upcoming bills in one place.
        </Text>
      </View>

      <View className="auth-card">
        <View className="auth-form">
          <View className="auth-field">
            <Text className="auth-label">Name</Text>
            <TextInput
              className={clsx(
                "auth-input",
                (fieldErrors.name || clerkNameError) && "auth-input-error",
              )}
              placeholder="Your name"
              placeholderTextColor={colors.mutedForeground}
              value={name}
              onChangeText={(value) => {
                setName(value);
                if (fieldErrors.name) {
                  setFieldErrors((current) => ({
                    ...current,
                    name: validateName(value),
                  }));
                }
              }}
              autoCapitalize="words"
              textContentType="name"
              autoComplete="name"
              returnKeyType="next"
            />
            {(fieldErrors.name || clerkNameError) && (
              <Text className="auth-error">{fieldErrors.name || clerkNameError}</Text>
            )}
          </View>

          <View className="auth-field">
            <Text className="auth-label">Email</Text>
            <TextInput
              className={clsx(
                "auth-input",
                (fieldErrors.email || clerkEmailError) && "auth-input-error",
              )}
              placeholder="Enter your email"
              placeholderTextColor={colors.mutedForeground}
              value={emailAddress}
              onChangeText={(value) => {
                setEmailAddress(value);
                if (fieldErrors.email) {
                  setFieldErrors((current) => ({
                    ...current,
                    email: validateEmail(value),
                  }));
                }
              }}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              autoComplete="email"
              returnKeyType="next"
            />
            {(fieldErrors.email || clerkEmailError) && (
              <Text className="auth-error">{fieldErrors.email || clerkEmailError}</Text>
            )}
          </View>

          <View className="auth-field">
            <Text className="auth-label">Password</Text>
            <TextInput
              className={clsx(
                "auth-input",
                (fieldErrors.password || clerkPasswordError) && "auth-input-error",
              )}
              placeholder="Create a password"
              placeholderTextColor={colors.mutedForeground}
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                if (fieldErrors.password) {
                  setFieldErrors((current) => ({
                    ...current,
                    password: validatePassword(value, { isSignUp: true }),
                  }));
                }
              }}
              secureTextEntry
              textContentType="newPassword"
              autoComplete="new-password"
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
            {(fieldErrors.password || clerkPasswordError) && (
              <Text className="auth-error">
                {fieldErrors.password || clerkPasswordError}
              </Text>
            )}
            <Text className="auth-helper">Use at least 8 characters.</Text>
          </View>

          {(formError || clerkFormError) && (
            <Text className="auth-error">{formError || clerkFormError}</Text>
          )}

          <Pressable
            className={clsx("auth-button", (!canSubmit || isFetching) && "auth-button-disabled")}
            onPress={handleSubmit}
            disabled={!canSubmit || isFetching}
          >
            {isFetching ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text className="auth-button-text">Create account</Text>
            )}
          </Pressable>
        </View>
      </View>

      {/* Required for sign-up flows on Expo web. Clerk skips CAPTCHA on iOS/Android. */}
      <View nativeID="clerk-captcha" />
    </AuthScreen>
  );
}
