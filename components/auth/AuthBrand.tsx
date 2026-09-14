import { Text, View } from "react-native";

const AuthBrand = () => {
  return (
    <View className="auth-brand-block">
      <View className="auth-logo-wrap">
        <View className="auth-logo-mark">
          <Text className="auth-logo-mark-text">R</Text>
        </View>
        <View>
          <Text className="auth-wordmark">Recurly</Text>
          <Text className="auth-wordmark-sub">Smart Billing</Text>
        </View>
      </View>
    </View>
  );
};

export default AuthBrand;
