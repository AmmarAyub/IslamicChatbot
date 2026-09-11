import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import localDb from '../storage/localDb';
import { getCurrentUser } from '../storage/auth';

export default function ApprovedContent() {
  const [reviewItems, setReviewItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadApprovedContent = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser?.username) {
        setReviewItems([]);
        return;
      }

      const queue = await localDb.getReviewQueue(currentUser.username);
      setReviewItems(
        queue
          .sort((first, second) => (second.reviewedAt || 0) - (first.reviewedAt || 0))
      );
    } catch (error) {
      console.error('[ApprovedContent] Error loading approved content:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadApprovedContent();
    }, [loadApprovedContent])
  );

  const refresh = () => {
    setRefreshing(true);
    loadApprovedContent();
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#0f6b52" />
        <Text style={styles.loadingText}>Loading your review history...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
    >
      <View style={styles.pageIntro}>
        <Text style={styles.title}>My Review History</Text>
        <Text style={styles.subtitle}>
          Track your flagged questions and see their approval status and scholar guidance.
        </Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{reviewItems.length} total reviews</Text>
        </View>
      </View>

      {reviewItems.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No flagged content yet</Text>
          <Text style={styles.emptyText}>
            Your pending, approved, and rejected questions will appear here.
          </Text>
        </View>
      ) : (
        ['pending', 'approved', 'rejected'].map(status => {
          const items = reviewItems.filter(item => {
            const itemStatus = item.status || (item.approved ? 'approved' : 'pending');
            return itemStatus === status;
          });
          if (!items.length) return null;

          const sectionLabels = {
            pending: 'Awaiting Scholar Review',
            approved: 'Approved Guidance',
            rejected: 'Needs Revision',
          };

          return (
            <View key={status} style={styles.sectionBox}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{sectionLabels[status]}</Text>
                <Text style={[styles.sectionCount, styles[`${status}Text`]]}>{items.length}</Text>
              </View>
              {items.map(item => (
                <View key={item.id} style={[styles.answerCard, styles[`${status}Card`]]}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.category}>{item.category || 'Islamic Guidance'}</Text>
                    <Text style={[styles.statusLabel, styles[`${status}Text`]]}>{status.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.sectionLabel}>Your Question</Text>
                  <Text style={styles.questionText}>{item.questionText || item.text || 'Question unavailable'}</Text>
                  <View style={styles.divider} />
                  <Text style={styles.sectionLabel}>{status === 'approved' ? 'Scholar Guidance' : 'Current Response'}</Text>
                  <Text style={styles.answerText}>{item.answerText || 'No response available yet.'}</Text>
                  {item.scholarComment ? (
                    <View style={styles.noteBox}>
                      <Text style={styles.noteLabel}>Scholar note</Text>
                      <Text style={styles.noteText}>{item.scholarComment}</Text>
                    </View>
                  ) : null}
                  <Text style={styles.dateText}>
                    {status === 'pending' ? 'Submitted' : status === 'approved' ? 'Approved' : 'Reviewed'}{' '}
                    {item.reviewedAt || item.flaggedAt ? new Date(item.reviewedAt || item.flaggedAt).toLocaleString() : 'recently'}
                  </Text>
                </View>
              ))}
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f8f5' },
  content: { padding: 16, paddingBottom: 28 },
  centered: { alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#53665e', marginTop: 10 },
  pageIntro: {
    backgroundColor: '#0f6b52',
    borderRadius: 14,
    marginBottom: 14,
    padding: 20,
  },
  title: { color: '#fff', fontSize: 24, fontWeight: '700' },
  subtitle: { color: '#dceee5', fontSize: 14, lineHeight: 20, marginTop: 7 },
  countBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#d5b45b',
    borderRadius: 14,
    marginTop: 14,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  countText: { color: '#153b32', fontSize: 12, fontWeight: '700' },
  emptyCard: {
    backgroundColor: '#fff',
    borderColor: '#dce8e1',
    borderRadius: 12,
    borderWidth: 1,
    padding: 22,
  },
  emptyTitle: { color: '#153b32', fontSize: 17, fontWeight: '700', textAlign: 'center' },
  emptyText: { color: '#71827a', fontSize: 14, lineHeight: 21, marginTop: 7, textAlign: 'center' },
  sectionBox: { marginBottom: 4 },
  sectionHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  sectionTitle: { color: '#153b32', fontSize: 16, fontWeight: '700' },
  sectionCount: { fontSize: 13, fontWeight: '700' },
  answerCard: {
    backgroundColor: '#fff',
    borderColor: '#dce8e1',
    borderLeftColor: '#0f6b52',
    borderLeftWidth: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    padding: 16,
  },
  pendingCard: { borderLeftColor: '#d5a128' },
  approvedCard: { borderLeftColor: '#2e7d32' },
  rejectedCard: { borderLeftColor: '#c62828' },
  cardHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  category: { color: '#0f6b52', fontSize: 12, fontWeight: '700' },
  statusLabel: { fontSize: 10, fontWeight: '700' },
  pendingText: { color: '#a56f00' },
  approvedText: { color: '#2e7d32' },
  rejectedText: { color: '#c62828' },
  sectionLabel: { color: '#71827a', fontSize: 11, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase' },
  questionText: { color: '#153b32', fontSize: 16, lineHeight: 23, marginTop: 5 },
  divider: { backgroundColor: '#e7eee9', height: 1, marginVertical: 14 },
  answerText: { color: '#334d43', fontSize: 15, lineHeight: 23, marginTop: 5 },
  noteBox: { backgroundColor: '#f5f8f5', borderRadius: 8, marginTop: 14, padding: 10 },
  noteLabel: { color: '#0f6b52', fontSize: 11, fontWeight: '700' },
  noteText: { color: '#53665e', fontSize: 13, lineHeight: 19, marginTop: 3 },
  dateText: { color: '#8a9b94', fontSize: 11, marginTop: 14 },
});
