import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Alert,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MessageBubble from '../components/MessageBubble';
import MessageInput from '../components/MessageInput';
import localDb from '../storage/localDb';
import { getCurrentUser } from '../storage/auth';
import aiConfig from '../storage/aiConfig';
import { classifyReligiousContent, getReligiousContentMessage } from '../utils/contentFilter';

const CONVERSATIONS_KEY = '@chatboard_conversations';

const QUICK_TOPICS = [
  { id: 'quran', label: 'Quran', icon: '▣', category: 'Quran', questions: ['Explain the meaning of Ayatul Kursi (2:255).', 'What are the main themes of Surah Ar-Rahman?', 'Explain Surah Al-Fatiha verse by verse.', 'What is the significance of Surah Yasin?'] },
  { id: 'fiqh', label: 'Fiqh', icon: '⚖', category: 'Fiqah and Worship', questions: ['What are the essential steps of Wudu?', 'How do I perform Salah correctly?', 'What breaks the fast in Ramadan?', 'How is Zakat calculated?'] },
  { id: 'dua', label: 'Dua', icon: '🤲', category: 'Dua', questions: ['What is the best way to make Dua?', 'Which Dua can I recite for forgiveness?', 'What Dua should I make when feeling anxious?', 'When are the best times for Dua to be accepted?'] },
  { id: 'seerah', label: 'Seerah', icon: '⌂', category: 'Seerah', questions: ['What are the key lessons from the Hijrah?', 'How did the Prophet Muhammad (peace be upon him) show mercy?', 'What happened at the Treaty of Hudaybiyyah?', 'What can we learn from the Prophet’s character?'] },
  { id: 'hadith', label: 'Hadith', icon: '▤', category: 'Hadith and Sunnah', questions: ['What is the difference between Hadith and Sunnah?', 'How are Hadith authenticated?', 'Share a Hadith about kindness and explain it.', 'Why are Hadith important for Muslims?'] },
];

