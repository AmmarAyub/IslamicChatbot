import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { authenticateUser, setCurrentUser, ensureAdminExists } from '../storage/auth';

export default function SignIn({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    ensureAdminExists(); // create admin if no users exist
  }, []);

  const handleSignIn = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    const user = await authenticateUser(username, password);
    if (user) {
      await setCurrentUser(user);
      navigation.replace('Main');
    } else {
      Alert.alert('Error', 'Invalid username or password');
    }
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
          <Text style={styles.title}>Welcome To Chatboard</Text>
          <Text style={styles.subtitle}>Sign in to continue to Islamic Chatboard</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your username"
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
              placeholder="Enter your password"
              placeholderTextColor="#8a9b94"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            accessibilityRole="button"
            style={styles.signInButton}
            onPress={handleSignIn}
          >
            <Text style={styles.signInText}>Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signUpButton}
            onPress={() => navigation.navigate('SignUp')}
          >
            <Text style={styles.prompt}>Don't have an account? </Text>
            <Text style={styles.link}>Sign Up</Text>
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
  signInButton: {
    alignItems: 'center',
    backgroundColor: '#0f6b52',
    borderRadius: 8,
    marginTop: 8,
    paddingVertical: 14,
  },
  signInText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  signUpButton: {
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