import {
  router,
} from 'expo-router';

import {
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  waitForAuthUser,
} from '../services/authService';

import {
  getUserHairProfileOrNull,
} from '../services/profileFirebaseService';

const COLORS = {
  background: '#FFFDF2',
  brown: '#3D2920',
  oxfordBlue: '#20314B',
};

export default function Index() {
  const [
    isCheckingAuth,
    setIsCheckingAuth,
  ] = useState(true);

  useEffect(() => {
    checkStartupState();
  }, []);

  async function checkStartupState() {
    try {
      /*
       * waitForAuthUser() ONLY checks whether
       * Firebase restored an existing session.
       *
       * It does not create a new guest.
       */
      const user =
        await waitForAuthUser();

      /* ===============================================
         NO SESSION
         =============================================== */

      if (!user) {
        router.replace(
          '/login' as never
        );

        return;
      }

      /* ===============================================
         EXISTING SESSION
         =============================================== */

      const profile =
        await getUserHairProfileOrNull();

      /*
       * Existing guest or registered user
       * with completed onboarding.
       */
      if (profile) {
        router.replace(
          '/(tabs)' as never
        );

        return;
      }

      /*
       * Firebase user exists, but they
       * haven't completed their hair profile.
       */
      router.replace(
        '/hairProfileSetup' as never
      );
    } catch (error) {
      console.error(
        'Startup auth check failed:',
        error
      );

      /*
       * If something unexpected happens,
       * send the user to login instead of
       * silently creating another account.
       */
      router.replace(
        '/login' as never
      );
    } finally {
      setIsCheckingAuth(
        false
      );
    }
  }

  /*
   * Expo needs something to render while
   * Firebase restores the saved session.
   */
  if (isCheckingAuth) {
    return (
      <View
        style={
          styles.loadingScreen
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

        <ActivityIndicator
          size="small"
          color={
            COLORS.oxfordBlue
          }
        />
      </View>
    );
  }

  return null;
}

const styles =
  StyleSheet.create({
    loadingScreen: {
      flex: 1,

      alignItems:
        'center',

      justifyContent:
        'center',

      gap: 18,

      backgroundColor:
        COLORS.background,
    },

    logo: {
      width: 72,
      height: 72,

      borderRadius:
        24,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        '#FFF9C7',
    },

    logoText: {
      fontSize: 32,

      fontWeight:
        '900',

      color:
        COLORS.brown,
    },
  });