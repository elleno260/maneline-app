import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FirebaseError } from 'firebase/app';

import {
  continueAsGuest,
  loginUser,
  registerUser,
} from '../services/authService';

import {
  getUserHairProfileOrNull,
  updateUserHairProfile,
} from '../services/profileFirebaseService';

/* =========================================================
   COLORS
   ========================================================= */

const COLORS = {
  lemonCream: '#FFF9C7',
  brown: '#3D2920',
  lightBlue: '#95BFFF',
  oxfordBlue: '#20314B',
  green: '#667D41',

  white: '#FFFFFF',
  background: '#FFFDF2',
  mutedText: '#746B64',
  border: '#E7E2CB',
  inputBackground: '#FFFEF8',
};

/* =========================================================
   TYPES
   ========================================================= */

type AuthMode =
  | 'login'
  | 'register';

/* =========================================================
   SCREEN
   ========================================================= */

export default function LoginScreen() {
  const insets =
    useSafeAreaInsets();
const params =
  useLocalSearchParams<{
    mode?: string;
  }>();

const initialMode: AuthMode =
  params.mode === 'register'
    ? 'register'
    : 'login';
  const [
    mode,
    setMode,
  ] =
    useState<AuthMode>(
      initialMode
    );

  const [
    email,
    setEmail,
  ] =
    useState('');

  const [
    password,
    setPassword,
  ] =
    useState('');

  const [
    confirmPassword,
    setConfirmPassword,
  ] =
    useState('');

  const [
    showPassword,
    setShowPassword,
  ] =
    useState(false);

  const [
    isSubmitting,
    setIsSubmitting,
  ] =
    useState(false);

  const isRegistering =
    mode === 'register';

  /* =======================================================
     ROUTE USER AFTER AUTH
     ======================================================= */

  async function routeAfterAuth() {
    const profile =
      await getUserHairProfileOrNull();

    /*
     * Existing ManeLine user:
     * send them directly into the app.
     */
    if (profile) {
      router.replace(
        '/(tabs)' as never
      );

      return;
    }

    /*
     * New user:
     * start hair profile onboarding.
     */
    router.replace(
      '/hairProfileSetup' as never
    );
  }

  /* =======================================================
     LOG IN
     ======================================================= */

  async function handleLogin() {
    const normalizedEmail =
      email
        .trim()
        .toLowerCase();

    if (
      !normalizedEmail ||
      !password
    ) {
      Alert.alert(
        'Missing information',
        'Enter your email and password.'
      );

      return;
    }

    try {
      setIsSubmitting(
        true
      );

      await loginUser(
        normalizedEmail,
        password
      );

      await routeAfterAuth();
    } catch (
      error: unknown
    ) {
      console.error(
        'Login failed:',
        error
      );

      Alert.alert(
        'Could not log in',
        getAuthErrorMessage(
          error
        )
      );
    } finally {
      setIsSubmitting(
        false
      );
    }
  }

  /* =======================================================
     CREATE ACCOUNT
     ======================================================= */

  async function handleRegister() {
    const normalizedEmail =
      email
        .trim()
        .toLowerCase();

    if (
      !normalizedEmail ||
      !password ||
      !confirmPassword
    ) {
      Alert.alert(
        'Missing information',
        'Enter your email, password, and password confirmation.'
      );

      return;
    }

    if (
      password.length < 6
    ) {
      Alert.alert(
        'Password too short',
        'Your password must be at least 6 characters.'
      );

      return;
    }

    if (
      password !==
      confirmPassword
    ) {
      Alert.alert(
        'Passwords do not match',
        'Make sure both passwords are the same.'
      );

      return;
    }

    try {
      setIsSubmitting(
        true
      );

      /*
       * If the current Firebase user is anonymous,
       * registerUser() links these credentials to
       * that guest account rather than creating
       * a new UID.
       */
      const user =
        await registerUser(
          normalizedEmail,
          password
        );

      /*
       * Check whether the guest already had a
       * ManeLine profile.
       */
      const existingProfile =
        await getUserHairProfileOrNull();

      if (existingProfile) {
        /*
         * Guest profile already exists.
         *
         * Save the newly registered email into
         * the existing profile document.
         */
        await updateUserHairProfile(
          {
            email:
              user.email ??
              normalizedEmail,
          }
        );

        router.replace(
          '/(tabs)' as never
        );

        return;
      }

      /*
       * Completely new account:
       * begin onboarding.
       */
      router.replace(
        '/hairProfileSetup' as never
      );
    } catch (
      error: unknown
    ) {
      console.error(
        'Registration failed:',
        error
      );

      Alert.alert(
        'Could not create account',
        getAuthErrorMessage(
          error
        )
      );
    } finally {
      setIsSubmitting(
        false
      );
    }
  }

  /* =======================================================
     CONTINUE AS GUEST
     ======================================================= */

  async function handleGuest() {
    try {
      setIsSubmitting(
        true
      );

      await continueAsGuest();

      await routeAfterAuth();
    } catch (
      error: unknown
    ) {
      console.error(
        'Guest sign-in failed:',
        error
      );

      Alert.alert(
        'Could not continue',
        'ManeLine could not start your guest session. Please check your connection and try again.'
      );
    } finally {
      setIsSubmitting(
        false
      );
    }
  }

  /* =======================================================
     SWITCH LOGIN / REGISTER
     ======================================================= */

  function switchMode() {
    setMode(
      isRegistering
        ? 'login'
        : 'register'
    );

    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
  }

  /* =======================================================
     UI
     ======================================================= */

  return (
    <KeyboardAvoidingView
      style={
        styles.screen
      }
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : undefined
      }
    >
      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          {
            paddingTop:
              insets.top +
              36,

            paddingBottom:
              insets.bottom +
              28,
          },
        ]}
      >
        {/* ===============================================
            BRAND
            =============================================== */}

        <View
          style={
            styles.brandSection
          }
        >
          <View
            style={
              styles.logo
            }
          >
            <Text
              style={
                styles.logoText
              }
            >
              M
            </Text>
          </View>

          <Text
            style={
              styles.brandName
            }
          >
            ManeLine
          </Text>

          <Text
            style={
              styles.brandSubtitle
            }
          >
            Hair care that understands you.
          </Text>
        </View>

        {/* ===============================================
            AUTH CARD
            =============================================== */}

        <View
          style={
            styles.card
          }
        >
          <Text
            style={
              styles.title
            }
          >
            {isRegistering
              ? 'Create your account'
              : 'Welcome back'}
          </Text>

          <Text
            style={
              styles.subtitle
            }
          >
            {isRegistering
              ? 'Create an account to keep your hair profile, routines, scans, and recommendations with you.'
              : 'Sign in to continue your personalized ManeLine experience.'}
          </Text>

          {/* EMAIL */}

          <Text
            style={
              styles.label
            }
          >
            Email
          </Text>

          <TextInput
            style={
              styles.input
            }
            placeholder="you@example.com"
            placeholderTextColor={
              '#9A928A'
            }
            value={email}
            onChangeText={
              setEmail
            }
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={
              false
            }
            editable={
              !isSubmitting
            }
            returnKeyType="next"
          />

          {/* PASSWORD */}

          <Text
            style={
              styles.label
            }
          >
            Password
          </Text>

          <View
            style={
              styles.passwordContainer
            }
          >
            <TextInput
              style={
                styles.passwordInput
              }
              placeholder={
                isRegistering
                  ? 'At least 6 characters'
                  : 'Enter your password'
              }
              placeholderTextColor={
                '#9A928A'
              }
              value={
                password
              }
              onChangeText={
                setPassword
              }
              secureTextEntry={
                !showPassword
              }
              autoCapitalize="none"
              autoCorrect={
                false
              }
              editable={
                !isSubmitting
              }
            />

            <Pressable
              style={
                styles.eyeButton
              }
              onPress={() =>
                setShowPassword(
                  (
                    current
                  ) =>
                    !current
                )
              }
              disabled={
                isSubmitting
              }
            >
              <Ionicons
                name={
                  showPassword
                    ? 'eye-off-outline'
                    : 'eye-outline'
                }
                size={21}
                color={
                  COLORS.oxfordBlue
                }
              />
            </Pressable>
          </View>

          {/* CONFIRM PASSWORD */}

          {isRegistering && (
            <>
              <Text
                style={
                  styles.label
                }
              >
                Confirm Password
              </Text>

              <TextInput
                style={
                  styles.input
                }
                placeholder="Re-enter your password"
                placeholderTextColor={
                  '#9A928A'
                }
                value={
                  confirmPassword
                }
                onChangeText={
                  setConfirmPassword
                }
                secureTextEntry={
                  !showPassword
                }
                autoCapitalize="none"
                autoCorrect={
                  false
                }
                editable={
                  !isSubmitting
                }
              />
            </>
          )}

          {/* PRIMARY BUTTON */}

          <Pressable
            style={({
              pressed,
            }) => [
              styles.primaryButton,

              pressed &&
                styles.pressedButton,

              isSubmitting &&
                styles.disabledButton,
            ]}
            disabled={
              isSubmitting
            }
            onPress={
              isRegistering
                ? handleRegister
                : handleLogin
            }
          >
            {isSubmitting ? (
              <ActivityIndicator
                color={
                  COLORS.white
                }
              />
            ) : (
              <>
                <Text
                  style={
                    styles.primaryButtonText
                  }
                >
                  {isRegistering
                    ? 'Create Account'
                    : 'Log In'}
                </Text>

                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color={
                    COLORS.white
                  }
                />
              </>
            )}
          </Pressable>

          {/* SWITCH MODE */}

          <Pressable
            onPress={
              switchMode
            }
            disabled={
              isSubmitting
            }
            style={
              styles.switchButton
            }
          >
            <Text
              style={
                styles.switchText
              }
            >
              {isRegistering
                ? 'Already have an account? '
                : "Don't have an account? "}

              <Text
                style={
                  styles.switchTextStrong
                }
              >
                {isRegistering
                  ? 'Log in'
                  : 'Create one'}
              </Text>
            </Text>
          </Pressable>

          {/* DIVIDER */}

          <View
            style={
              styles.dividerRow
            }
          >
            <View
              style={
                styles.divider
              }
            />

            <Text
              style={
                styles.dividerText
              }
            >
              OR
            </Text>

            <View
              style={
                styles.divider
              }
            />
          </View>

          {/* GUEST */}

          <Pressable
            style={({
              pressed,
            }) => [
              styles.guestButton,

              pressed &&
                styles.guestButtonPressed,

              isSubmitting &&
                styles.disabledButton,
            ]}
            onPress={
              handleGuest
            }
            disabled={
              isSubmitting
            }
          >
            <Text
              style={
                styles.guestButtonText
              }
            >
              Continue as Guest
            </Text>
          </Pressable>

          <View
            style={
              styles.guestInfo
            }
          >
            <Ionicons
              name="information-circle-outline"
              size={16}
              color={
                COLORS.green
              }
            />

            <Text
              style={
                styles.guestInfoText
              }
            >
              You can create an account later without losing your ManeLine profile.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* =========================================================
   AUTH ERROR MESSAGES
   ========================================================= */

