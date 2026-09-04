import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity } from 'react-native';
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
    <View style={styles.container}>
      <Text style={styles.title}>ISLAMIC CHATBOARD</Text>
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title="Sign In" onPress={handleSignIn} />
      <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
        <Text style={styles.link}>Don't have an account? Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  link: {
    marginTop: 20,
    color: '#007AFF',
    textAlign: 'center',
  },
});