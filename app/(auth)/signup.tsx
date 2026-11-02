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
  Mail,
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

export default function SignupScreen() {
  const { signup } = useAuth();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSignup = async () => {
    if (!username.trim() || !email.trim() || !password || !passwordConfirm) {
      setErrorMessage('Please fill in all required fields.');
      haptics.selection();
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setErrorMessage('Please enter a valid email address.');
      haptics.selection();
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      haptics.selection();
      return;
    }

    if (password !== passwordConfirm) {
      setErrorMessage('Passwords do not match.');
      haptics.selection();
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      await signup({
        username: username.trim(),
        email: email.trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        password,
        password_confirm: passwordConfirm,
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
      setErrorMessage(normalized.message || 'Failed to create account. Please check your details.');
    } finally {
      setLoading(false);
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
            <Pressable
              onPress={() => {
                haptics.selection();
                router.back();
              }}
              hitSlop={12}
              style={styles.backButton}
            >
              <ArrowLeft size={22} color={colors.ink} />
            </Pressable>
            <Pressable
              onPress={() => {
                haptics.selection();
                router.replace('/(tabs)');
              }}
              hitSlop={12}
            >
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
              Create your account
            </Txt>
            <Txt style={styles.welcomeSub}>
              Join FreshDash for farm-fresh produce delivered in minutes.
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
            {/* First & Last Name */}
            <View style={styles.rowInputs}>
              <View style={[styles.inputWrapper, styles.halfInput]}>
                <Txt weight="medium" style={styles.label}>
                  First Name
                </Txt>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Maya"
                    placeholderTextColor={colors.muted}
                    value={firstName}
                    onChangeText={setFirstName}
                    editable={!loading}
                  />
                </View>
              </View>

              <View style={[styles.inputWrapper, styles.halfInput]}>
                <Txt weight="medium" style={styles.label}>
                  Last Name
                </Txt>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Rao"
                    placeholderTextColor={colors.muted}
                    value={lastName}
                    onChangeText={setLastName}
                    editable={!loading}
                  />
                </View>
              </View>
            </View>

            {/* Username */}
            <View style={styles.inputWrapper}>
              <Txt weight="medium" style={styles.label}>
                Username *
              </Txt>
              <View style={styles.inputRow}>
                <UserRound size={19} color={colors.muted} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Choose a unique username"
                  placeholderTextColor={colors.muted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={username}
                  onChangeText={(val) => {
                    setUsername(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  editable={!loading}
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputWrapper}>
              <Txt weight="medium" style={styles.label}>
                Email address *
              </Txt>
              <View style={styles.inputRow}>
                <Mail size={19} color={colors.muted} />
                <TextInput
                  style={styles.textInput}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.muted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  editable={!loading}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputWrapper}>
              <Txt weight="medium" style={styles.label}>
                Password * (min. 8 characters)
              </Txt>
              <View style={styles.inputRow}>
                <Lock size={19} color={colors.muted} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Create a secure password"
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

            {/* Confirm Password */}
            <View style={styles.inputWrapper}>
              <Txt weight="medium" style={styles.label}>
                Confirm Password *
              </Txt>
              <View style={styles.inputRow}>
                <Lock size={19} color={colors.muted} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Re-enter your password"
                  placeholderTextColor={colors.muted}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  value={passwordConfirm}
                  onChangeText={(val) => {
                    setPasswordConfirm(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  editable={!loading}
                />
              </View>
            </View>

            {/* Submit button */}
            <Pressable
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSignup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Txt weight="semibold" style={styles.submitText}>
                  Create Account
                </Txt>
              )}
            </Pressable>

            {/* Link to Login */}
            <View style={styles.switchAuthRow}>
              <Txt style={styles.switchAuthText}>Already have an account?</Txt>
              <Pressable
                onPress={() => {
                  haptics.selection();
                  router.push('/(auth)/login');
                }}
              >
                <Txt weight="bold" style={styles.switchAuthLink}>
                  Log in
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
    marginBottom: 20,
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
    marginBottom: 24,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.softGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  brandTitle: {
    fontSize: 22,
    color: colors.green,
    letterSpacing: -0.6,
  },
  welcomeHeading: {
    fontSize: 22,
    color: colors.ink,
    marginTop: 6,
    letterSpacing: -0.4,
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
    marginBottom: 18,
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
    gap: 16,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  inputWrapper: {
    gap: 6,
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
    marginTop: 10,
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

