import { useSignIn } from "@clerk/expo";
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
  validatePassword,
  type AuthFieldErrors,
} from "@/lib/auth";

export default function SignInScreen() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});
  const [formError, setFormError] = useState<string | undefined>();
  const [needsVerification, setNeedsVerification] = useState(false);

  const isFetching = fetchStatus === "fetching";
  const canSubmit = emailAddress.trim().length > 0 && password.length > 0;
  const canVerify = code.trim().length > 0;

  const clerkEmailError = getClerkFieldError(errors, "emailAddress", "identifier");
  const clerkPasswordError = getClerkFieldError(errors, "password");
  const clerkCodeError = getClerkFieldError(errors, "code");
  const clerkFormError = getClerkFormError(errors);

  const finishSignIn = async () => {
    const { error } = await signIn.finalize({
      navigate: async () => {
        router.replace("/(tabs)");
      },
    });

    if (error) {
      setFormError(error.message || "Unable to finish signing in. Please try again.");
    }
  };

  const handleSubmit = async () => {
    const nextErrors: AuthFieldErrors = {
      email: validateEmail(emailAddress),
      password: validatePassword(password),
    };

    setFieldErrors(nextErrors);
    setFormError(undefined);

    if (nextErrors.email || nextErrors.password) return;

    const { error } = await signIn.password({
      emailAddress: emailAddress.trim(),
      password,
    });

    if (error) {
      setFormError(error.message || "Unable to sign in. Check your details and try again.");
      return;
    }

    if (signIn.status === "complete") {
      await finishSignIn();
      return;
    }

    if (signIn.status === "needs_client_trust") {
      const emailCodeFactor = signIn.supportedSecondFactors?.find(
        (factor) => factor.strategy === "email_code",
      );

      if (emailCodeFactor) {
        const { error: sendError } = await signIn.mfa.sendEmailCode();
        if (sendError) {
          setFormError(sendError.message || "Unable to send verification code.");
          return;
        }
        setNeedsVerification(true);
        return;
      }

      setFormError("Additional verification is required for this device.");
      return;
    }

    if (signIn.status === "needs_second_factor") {
      setFormError("Two-factor authentication is required for this account.");
      return;
    }

    setFormError("Sign-in could not be completed. Please try again.");
  };

  const handleVerify = async () => {
    const codeError = validateCode(code);
    setFieldErrors({ code: codeError });
    setFormError(undefined);

    if (codeError) return;

    const { error } = await signIn.mfa.verifyEmailCode({ code: code.trim() });
    if (error) {
      setFormError(error.message || "Invalid verification code.");
      return;
    }

    if (signIn.status === "complete") {
      await finishSignIn();
      return;
    }

    setFormError("Verification could not be completed. Please try again.");
  };

  const handleResendCode = async () => {
    setFormError(undefined);
    const { error } = await signIn.mfa.sendEmailCode();
    if (error) {
      setFormError(error.message || "Unable to resend verification code.");
    }
  };

  const handleStartOver = async () => {
    await signIn.reset();
    setNeedsVerification(false);
    setCode("");
    setFieldErrors({});
    setFormError(undefined);
  };

  if (needsVerification || signIn.status === "needs_client_trust") {
    return (
      <AuthScreen
        footer={
          <View className="auth-link-row">
            <Pressable onPress={handleStartOver} hitSlop={8}>
              <Text className="auth-link">Use a different account</Text>
            </Pressable>
          </View>
        }
      >
        <AuthBrand />

        <View className="mt-8 items-center">
          <Text className="auth-title">Verify it is you</Text>
          <Text className="auth-subtitle">
            Enter the 6-digit code we sent to {emailAddress.trim() || "your email"} so we can
            keep your subscriptions secure.
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
                <Text className="auth-button-text">Verify and continue</Text>
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
          <Text className="auth-link-copy">New to Recurly?</Text>
          <Link href="/(auth)/sign-up" asChild>
            <Pressable hitSlop={8}>
              <Text className="auth-link">Create an account</Text>
            </Pressable>
          </Link>
        </View>
      }
    >
      <AuthBrand />

      <View className="mt-8 items-center">
        <Text className="auth-title">Welcome back</Text>
        <Text className="auth-subtitle">
          Sign in to continue managing your subscriptions
        </Text>
      </View>

      <View className="auth-card">
        <View className="auth-form">
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
              placeholder="Enter your password"
              placeholderTextColor={colors.mutedForeground}
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                if (fieldErrors.password) {
                  setFieldErrors((current) => ({
                    ...current,
                    password: validatePassword(value),
                  }));
                }
              }}
              secureTextEntry
              textContentType="password"
              autoComplete="password"
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
            {(fieldErrors.password || clerkPasswordError) && (
              <Text className="auth-error">
                {fieldErrors.password || clerkPasswordError}
              </Text>
            )}
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
              <Text className="auth-button-text">Sign in</Text>
            )}
          </Pressable>
        </View>
      </View>
    </AuthScreen>
  );
}
