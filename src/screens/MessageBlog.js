import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import localDb from '../storage/localDb';
import { getCurrentUser } from '../storage/auth';

const formatDate = (timestamp) => (
  timestamp ? new Date(timestamp).toLocaleDateString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric',
  }) : 'Recently'
);

const makeTitle = (text) => {
  const cleanedText = (text || 'Islamic guidance').trim();
  return cleanedText.length > 72 ? `${cleanedText.slice(0, 72).trim()}…` : cleanedText;
};

export default function MessageBlog() {
  const [messages, setMessages] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMessages = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      const items = await localDb.getMessages(currentUser?.username);
      const sortedItems = items.slice().sort((first, second) => (
        (first.timestamp || 0) - (second.timestamp || 0)
      ));

      setMessages(sortedItems);
      setSelectedIndex((current) => {
        if (!sortedItems.length) return null;
        return current !== null && current < sortedItems.length ? current : sortedItems.length - 1;
      });
    } catch (error) {
      console.error('[MessageBlog] Error loading messages:', error);
      setMessages([]);
      setSelectedIndex(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMessages();
    }, [loadMessages])
  );

  const articles = useMemo(() => messages
    .map((message, index) => {
      if (message.role !== 'user') return null;

      const response = messages.slice(index + 1).find(candidate => (
        candidate.role === 'bot' && candidate.conversationId === message.conversationId
      ));

      return { message, response, index };
    })
    .filter(Boolean)
    .reverse(), [messages]);

  const selectedArticle = articles.find(article => article.index === selectedIndex) || articles[0];

  const refresh = () => {
    setRefreshing(true);
    loadMessages();
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#0f6b52" />
        <Text style={styles.loadingText}>Preparing your message library...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
    >
      <View style={styles.hero}>
        <Text style={styles.heroEyebrow}>MESSAGE LIBRARY</Text>
        <Text style={styles.heroTitle}>Read your questions as articles</Text>
        <Text style={styles.heroText}>
          Select a question below to turn its conversation into an easy-to-read guidance article.
        </Text>
      </View>

      {articles.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No questions to display yet</Text>
          <Text style={styles.emptyText}>
            Ask a question in Chat and it will appear here as a readable article.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Your messages</Text>
            <Text style={styles.messageCount}>{articles.length} saved</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.messageList}
          >
            {articles.map(article => {
              const isSelected = selectedArticle?.index === article.index;
              return (
                <TouchableOpacity
                  key={article.message.id || article.index}
                  style={[styles.messageCard, isSelected && styles.messageCardSelected]}
                  onPress={() => setSelectedIndex(article.index)}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`Read message: ${makeTitle(article.message.text)}`}
                >
                  <Text style={[styles.messageCardCategory, isSelected && styles.messageCardCategorySelected]}>
                    {article.message.category || 'Islamic Guidance'}
                  </Text>
                  <Text style={[styles.messageCardText, isSelected && styles.messageCardTextSelected]} numberOfLines={3}>
                    {makeTitle(article.message.text)}
                  </Text>
                  <Text style={[styles.messageCardDate, isSelected && styles.messageCardDateSelected]}>
                    {formatDate(article.message.timestamp)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {selectedArticle ? (
            <View style={styles.article}>
              <View style={styles.articleTopLine} />
              <Text style={styles.articleCategory}>
                {selectedArticle.message.category || 'Islamic Guidance'}
              </Text>
              <Text style={styles.articleTitle}>{makeTitle(selectedArticle.message.text)}</Text>
              <Text style={styles.articleDate}>
                Asked on {formatDate(selectedArticle.message.timestamp)}
              </Text>

              <View style={styles.questionBox}>
                <Text style={styles.boxLabel}>YOUR QUESTION</Text>
                <Text style={styles.questionText}>{selectedArticle.message.text}</Text>
              </View>

              <View style={styles.answerSection}>
                <Text style={styles.answerHeading}>Guidance</Text>
                <Text style={styles.answerText}>
                  {selectedArticle.response?.text || 'A response for this question is not available yet.'}
                </Text>
              </View>

              <View style={styles.articleFooter}>
                <Text style={styles.articleFooterText}>Islamic Questions Chatbot</Text>
              </View>
            </View>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f8f5' },
  content: { padding: 16, paddingBottom: 30 },
  centered: { alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#53665e', marginTop: 10 },
  hero: { backgroundColor: '#0f6b52', borderRadius: 16, padding: 22 },
  heroEyebrow: { color: '#d5b45b', fontSize: 11, fontWeight: '700', letterSpacing: 1.1 },
  heroTitle: { color: '#fff', fontSize: 25, fontWeight: '700', lineHeight: 32, marginTop: 7 },
  heroText: { color: '#dceee5', fontSize: 14, lineHeight: 21, marginTop: 9 },
  emptyCard: { backgroundColor: '#fff', borderColor: '#dce8e1', borderRadius: 14, borderWidth: 1, marginTop: 16, padding: 24 },
  emptyTitle: { color: '#153b32', fontSize: 18, fontWeight: '700', textAlign: 'center' },
  emptyText: { color: '#71827a', fontSize: 14, lineHeight: 21, marginTop: 7, textAlign: 'center' },
  listHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 22, marginBottom: 10 },
  listTitle: { color: '#153b32', fontSize: 18, fontWeight: '700' },
  messageCount: { color: '#71827a', fontSize: 12, fontWeight: '600' },
  messageList: { paddingRight: 16 },
  messageCard: { backgroundColor: '#fff', borderColor: '#dce8e1', borderRadius: 12, borderWidth: 1, marginRight: 10, padding: 14, width: 220 },
  messageCardSelected: { backgroundColor: '#0f6b52', borderColor: '#0f6b52' },
  messageCardCategory: { color: '#0f6b52', fontSize: 11, fontWeight: '700' },
  messageCardCategorySelected: { color: '#d5b45b' },
  messageCardText: { color: '#153b32', fontSize: 14, fontWeight: '600', lineHeight: 20, marginTop: 7 },
  messageCardTextSelected: { color: '#fff' },
  messageCardDate: { color: '#8a9b94', fontSize: 11, marginTop: 12 },
  messageCardDateSelected: { color: '#dceee5' },
  article: { backgroundColor: '#fff', borderColor: '#dce8e1', borderRadius: 14, borderWidth: 1, marginTop: 20, overflow: 'hidden', padding: 22 },
  articleTopLine: { backgroundColor: '#d5b45b', height: 4, marginBottom: 18, width: 48 },
  articleCategory: { color: '#0f6b52', fontSize: 12, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  articleTitle: { color: '#153b32', fontSize: 25, fontWeight: '700', lineHeight: 34, marginTop: 8 },
  articleDate: { color: '#8a9b94', fontSize: 12, marginTop: 9 },
  questionBox: { backgroundColor: '#f2f7f3', borderLeftColor: '#d5b45b', borderLeftWidth: 4, marginTop: 22, padding: 15 },
  boxLabel: { color: '#71827a', fontSize: 11, fontWeight: '700', letterSpacing: 0.6 },
  questionText: { color: '#153b32', fontSize: 16, lineHeight: 24, marginTop: 6 },
  answerSection: { marginTop: 22 },
  answerHeading: { color: '#153b32', fontSize: 19, fontWeight: '700', marginBottom: 8 },
  answerText: { color: '#334d43', fontSize: 16, lineHeight: 26 },
  articleFooter: { borderTopColor: '#e7eee9', borderTopWidth: 1, marginTop: 24, paddingTop: 14 },
  articleFooterText: { color: '#8a9b94', fontSize: 12, fontWeight: '600' },
});
