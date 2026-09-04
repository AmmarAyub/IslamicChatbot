// src/screens/ChatList.js
import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getChats, createChat, deleteChat, deleteAllChats } from '../storage/chatStorage';

export default function ChatList({ navigation }) {
  const [chats, setChats] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const hasClearedChats = useRef(false);

  const loadChats = async () => {
    const data = await getChats();
    setChats(data);
  };

  useFocusEffect(
    useCallback(() => {
      const initializeChats = async () => {
        if (!hasClearedChats.current) {
          await deleteAllChats();
          hasClearedChats.current = true;
        }
        await loadChats();
      };

      initializeChats();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadChats();
    setRefreshing(false);
  };

  const handleNewChat = async () => {
    const newChat = await createChat();
    navigation.navigate('ChatRoom', { chatId: newChat.id });
  };

  const handleDeleteChat = (chatId) => {
    Alert.alert('Delete Chat', 'Are you sure you want to delete this chat?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        onPress: async () => {
          await deleteChat(chatId);
          loadChats();
        },
      },
    ]);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => navigation.navigate('ChatRoom', { chatId: item.id })}
      onLongPress={() => handleDeleteChat(item.id)}
    >
      <Text style={styles.chatTitle}>{item.title}</Text>
      <Text style={styles.chatDate}>
        {new Date(item.createdAt).toLocaleDateString()}
      </Text>
      <Text style={styles.chatCount}>
        {item.messages.length} messages
      </Text>
    </TouchableOpacity>
  );

  const chatArray = Object.values(chats).sort((a, b) =>
    new Date(b.createdAt) - new Date(a.createdAt)
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={chatArray}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>No chats yet. Tap + to start one.</Text>
        }
      />
      <TouchableOpacity style={styles.fab} onPress={handleNewChat}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  chatItem: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 12,
    marginVertical: 4,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  chatDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  chatCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  empty: {
    textAlign: 'center',
    marginTop: 40,
    color: '#999',
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#007AFF',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  fabText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
});