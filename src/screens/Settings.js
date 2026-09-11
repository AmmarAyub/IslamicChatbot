// src/screens/Settings.js

import React, {
  useState,
  useCallback,
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  Alert,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';

import {
  CommonActions,
  useFocusEffect,
} from '@react-navigation/native';

import {
  getCurrentUser,
  setCurrentUser,
  isAdmin,
} from '../storage/auth';

import { getGeminiApiKey, setGeminiApiKey, getGeminiResponse } from '../storage/aiConfig';


export default function Settings({ navigation }) {

  // =========================================================
  // STATE
  // =========================================================

  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(false);

  const [apiKey, setApiKey] = useState('');
  const [tempKey, setTempKey] = useState('');

  const [status, setStatus] = useState({
    visible: false,
    type: '',
    message: '',
  });

  const [testing, setTesting] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [loading, setLoading] = useState(true);


  // =========================================================
  // SHOW STATUS
  // =========================================================

  const showStatus = useCallback((type, message) => {

    setStatus({
      visible: true,
      type,
      message,
    });

    Alert.alert(
      type === 'success' ? 'Success' : 'Error',
      message
    );

  }, []);

  const closeStatus = useCallback(() => {
    setStatus((prev) => ({
      ...prev,
      visible: false,
    }));
  }, []);


  // =========================================================
  // LOAD USER DATA
  // =========================================================

  const loadData = useCallback(async () => {

    try {

      setLoading(true);

      const currentUser = await getCurrentUser();

      console.log(
        '[Settings] Current user:',
        currentUser
      );


      // -------------------------------------------------------
      // USER NOT LOGGED IN
      // -------------------------------------------------------

      if (!currentUser) {

        console.log(
          '[Settings] No logged-in user found.'
        );

        setUser(null);
        setAdmin(false);

        return;
      }


      // -------------------------------------------------------
      // SET USER
      // -------------------------------------------------------

      setUser(currentUser);


      // -------------------------------------------------------
      // CHECK ADMIN
      // -------------------------------------------------------

      const adminUser = await isAdmin();

      setAdmin(Boolean(adminUser));


      // -------------------------------------------------------
      // LOAD GEMINI API KEY
      // -------------------------------------------------------

      try {

        const key = await getGeminiApiKey();

        if (key) {

          setApiKey('••••••••');
          setTempKey(key);

        } else {

          setApiKey('Not set');
          setTempKey('');

        }

      } catch (apiError) {

        console.error(
          '[Settings] API key loading error:',
          apiError
        );

        setApiKey('Not set');
        setTempKey('');

      }

    } catch (error) {

      console.error(
        '[Settings] Error loading settings:',
        error
      );

      Alert.alert(
        'Error',
        'Unable to load account information.'
      );

    } finally {

      setLoading(false);

    }

  }, []);


  // =========================================================
  // LOAD DATA WHEN SCREEN GETS FOCUS
  // =========================================================

  useFocusEffect(
    useCallback(() => {

      loadData();

    }, [loadData])
  );


  // =========================================================
  // GET ROOT STACK NAVIGATOR
  //
  // Navigation hierarchy:
  //
  // Settings
  //   ↓
  // Bottom Tab Navigator
  //   ↓
  // Main Stack Navigator
  //
  // Therefore:
  //
  // navigation.getParent()          = Tabs
  // navigation.getParent().getParent() = Root Stack
  // =========================================================

  const getRootNavigation = useCallback(() => {

    let navigator = navigation;

    while (
      navigator &&
      navigator.getParent &&
      navigator.getParent()
    ) {

      navigator = navigator.getParent();

    }

    return navigator;

  }, [navigation]);

// =========================================================
// GO TO SIGN IN (UPDATED)
// =========================================================

const goToSignIn = useCallback(() => {
  try {
    // Step 1: Get parent navigator (likely a stack navigator containing 'SignIn')
    const parentNav = navigation.getParent();
    if (parentNav) {
      console.log('[Settings] Parent navigator state:', parentNav.getState());
      // Check if parent has 'SignIn' route
      const parentState = parentNav.getState();
      const hasSignIn = parentState?.routeNames?.includes('SignIn');
      if (hasSignIn) {
        parentNav.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'SignIn' }],
          })
        );
        console.log('[Settings] Navigated to SignIn using parent navigator reset.');
        return true;
      }
    }

    // Step 2: Fallback to root navigator
    const rootNavigation = getRootNavigation();
    if (rootNavigation) {
      console.log('[Settings] Root navigator state:', rootNavigation.getState());
      rootNavigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'SignIn' }],
        })
      );
      console.log('[Settings] Navigated to SignIn using root navigator reset.');
      return true;
    }

    // Step 3: Final fallback using direct navigation
    console.warn('[Settings] Could not reset navigator, using direct navigate.');
    navigation.navigate('SignIn');
    return true;
  } catch (error) {
    console.error('[Settings] Navigation error:', error);
    return false;
  }
}, [navigation, getRootNavigation]);


  // =========================================================
  // LOGOUT
  // =========================================================