function getAuthErrorMessage(
  error: unknown
): string {
  if (
    !(
      error instanceof
      FirebaseError
    )
  ) {
    return 'Something went wrong. Please try again.';
  }

  switch (
    error.code
  ) {
    case 'auth/invalid-email':
      return 'Enter a valid email address.';

    case 'auth/invalid-credential':
      return 'The email or password is incorrect.';

    case 'auth/user-not-found':
      return 'No account was found with this email.';

    case 'auth/wrong-password':
      return 'The email or password is incorrect.';

    case 'auth/email-already-in-use':
      return 'An account already exists with this email. Try logging in instead.';

    case 'auth/weak-password':
      return 'Choose a stronger password with at least 6 characters.';

    case 'auth/network-request-failed':
      return 'Check your internet connection and try again.';

    case 'auth/too-many-requests':
      return 'Too many attempts were made. Wait a moment and try again.';

    case 'auth/credential-already-in-use':
      return 'This email is already connected to another account. Try logging in instead.';

    case 'auth/provider-already-linked':
      return 'This account already has login credentials. Try logging in instead.';

    default:
      console.warn(
        'Firebase Auth error:',
        error.code,
        error.message
      );

      return 'Authentication failed. Please try again.';
  }
}

/* =========================================================
   STYLES
   ========================================================= */