export default function Chatboard({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [activeTopic, setActiveTopic] = useState(null);
  const [openTopic, setOpenTopic] = useState(null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const user = await loadCurrentUser();
        await loadConversations(user);
      } catch (error) {
        console.error(error);
        Alert.alert('Error', 'Failed to load data.');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

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

  const updateActiveConversation = async (newMessages, interactionId) => {
    const updatedConversations = conversations.map(conversation => (
      conversation.id === activeConversationId
        ? {
          ...conversation,
          messages: newMessages,
          ...(interactionId ? { geminiInteractionId: interactionId } : {}),
        }
        : conversation
    ));
    setConversations(updatedConversations);
    setMessages(newMessages);
    await saveConversations(updatedConversations);
  };

  const sendMessage = async (text, topic = activeTopic) => {
    const trimmedText = text.trim();
    if (!trimmedText || isSending) return;

    const classification = classifyReligiousContent(trimmedText);
    if (!classification.isReligious && !topic) {
      Alert.alert('Religious questions only', getReligiousContentMessage());
      return;
    }

    const category = topic?.category || classification.category;
    setIsSending(true);

    const userMessage = {
      id: Date.now().toString(),
      ownerId: currentUser?.username,
      conversationId: activeConversationId,
      role: 'user',
      text: trimmedText,
      category,
      timestamp: Date.now(),
    };
    const updatedWithUser = [...messages, userMessage];
    await updateActiveConversation(updatedWithUser);
    await localDb.addMessage(userMessage);

    try {
      const reply = await generateReply(trimmedText, category);
      const botMessage = {
        id: (Date.now() + 1).toString(),
        ownerId: currentUser?.username,
        conversationId: activeConversationId,
        role: 'bot',
        text: reply.text,
        category,
        reviewed: false,
        timestamp: Date.now(),
      };
      await updateActiveConversation(
        [...updatedWithUser, botMessage],
        reply.interactionId
      );
      await localDb.addMessage(botMessage);
    } catch (error) {
      console.error(error);
      Alert.alert(
        'AI response unavailable',
        `${error?.message || 'Unable to get a response.'}\n\nOpen Settings and use “Test API” to verify your Gemini API key.`
      );
    } finally {
      setIsSending(false);
    }
  };

  const openTopicQuestions = topic => {
    setActiveTopic(topic);
    setOpenTopic(current => current?.id === topic.id ? null : topic);
  };

  const sendSuggestedQuestion = (topic, question) => {
    setActiveTopic(topic);
    setOpenTopic(null);
    sendMessage(question, topic);
  };

  const generateReply = async (text, category) => {
    const fiqahContext = currentUser?.fiqah
      ? `The user's stated Fiqah or Madhhab is ${currentUser.fiqah}. Consider this perspective when answering, while respectfully noting recognized differences between schools where relevant.`
      : 'The user has not specified a Fiqah or Madhhab. Give a balanced answer and mention recognized scholarly differences where relevant.';

    const activeConversation = conversations.find(
      conversation => conversation.id === activeConversationId
    );
    return aiConfig.createGeminiInteraction(
      `Answer this Islamic query clearly, accurately, and respectfully. The category is ${category}. ${fiqahContext}\n\nQuestion:\n${text}`,
      activeConversation?.geminiInteractionId
    );
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
          <View style={styles.topicArea}>
            <Text style={styles.topicPrompt}>Explore an Islamic topic</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topicList}>
              {QUICK_TOPICS.map(topic => {
                const isSelected = activeTopic?.id === topic.id;
                return (
                  <TouchableOpacity
                    key={topic.id}
                    style={[styles.topicButton, isSelected && styles.topicButtonSelected]}
                    onPress={() => openTopicQuestions(topic)}
                    disabled={isSending}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected, disabled: isSending }}
                    accessibilityLabel={`Show ${topic.label} questions`}
                  >
                    <Text style={styles.topicIcon}>{topic.icon}</Text>
                    <Text style={[styles.topicText, isSelected && styles.topicTextSelected]}>{topic.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            {openTopic ? (
              <View style={styles.questionDropdown}>
                <View style={styles.dropdownHeader}>
                  <View style={styles.dropdownTitleRow}>
                    <Text style={styles.dropdownIcon}>{openTopic.icon}</Text>
                    <Text style={styles.dropdownTitle}>{openTopic.label}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setOpenTopic(null)} accessibilityRole="button" accessibilityLabel="Close suggested questions">
                    <Text style={styles.dropdownCloseText}>×</Text>
                  </TouchableOpacity>
                </View>
                {openTopic.questions.map(question => (
                  <TouchableOpacity
                    key={question}
                    style={styles.suggestedQuestion}
                    onPress={() => sendSuggestedQuestion(openTopic, question)}
                    disabled={isSending}
                    accessibilityRole="button"
                    accessibilityLabel={`Ask: ${question}`}
                  >
                    <Text style={styles.suggestedQuestionText}>{question}</Text>
                    <Text style={styles.questionArrow}>›</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
          </View>
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
  topicArea: { backgroundColor: '#fff', borderTopColor: '#e1e7e3', borderTopWidth: 1, paddingTop: 9 },
  topicPrompt: { color: '#53665e', fontSize: 12, fontWeight: '600', paddingHorizontal: 12, marginBottom: 7 },
  topicList: { paddingHorizontal: 12, paddingBottom: 9 },
  topicButton: { alignItems: 'center', backgroundColor: '#f4f6f5', borderColor: '#d9e2dc', borderRadius: 18, borderWidth: 1, flexDirection: 'row', marginRight: 8, paddingHorizontal: 12, paddingVertical: 8 },
  topicButtonSelected: { backgroundColor: '#0f6b52', borderColor: '#0f6b52' },
  topicIcon: { fontSize: 14, marginRight: 6 },
  topicText: { color: '#334d43', fontSize: 13, fontWeight: '700' },
  topicTextSelected: { color: '#fff' },
  questionDropdown: { backgroundColor: '#fff', borderColor: '#ccd8d1', borderRadius: 12, borderWidth: 1, marginHorizontal: 12, marginBottom: 10, overflow: 'hidden' },
  dropdownHeader: { alignItems: 'center', borderBottomColor: '#e7eee9', borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 11 },
  dropdownTitleRow: { alignItems: 'center', flexDirection: 'row' },
  dropdownIcon: { fontSize: 14, marginRight: 8 },
  dropdownTitle: { color: '#153b32', fontSize: 14, fontWeight: '700' },
  dropdownCloseText: { color: '#71827a', fontSize: 22, lineHeight: 22 },
  suggestedQuestion: { alignItems: 'center', borderBottomColor: '#edf2ee', borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 13 },
  suggestedQuestionText: { color: '#334d43', flex: 1, fontSize: 14, fontWeight: '500', lineHeight: 20, paddingRight: 12 },
  questionArrow: { color: '#0f6b52', fontSize: 24, lineHeight: 20 },
});