// =========================================================
// LOGOUT
// =========================================================

const handleSignOut = useCallback(() => {
  if (loggingOut || testing) return;

  Alert.alert(
    'Logout',
    'Are you sure you want to log out?',
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            setLoggingOut(true);
            console.log('[Logout] Starting logout...');

            // 1. Remove current user from storage
            await setCurrentUser(null);
            console.log('[Logout] Current user removed from storage.');

            // 2. Verify storage
            const userAfterLogout = await getCurrentUser();
            console.log('[Logout] User after logout:', userAfterLogout);

            if (userAfterLogout) {
              throw new Error('Logout failed: current user still exists in storage.');
            }

            // 3. Clear local state
            setUser(null);
            setAdmin(false);
            setApiKey('');
            setTempKey('');
            setStatus({ visible: false, type: '', message: '' });

            // 4. Navigate to SignIn (with fallback)
            const navigationSuccess = goToSignIn();
            if (!navigationSuccess) {
              // Fallback: directly navigate using current navigation object
              console.warn('[Logout] Root navigation failed, trying fallback navigation.');
              navigation.navigate('SignIn');
            }

            console.log('[Logout] Logout completed successfully.');
          } catch (error) {
            console.error('[Logout] Logout error:', error);
            Alert.alert('Logout Failed', error?.message || 'Could not log out. Please try again.');
          } finally {
            setLoggingOut(false);
          }
        },
      },
    ]
  );
}, [loggingOut, testing, goToSignIn, navigation]);


  // =========================================================
  // SAVE GEMINI API KEY
  // =========================================================

  const handleSaveApiKey = async () => {

    const trimmedKey =
      tempKey.trim();


    if (!trimmedKey) {

      showStatus(
        'failure',
        'Please enter a valid Gemini API key.'
      );

      return;

    }


    try {

      await setGeminiApiKey(
        trimmedKey
      );


      const savedKey =
        await getGeminiApiKey();


      if (
        savedKey &&
        savedKey === trimmedKey
      ) {

        setApiKey('••••••••');
        setTempKey(trimmedKey);

        showStatus(
          'success',
          'Gemini API key saved successfully.'
        );

      } else {

        showStatus(
          'failure',
          'Gemini API key could not be saved.'
        );

      }

    } catch (error) {

      console.error(
        '[Settings] Save API key error:',
        error
      );

      showStatus(
        'failure',
        error?.message ||
        'Gemini API key could not be saved.'
      );

    }

  };


  // =========================================================
  // TEST GEMINI API
  // =========================================================

  const handleTestApi = async () => {

    const trimmedKey =
      tempKey.trim();


    if (!trimmedKey) {

      showStatus(
        'failure',
        'Please enter a Gemini API key before testing.'
      );

      return;

    }


    try {

      setTesting(true);

      setStatus({
        visible: false,
        type: '',
        message: '',
      });


      // Save key first
      await setGeminiApiKey(
        trimmedKey
      );


      setApiKey('••••••••');
      setTempKey(trimmedKey);


      // Test API
      const response =
        await getGeminiResponse(
          'What is the meaning of Islam?'
        );


      const message =
        response
          ? response.substring(0, 100)
          : 'AI responded successfully.';


      showStatus(
        'success',
        `AI responded: ${message}...`
      );


    } catch (error) {

      console.error(
        '[Settings] Gemini API test error:',
        error
      );

      showStatus(
        'failure',
        error?.message ||
        'API test failed.'
      );

    } finally {

      setTesting(false);

    }

  };


  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {

    return (
      <View style={styles.centered}>

        <ActivityIndicator
          size="large"
          color="#007AFF"
        />

        <Text style={styles.loadingText}>
          Loading...
        </Text>

      </View>
    );

  }


  // =========================================================
  // NO USER
  // =========================================================

  if (!user) {

    return (
      <View style={styles.centered}>

        <ActivityIndicator
          size="large"
          color="#007AFF"
        />

        <Text style={styles.loadingText}>
          Redirecting to Sign In...
        </Text>

      </View>
    );

  }


  // =========================================================
  // UI
  // =========================================================

  return (

    <View style={styles.container}>

      <Modal
        transparent
        visible={status.visible}
        animationType="fade"
        onRequestClose={closeStatus}
      >
        <View style={styles.modalOverlay}>
          <View style={[
            styles.modalCard,
            status.type === 'success' ? styles.modalSuccess : styles.modalFailure,
          ]}>
            <Text style={styles.modalTitle}>
              {status.type === 'success' ? 'Success' : 'Error'}
            </Text>

            <Text style={styles.modalMessage}>
              {status.message}
            </Text>

            <TouchableOpacity
              style={[
                styles.modalButton,
                status.type === 'success' ? styles.modalButtonSuccess : styles.modalButtonFailure,
              ]}
              onPress={closeStatus}
              activeOpacity={0.8}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ================================================== */}

      <Text style={styles.title}>
        Settings
      </Text>


      {/* ================================================== */}
      {/* USER INFORMATION */}
      {/* ================================================== */}

      <View style={styles.info}>

        <Text style={styles.infoText}>
          Username: {user.username}
        </Text>

        <Text style={styles.infoText}>
          Role: {user.role}
        </Text>

      </View>


      {/* ================================================== */}
      {/* GEMINI API CONFIGURATION */}
      {/* ================================================== */}

      <View style={styles.section}>

        <Text style={styles.sectionTitle}>
          Gemini AI Configuration
        </Text>


        <Text style={styles.currentKey}>
          Current Key: {apiKey}
        </Text>


        <TextInput
          style={styles.input}
          placeholder="Enter your Gemini API key"
          placeholderTextColor="#888"
          value={tempKey}
          onChangeText={setTempKey}
          secureTextEntry={true}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loggingOut}
        />


        {/* ================================================= */}
        {/* STATUS */}
        {/* ================================================= */}

        {status.visible && (

          <View
            style={[
              styles.statusBox,

              status.type === 'success'
                ? styles.statusSuccess
                : styles.statusFailure,
            ]}
          >

            <Text style={styles.statusText}>
              {status.message}
            </Text>

          </View>

        )}


        {/* ================================================= */}
        {/* API BUTTONS */}
        {/* ================================================= */}

        <View style={styles.buttonRow}>

          <TouchableOpacity
            style={[
              styles.button,
              loggingOut && styles.disabledButton,
            ]}
            onPress={handleSaveApiKey}
            disabled={testing || loggingOut}
            activeOpacity={0.7}
          >

            <Text style={styles.buttonText}>
              Save Key
            </Text>

          </TouchableOpacity>


          <TouchableOpacity
            style={[
              styles.button,
              styles.testButton,
              loggingOut && styles.disabledButton,
            ]}
            onPress={handleTestApi}
            disabled={testing || loggingOut}
            activeOpacity={0.7}
          >

            {testing ? (

              <ActivityIndicator
                color="#fff"
                size="small"
              />

            ) : (

              <Text style={styles.buttonText}>
                Test API
              </Text>

            )}

          </TouchableOpacity>

        </View>

      </View>


      {/* ================================================== */}
      {/* ADMIN MANAGEMENT */}
      {/* ================================================== */}

      {admin && (

        <TouchableOpacity
          style={[
            styles.smallButton,
            loggingOut && styles.disabledButton,
          ]}
          onPress={() =>
            navigation.navigate(
              'AccountsManagement'
            )
          }
          disabled={loggingOut}
          activeOpacity={0.7}
        >

          <Text style={styles.smallButtonText}>
            Manage Accounts
          </Text>

        </TouchableOpacity>

      )}


    </View>

  );

}


// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({

  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },


  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },


  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#555',
  },


  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#111',
  },


  info: {
    marginBottom: 30,
    padding: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },


  infoText: {
    fontSize: 16,
    marginBottom: 6,
    color: '#222',
  },


  section: {
    marginBottom: 30,
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },


  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#111',
  },


  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },


  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 14,
    padding: 22,
    backgroundColor: '#fff',
    borderWidth: 1,
  },


  modalSuccess: {
    borderColor: '#2e7d32',
  },


  modalFailure: {
    borderColor: '#d32f2f',
  },


  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#111',
  },


  modalMessage: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    marginBottom: 18,
  },


  modalButton: {
    alignSelf: 'flex-end',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },


  modalButtonSuccess: {
    backgroundColor: '#2e7d32',
  },


  modalButtonFailure: {
    backgroundColor: '#d32f2f',
  },


  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },


  currentKey: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
  },


  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    fontSize: 16,
    color: '#222',
    backgroundColor: '#fff',
  },


  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },


  button: {
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 8,
    marginVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: 4,
    minHeight: 48,
  },


  testButton: {
    backgroundColor: '#34C759',
  },


  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },


  statusBox: {
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
  },


  statusSuccess: {
    backgroundColor: '#eafaf1',
    borderColor: '#2ecc71',
  },


  statusFailure: {
    backgroundColor: '#fdecea',
    borderColor: '#e74c3c',
  },


  statusText: {
    color: '#222',
    fontSize: 13,
    fontWeight: '600',
  },


  smallButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 6,
    alignSelf: 'center',
    marginVertical: 6,
    minWidth: 180,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
  },


  dangerButton: {
    backgroundColor: '#FF3B30',
  },


  smallButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },


  disabledButton: {
    opacity: 0.55,
  },


  logoutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },


  logoutText: {
    marginLeft: 8,
  },

});