const styles =
  StyleSheet.create({
    screen: {
      flex: 1,

      backgroundColor:
        COLORS.background,
    },

    content: {
      flexGrow: 1,

      justifyContent:
        'center',

      paddingHorizontal:
        22,
    },

    /* BRAND */

    brandSection: {
      alignItems:
        'center',

      marginBottom:
        28,
    },

    logo: {
      width: 68,
      height: 68,

      borderRadius:
        24,

      backgroundColor:
        COLORS.lemonCream,

      alignItems:
        'center',

      justifyContent:
        'center',

      marginBottom:
        12,

      borderWidth: 1,

      borderColor:
        '#EFE6A7',
    },

    logoText: {
      fontSize: 31,

      fontWeight:
        '900',

      color:
        COLORS.oxfordBlue,
    },

    brandName: {
      fontSize: 31,

      fontWeight:
        '900',

      color:
        COLORS.brown,

      letterSpacing:
        -0.7,
    },

    brandSubtitle: {
      marginTop: 5,

      fontSize: 14,

      color:
        COLORS.mutedText,

      textAlign:
        'center',
    },

    /* CARD */

    card: {
      width: '100%',

      padding: 22,

      borderRadius:
        28,

      backgroundColor:
        COLORS.white,

      borderWidth: 1,

      borderColor:
        COLORS.border,
    },

    title: {
      fontSize: 25,

      fontWeight:
        '900',

      color:
        COLORS.brown,

      letterSpacing:
        -0.4,
    },

    subtitle: {
      marginTop: 8,

      marginBottom:
        24,

      fontSize: 13,

      lineHeight: 19,

      color:
        COLORS.mutedText,
    },

    /* INPUTS */

    label: {
      marginBottom: 7,

      fontSize: 12,

      fontWeight:
        '800',

      color:
        COLORS.oxfordBlue,
    },

    input: {
      width: '100%',

      height: 52,

      marginBottom:
        17,

      paddingHorizontal:
        15,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      borderRadius:
        15,

      backgroundColor:
        COLORS.inputBackground,

      fontSize: 15,

      color:
        COLORS.brown,
    },

    passwordContainer: {
      width: '100%',

      height: 52,

      marginBottom:
        17,

      flexDirection:
        'row',

      alignItems:
        'center',

      borderWidth: 1,

      borderColor:
        COLORS.border,

      borderRadius:
        15,

      backgroundColor:
        COLORS.inputBackground,
    },

    passwordInput: {
      flex: 1,

      height: '100%',

      paddingLeft:
        15,

      paddingRight:
        5,

      fontSize: 15,

      color:
        COLORS.brown,
    },

    eyeButton: {
      width: 50,

      height: '100%',

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    /* PRIMARY */

    primaryButton: {
      height: 53,

      marginTop: 5,

      paddingHorizontal:
        18,

      borderRadius:
        16,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'center',

      gap: 8,

      backgroundColor:
        COLORS.oxfordBlue,
    },

    primaryButtonText: {
      fontSize: 15,

      fontWeight:
        '900',

      color:
        COLORS.white,
    },

    pressedButton: {
      opacity: 0.88,
    },

    disabledButton: {
      opacity: 0.58,
    },

    /* SWITCH */

    switchButton: {
      paddingVertical:
        4,

      marginTop:
        13,
    },

    switchText: {
      textAlign:
        'center',

      fontSize: 13,

      color:
        COLORS.mutedText,
    },

    switchTextStrong: {
      fontWeight:
        '900',

      color:
        COLORS.oxfordBlue,
    },

    /* DIVIDER */

    dividerRow: {
      marginVertical:
        21,

      flexDirection:
        'row',

      alignItems:
        'center',
    },

    divider: {
      flex: 1,

      height: 1,

      backgroundColor:
        COLORS.border,
    },

    dividerText: {
      marginHorizontal:
        12,

      fontSize: 10,

      fontWeight:
        '800',

      color:
        COLORS.mutedText,
    },

    /* GUEST */

    guestButton: {
      height: 51,

      borderWidth: 1.5,

      borderColor:
        COLORS.oxfordBlue,

      borderRadius:
        16,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.white,
    },

    guestButtonPressed: {
      backgroundColor:
        COLORS.lemonCream,
    },

    guestButtonText: {
      fontSize: 14,

      fontWeight:
        '900',

      color:
        COLORS.oxfordBlue,
    },

    guestInfo: {
      marginTop: 12,

      paddingHorizontal:
        6,

      flexDirection:
        'row',

      alignItems:
        'flex-start',

      justifyContent:
        'center',

      gap: 6,
    },

    guestInfoText: {
      flex: 1,

      fontSize: 11,

      lineHeight: 16,

      color:
        COLORS.mutedText,

      textAlign:
        'center',
    },
  });