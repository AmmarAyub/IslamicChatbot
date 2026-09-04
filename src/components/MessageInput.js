import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';

export default function MessageInput({ onSend }) {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (text.trim()) {
      onSend(text.trim());
      setText('');
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Ask an Islamic question..."
        value={text}
        onChangeText={setText}
        multiline={false}
        returnKeyType="send"
        blurOnSubmit={true}
        onSubmitEditing={handleSend}
      />
      <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
        <Text style={styles.sendText}>Send</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 8,
    borderTopWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    paddingHorizontal: 16,
    backgroundColor: '#007AFF',
    borderRadius: 20,
  },
  sendText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});