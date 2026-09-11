import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Alert,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MessageBubble from '../components/MessageBubble';
import MessageInput from '../components/MessageInput';
import localDb from '../storage/localDb';
import { getCurrentUser } from '../storage/auth';
import aiConfig from '../storage/aiConfig';
import { classifyReligiousContent, getReligiousContentMessage } from '../utils/contentFilter';

const CONVERSATIONS_KEY = '@chatboard_conversations';

export default function Chatboard({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [aiSettings, setAiSettings] = useState({ apiKey: '', model: 'gemini-1.5-flash' });
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        const user = await loadCurrentUser();
        await Promise.all([loadConversations(user), loadAiSettings()]);
      } catch (error) {
        console.error(error);
        Alert.alert('Error', 'Failed to load data.');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const loadAiSettings = async () => {
    try {
      const config = await aiConfig.getAiConfig();
      setAiSettings(config);
    } catch (error) {
      console.error(error);
    }
  };

  const loadCurrentUser = async () => {
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);
      return user;
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  const getConversationKey = (user = currentUser) => (
    `${CONVERSATIONS_KEY}_${encodeURIComponent(user?.username || 'guest')}`
  );

  const saveConversations = async (nextConversations, user = currentUser) => {
    try {
      await AsyncStorage.setItem(getConversationKey(user), JSON.stringify(nextConversations));
    } catch (error) {
      console.error(error);
    }
  };

  const loadConversations = async (user = currentUser) => {
    try {
      const stored = await AsyncStorage.getItem(getConversationKey(user));
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.length > 0) {
          setConversations(parsed);
          setActiveConversationId(parsed[0].id);
          setMessages(parsed[0].messages || []);
          return;
        }
      }

      const defaultConversation = {
        id: `conv-${Date.now()}`,
        title: 'Conversation 1',
        messages: [],
      };
      setConversations([defaultConversation]);
      setActiveConversationId(defaultConversation.id);
      setMessages([]);
      await saveConversations([defaultConversation], user);
    } catch (error) {
      console.error(error);
    }
  };

  const switchConversation = id => {
    const selected = conversations.find(conversation => conversation.id === id);
    if (selected) {
      setActiveConversationId(id);
      setMessages(selected.messages || []);
    }
  };

  const createNewConversation = () => {
    const newConversation = {
      id: `conv-${Date.now()}`,
      title: `Conversation ${conversations.length + 1}`,
      messages: [],
    };
    const updatedConversations = [...conversations, newConversation];
    setConversations(updatedConversations);
    setActiveConversationId(newConversation.id);
    setMessages([]);
    saveConversations(updatedConversations);
  };

  const deleteConversation = async id => {
    await localDb.deleteMessagesForConversation(currentUser?.username, id);
    const remaining = conversations.filter(conversation => conversation.id !== id);
    const nextConversations = remaining.length > 0
      ? remaining
      : [{ id: `conv-${Date.now()}`, title: 'Conversation 1', messages: [] }];
    setConversations(nextConversations);
    setActiveConversationId(nextConversations[0].id);
    setMessages(nextConversations[0].messages || []);
    await saveConversations(nextConversations);
  };

  const updateActiveConversation = async newMessages => {
    const updatedConversations = conversations.map(conversation => (
      conversation.id === activeConversationId
        ? { ...conversation, messages: newMessages }
        : conversation
    ));
    setConversations(updatedConversations);
    setMessages(newMessages);
    await saveConversations(updatedConversations);
  };

  const sendMessage = async text => {
    const trimmedText = text.trim();
    if (!trimmedText) return;

    const classification = classifyReligiousContent(trimmedText);
    if (!classification.isReligious) {
      Alert.alert('Religious questions only', getReligiousContentMessage());
      return;
    }

    const userMessage = {
      id: Date.now().toString(),
      ownerId: currentUser?.username,
      conversationId: activeConversationId,
      role: 'user',
      text: trimmedText,
      category: classification.category,
      timestamp: Date.now(),
    };
    const updatedWithUser = [...messages, userMessage];
    await updateActiveConversation(updatedWithUser);
    await localDb.addMessage(userMessage);

    try {
      const reply = await generateReply(trimmedText, classification.category);
      const botMessage = {
        id: (Date.now() + 1).toString(),
        ownerId: currentUser?.username,
        conversationId: activeConversationId,
        role: 'bot',
        text: reply,
        category: classification.category,
        reviewed: false,
        timestamp: Date.now(),
      };
      await updateActiveConversation([...updatedWithUser, botMessage]);
      await localDb.addMessage(botMessage);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Unable to get a response.');
    }
  };

  const generateReply = async (text, category) => {
    const fiqahContext = currentUser?.fiqah
      ? `The user's stated Fiqah or Madhhab is ${currentUser.fiqah}. Consider this perspective when answering, while respectfully noting recognized differences between schools where relevant.`
      : 'The user has not specified a Fiqah or Madhhab. Give a balanced answer and mention recognized scholarly differences where relevant.';

    if (aiSettings.apiKey) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${aiSettings.model}:generateContent`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': aiSettings.apiKey,
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Answer this Islamic query clearly and respectfully. The category is ${category}. ${fiqahContext}\n\nQuestion:\n${text}`,
              }],
            }],
          }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || 'Gemini failed');
        const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (answer) return answer.trim();
      } catch (error) {
        console.error('Gemini error:', error);
      }
    }

    try {
      const knowledgeBase = await localDb.getKB();
      const query = text.toLowerCase();
      for (const item of knowledgeBase) {
        if (query.includes(item.keyword.toLowerCase())) return item.answer;
      }
      return 'Thank you for your question. Here is a general Islamic perspective: Please consult the Quran and Sunnah. If you need detailed scholarly guidance, flag this response for a scholar review.';
    } catch (error) {
      console.error(error);
      return 'Unable to generate reply. Please try again.';
    }
  };

  const flagForReview = async message => {
    try {
      const queue = await localDb.getReviewQueue();
      if (queue.some(item => item.originalMessageId === message.id)) {
        Alert.alert('Already flagged', 'This message is already in the review queue.');
        return;
      }

      const messageIndex = messages.findIndex(item => item.id === message.id);
      let question = null;
      let answer = null;
      if (message.role === 'bot' && messageIndex > 0 && messages[messageIndex - 1].role === 'user') {
        question = messages[messageIndex - 1];
        answer = message;
      } else if (
        message.role === 'user'
        && messageIndex < messages.length - 1
        && messages[messageIndex + 1].role === 'bot'
      ) {
        question = message;
        answer = messages[messageIndex + 1];
      }

      const reviewItem = {
        id: `review-${Date.now()}-${message.id}`,
        ownerId: currentUser?.username,
        category: message.category || 'Islamic Guidance',
        originalMessageId: message.id,
        flaggedMessage: message,
        questionText: question ? question.text : '',
        answerText: answer ? answer.text : (message.role === 'bot' ? message.text : ''),
        text: message.text,
        role: message.role,
        flaggedAt: Date.now(),
        status: 'pending',
        reviewed: false,
      };

      await localDb.addToReviewQueue(reviewItem);
      Alert.alert('Flagged', 'Message and its pair added to the scholar review queue.');
      navigation.navigate('ScholarReview');
    } catch (error) {
      console.error('[Flag] Error:', error);
      Alert.alert('Error', 'Unable to flag message for review.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#1f3c88" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.contentArea}>
        <View style={styles.sidebar}>
          <TouchableOpacity style={styles.newConversationButton} onPress={createNewConversation}>
            <Text style={styles.newConversationText}>+ New Conversation</Text>
          </TouchableOpacity>
          <FlatList
            data={conversations}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={[styles.sidebarItem, item.id === activeConversationId && styles.sidebarItemActive]}>
                <TouchableOpacity style={styles.conversationButton} onPress={() => switchConversation(item.id)}>
                  <Text style={styles.sidebarItemText} numberOfLines={1}>{item.title}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={`Delete ${item.title}`}
                  style={styles.deleteButton}
                  onPress={() => deleteConversation(item.id)}
                >
                  <Text style={styles.deleteButtonText}>×</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        </View>

        <View style={styles.mainPanel}>
          <FlatList
            data={messages}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <MessageBubble message={item} onFlag={() => flagForReview(item)} />
            )}
            contentContainerStyle={styles.messageList}
          />
          <MessageInput onSend={sendMessage} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12 },
  contentArea: { flex: 1, flexDirection: 'row' },
  sidebar: {
    width: 220,
    backgroundColor: '#f7f9fc',
    borderRightWidth: 1,
    borderRightColor: '#e3e3e3',
    padding: 12,
  },
  newConversationButton: {
    backgroundColor: '#1f3c88',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  newConversationText: { color: '#fff', fontWeight: '600' },
  sidebarItem: {
    alignItems: 'center',
    flexDirection: 'row',
    borderRadius: 8,
    marginBottom: 6,
    paddingLeft: 8,
  },
  sidebarItemActive: { backgroundColor: '#dfe9ff' },
  conversationButton: { flex: 1, paddingVertical: 10 },
  sidebarItemText: { color: '#1a1a1a', fontWeight: '500' },
  deleteButton: { paddingHorizontal: 8, paddingVertical: 6 },
  deleteButtonText: { color: '#b33a3a', fontSize: 20, fontWeight: '700' },
  mainPanel: { flex: 1, backgroundColor: '#f5f5f5' },
  messageList: { padding: 12, flexGrow: 1 },
});
