import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { createUser } from '../storage/auth';

const FIQAH_OPTIONS = [
  'Hanafi',
  "Shafi'i",
  'Maliki',
  'Hanbali',
  "Ja'fari (Twelver Shia)",
  'Zaidi',
  'Ismaili',
  'Ibadi',
  'Other',
  'Prefer not to say',
];

export default function SignUp({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [fiqah, setFiqah] = useState('');
  const [fiqahPickerVisible, setFiqahPickerVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleSignUp = async () => {
    const normalizedUsername = username.trim();
    const normalizedFiqah = fiqah.trim();

    if (!normalizedUsername || !password || !confirm || !normalizedFiqah) {
      showFailure('Please complete all fields.');
      return;
    }
    if (password !== confirm) {
      showFailure('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      showFailure('Password must be at least 6 characters.');
      return;
    }
    try {
      setSubmitting(true);
      await createUser(normalizedUsername, password, 'user', normalizedFiqah);
      const successMessage = 'Your account has been created. Please sign in to continue.';
      setFeedback({ type: 'success', message: successMessage });
      Alert.alert(
        'Registration Successful',
        successMessage,
        [{ text: 'Continue', onPress: () => navigation.goBack() }]
      );
      if (Platform.OS === 'web') {
        setTimeout(() => navigation.goBack(), 1500);
      }
    } catch (error) {
      showFailure(error?.message || 'Unable to create your account. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const showFailure = message => {
    setFeedback({ type: 'error', message });
    Alert.alert('Registration Failed', message);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <View style={styles.brandMark}>
            <Text style={styles.brandMarkText}>?</Text>
          </View>
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>
            Join the Islamic Chatboard community
          </Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              placeholder="Choose a username"
              placeholderTextColor="#8a9b94"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Create a password"
              placeholderTextColor="#8a9b94"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Re-enter your password"
              placeholderTextColor="#8a9b94"
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Fiqah / Madhhab</Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Select your Fiqah or Madhhab"
              style={styles.dropdown}
              onPress={() => setFiqahPickerVisible(true)}
            >
              <Text style={fiqah ? styles.dropdownValue : styles.dropdownPlaceholder}>
                {fiqah || 'Select your Fiqah or Madhhab'}
              </Text>
              <Text style={styles.dropdownArrow}>⌄</Text>
            </TouchableOpacity>
            <Text style={styles.helperText}>
              This helps us consider your preferred Fiqah perspective when answering questions.
            </Text>
          </View>

          <Modal
            visible={fiqahPickerVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setFiqahPickerVisible(false)}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setFiqahPickerVisible(false)}
            >
              <View style={styles.dropdownMenu}>
                <Text style={styles.menuTitle}>Select your Fiqah / Madhhab</Text>
                {FIQAH_OPTIONS.map(option => (
                  <TouchableOpacity
                    key={option}
                    style={[styles.option, option === fiqah && styles.selectedOption]}
                    onPress={() => {
                      setFiqah(option);
                      setFiqahPickerVisible(false);
                    }}
                  >
                    <Text style={option === fiqah ? styles.selectedOptionText : styles.optionText}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>
          </Modal>

          {feedback ? (
            <View style={[styles.feedback, feedback.type === 'success' ? styles.successFeedback : styles.errorFeedback]}>
              <Text style={styles.feedbackTitle}>
                {feedback.type === 'success' ? 'Registration Successful' : 'Registration Failed'}
              </Text>
              <Text style={styles.feedbackText}>{feedback.message}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityState={{ disabled: submitting }}
            style={[styles.signUpButton, submitting && styles.signUpButtonDisabled]}
            onPress={handleSignUp}
            disabled={submitting}
          >
            <Text style={styles.signUpText}>
              {submitting ? 'Creating Account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.signInButton} onPress={() => navigation.goBack()}>
            <Text style={styles.prompt}>Already have an account? </Text>
            <Text style={styles.link}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#edf4f0',
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#fff',
    borderColor: '#dce8e1',
    borderRadius: 16,
    borderWidth: 1,
    padding: 28,
    shadowColor: '#153b32',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
    alignItems: 'stretch',
  },
  brandMark: {
    alignSelf: 'center',
    alignItems: 'center',
    backgroundColor: '#0f6b52',
    borderColor: '#d5b45b',
    borderRadius: 28,
    borderWidth: 2,
    height: 56,
    justifyContent: 'center',
    marginBottom: 18,
    width: 56,
  },
  brandMarkText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
  },
  title: {
    color: '#153b32',
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: '#6b7d75',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 28,
    marginTop: 8,
    textAlign: 'center',
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    color: '#294c40',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 7,
  },
  input: {
    backgroundColor: '#f8fbf9',
    borderWidth: 1,
    borderColor: '#cddcd4',
    borderRadius: 8,
    color: '#153b32',
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
  },
  dropdown: {
    alignItems: 'center',
    backgroundColor: '#f8fbf9',
    borderColor: '#cddcd4',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 50,
    paddingHorizontal: 14,
  },
  dropdownPlaceholder: {
    color: '#8a9b94',
    fontSize: 16,
  },
  dropdownValue: {
    color: '#153b32',
    fontSize: 16,
  },
  dropdownArrow: {
    color: '#0f6b52',
    fontSize: 22,
    fontWeight: '700',
    marginLeft: 8,
  },
  helperText: {
    color: '#71827a',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 6,
  },
  feedback: {
    borderRadius: 8,
    marginBottom: 16,
    padding: 12,
  },
  successFeedback: {
    backgroundColor: '#e5f4eb',
    borderColor: '#9bc9aa',
    borderWidth: 1,
  },
  errorFeedback: {
    backgroundColor: '#fff0ef',
    borderColor: '#e1aaa5',
    borderWidth: 1,
  },
  feedbackTitle: {
    color: '#153b32',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 3,
  },
  feedbackText: {
    color: '#53665e',
    fontSize: 13,
    lineHeight: 18,
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(21, 59, 50, 0.45)',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  dropdownMenu: {
    backgroundColor: '#fff',
    borderRadius: 14,
    maxWidth: 440,
    padding: 12,
    width: '100%',
  },
  menuTitle: {
    color: '#153b32',
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  option: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  selectedOption: {
    backgroundColor: '#e5f1eb',
  },
  optionText: {
    color: '#294c40',
    fontSize: 15,
  },
  selectedOptionText: {
    color: '#0f6b52',
    fontSize: 15,
    fontWeight: '700',
  },
  signUpButton: {
    alignItems: 'center',
    backgroundColor: '#0f6b52',
    borderRadius: 8,
    marginTop: 4,
    paddingVertical: 14,
  },
  signUpButtonDisabled: {
    backgroundColor: '#83aa9b',
  },
  signUpText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  signInButton: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 22,
  },
  prompt: {
    color: '#6b7d75',
    fontSize: 13,
  },
  link: {
    color: '#0f6b52',
    fontSize: 13,
    fontWeight: '700',
  },
});