import React, { useState } from 'react';
import {
  View,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import {
  UserRound,
  Lock,
  Eye,
  EyeOff,
  Leaf,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react-native';
import { colors, fonts } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { normalizeApiError } from '../../services/api';
import { haptics } from '../../utils/haptics';
import { Txt } from '../../components/Txt';
import { Screen } from '../../components/Screen';

export default function LoginScreen() {
  const { login } = useAuth();

  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!usernameOrEmail.trim() || !password) {
      setErrorMessage('Please enter both your email/username and password.');
      haptics.selection();
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      await login({
        username: usernameOrEmail.trim(),
        password,
      });

      haptics.success();
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)');
      }
    } catch (err: unknown) {
      haptics.selection();
      const normalized = normalizeApiError(err);
      setErrorMessage(normalized.message || 'Invalid username/email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    haptics.selection();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header navigation */}
          <View style={styles.topBar}>
            <Pressable onPress={handleDismiss} hitSlop={12} style={styles.backButton}>
              <ArrowLeft size={22} color={colors.ink} />
            </Pressable>
            <Pressable onPress={handleDismiss} hitSlop={12}>
              <Txt weight="medium" style={styles.guestLink}>
                Skip for now
              </Txt>
            </Pressable>
          </View>

          {/* Brand header */}
          <View style={styles.brandContainer}>
            <View style={styles.iconCircle}>
              <Leaf size={28} color={colors.green} />
            </View>
            <Txt weight="bold" style={styles.brandTitle}>
              freshly.
            </Txt>
            <Txt weight="bold" style={styles.welcomeHeading}>
              Welcome back
            </Txt>
            <Txt style={styles.welcomeSub}>
              Log in to access your orders, saved addresses and farm-fresh favourites.
            </Txt>
          </View>

          {/* Error banner */}
          {errorMessage ? (
            <View style={styles.errorBanner}>
              <AlertCircle size={18} color={colors.red} style={styles.errorIcon} />
              <Txt style={styles.errorText}>{errorMessage}</Txt>
            </View>
          ) : null}

          {/* Form */}
          <View style={styles.form}>
            {/* Username or Email */}
            <View style={styles.inputWrapper}>
              <Txt weight="medium" style={styles.label}>
                Email or Username
              </Txt>
              <View style={styles.inputRow}>
                <UserRound size={19} color={colors.muted} />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. foodlover or you@example.com"
                  placeholderTextColor={colors.muted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={usernameOrEmail}
                  onChangeText={(val) => {
                    setUsernameOrEmail(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  editable={!loading}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputWrapper}>
              <Txt weight="medium" style={styles.label}>
                Password
              </Txt>
              <View style={styles.inputRow}>
                <Lock size={19} color={colors.muted} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.muted}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  editable={!loading}
                />
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={10}
                >
                  {showPassword ? (
                    <EyeOff size={19} color={colors.muted} />
                  ) : (
                    <Eye size={19} color={colors.muted} />
                  )}
                </Pressable>
              </View>
            </View>

            {/* Submit button */}
            <Pressable
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Txt weight="semibold" style={styles.submitText}>
                  Log in
                </Txt>
              )}
            </Pressable>

            {/* Link to Signup */}
            <View style={styles.switchAuthRow}>
              <Txt style={styles.switchAuthText}>{"Don't have an account?"}</Txt>
              <Pressable
                onPress={() => {
                  haptics.selection();
                  router.push('/(auth)/signup');
                }}
              >
                <Txt weight="bold" style={styles.switchAuthLink}>
                  Sign up
                </Txt>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    padding: 4,
  },
  guestLink: {
    fontSize: 13,
    color: colors.muted,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.softGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  brandTitle: {
    fontSize: 22,
    color: colors.green,
    letterSpacing: -0.6,
  },
  welcomeHeading: {
    fontSize: 24,
    color: colors.ink,
    marginTop: 8,
    letterSpacing: -0.5,
  },
  welcomeSub: {
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDECEB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F8B4B0',
  },
  errorIcon: {
    marginRight: 10,
  },
  errorText: {
    flex: 1,
    color: colors.red,
    fontSize: 12,
    lineHeight: 16,
  },
  form: {
    gap: 18,
  },
  inputWrapper: {
    gap: 7,
  },
  label: {
    fontSize: 13,
    color: colors.ink,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
    gap: 10,
  },
  textInput: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.ink,
  },
  submitButton: {
    backgroundColor: colors.green,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.65,
  },
  submitText: {
    color: colors.white,
    fontSize: 15,
  },
  switchAuthRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
  },
  switchAuthText: {
    fontSize: 13,
    color: colors.muted,
  },
  switchAuthLink: {
    fontSize: 13,
    color: colors.green,
  },
});

