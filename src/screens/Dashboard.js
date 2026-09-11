import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  FlatList,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import localDb from '../storage/localDb';
import { getUsers, getCurrentUser } from '../storage/auth';

export default function Dashboard({ navigation }) {
  const [stats, setStats] = useState({
    totalMessages: 0,
    flaggedMessages: 0,
    reviewQueue: 0,
    approvedMessages: 0,
    rejectedMessages: 0,
    totalUsers: 0,
    role: '',
  });
  const [flaggedList, setFlaggedList] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = async () => {
    try {
      const [users, currentUser] = await Promise.all([getUsers(), getCurrentUser()]);
      const [allMessages, reviewQueue] = await Promise.all([
        localDb.getMessages(currentUser?.username),
        currentUser?.role === 'admin'
          ? localDb.getReviewQueue()
          : localDb.getReviewQueue(currentUser?.username),
      ]);

      const questions = allMessages.filter(message => message.role === 'user');
      const pendingReview = reviewQueue.filter(item => (
        item.status === 'pending' || (!item.status && !item.reviewed)
      ));
      const approvedReview = reviewQueue.filter(item => (
        item.status === 'approved' || item.approved === true
      ));
      const rejectedReview = reviewQueue.filter(item => (
        item.status === 'rejected' || item.rejected === true
      ));

      setStats({
        totalMessages: questions.length,
        flaggedMessages: reviewQueue.length,
        reviewQueue: pendingReview.length,
        approvedMessages: approvedReview.length,
        rejectedMessages: rejectedReview.length,
        totalUsers: Object.keys(users).length,
        role: currentUser?.role || '',
      });

      // Last 5 user questions only.
      setRecentMessages(questions.slice(-5).reverse());

      // The review queue is the source of truth for messages flagged in Chatboard.
      setFlaggedList(
        reviewQueue
          .slice()
          .sort((first, second) => (second.flaggedAt || 0) - (first.flaggedAt || 0))
          .slice(0, 5)
      );
    } catch (error) {
      console.error('[Dashboard] Error loading stats:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const renderMessageItem = ({ item }) => (
    <View style={styles.messageItem}>
      <Text style={styles.messageText} numberOfLines={2}>
        {item.text}
      </Text>
      <Text style={styles.messageCategory}>{item.category || 'Islamic Guidance'}</Text>
      <Text style={styles.messageTimestamp}>
        {item.timestamp ? new Date(item.timestamp).toLocaleString() : 'Time unavailable'}
      </Text>
    </View>
  );

  const renderFlaggedItem = ({ item }) => (
    <View style={styles.messageItem}>
      <Text style={styles.messageText} numberOfLines={2}>
        {item.questionText || item.text || 'Flagged response'}
      </Text>
      <Text style={styles.messageCategory}>{item.category || 'Islamic Guidance'}</Text>
      <Text style={styles.messageTimestamp}>
        Flagged {new Date(item.flaggedAt || item.timestamp).toLocaleString()}
      </Text>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalMessages}</Text>
          <Text style={styles.statLabel}>Total Messages</Text>
        </View>
        <View style={[styles.statCard, styles.statCardAlt]}>
          <Text style={styles.statNumber}>{stats.flaggedMessages}</Text>
          <Text style={styles.statLabel}>Total Flagged</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.reviewQueue}</Text>
          <Text style={styles.statLabel}>Pending Questions</Text>
        </View>
        <View style={[styles.statCard, styles.statCardApproved]}>
          <Text style={styles.statNumber}>{stats.approvedMessages}</Text>
          <Text style={styles.statLabel}>Approved Questions</Text>
        </View>
        <View style={[styles.statCard, styles.statCardRejected]}>
          <Text style={styles.statNumber}>{stats.rejectedMessages}</Text>
          <Text style={styles.statLabel}>Rejected Questions</Text>
        </View>
        <View style={[styles.statCard, styles.statCardAlt]}>
          <Text style={styles.statNumber}>{stats.totalUsers}</Text>
          <Text style={styles.statLabel}>Total Users</Text>
        </View>
      </View>

      {/* Recent Messages Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>📝 Recent Messages</Text>
        {recentMessages.length === 0 ? (
          <Text style={styles.emptyText}>No messages yet.</Text>
        ) : (
          <FlatList
            data={recentMessages}
            keyExtractor={item => item.id.toString()}
            renderItem={renderMessageItem}
            scrollEnabled={false}
          />
        )}
      </View>

      {/* Flagged Messages Section */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🚩 Last Five Flagged Messages</Text>
          <Text style={styles.sectionCount}>{stats.flaggedMessages} total</Text>
          {stats.role === 'admin' && (
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => navigation.navigate('ScholarReview')}
            >
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          )}
        </View>
        {flaggedList.length === 0 ? (
          <Text style={styles.emptyText}>No flagged messages yet.</Text>
        ) : (
          <FlatList
            data={flaggedList}
            keyExtractor={item => item.id.toString()}
            renderItem={renderFlaggedItem}
            scrollEnabled={false}
          />
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Chat')}
        >
          <Text style={styles.actionText}>💬 Go to Chats</Text>
        </TouchableOpacity>
        {stats.role === 'admin' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.adminButton]}
            onPress={() => navigation.navigate('ScholarReview')}
          >
            <Text style={styles.actionText}>📋 Review Queue</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.actionButton, styles.settingsButton]}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.actionText}>⚙️ Settings</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// Styles (same as before)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 10,
    width: '15.5%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
  },
  statCardAlt: { backgroundColor: '#f0f8ff' },
  statCardApproved: { backgroundColor: '#e8f5e9' },
  statCardRejected: { backgroundColor: '#ffebee' },
  statNumber: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  statLabel: { fontSize: 9, color: '#666', marginTop: 3, textAlign: 'center' },
  sectionContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: { flex: 1, fontSize: 18, fontWeight: 'bold', color: '#333' },
  sectionCount: { color: '#666', fontSize: 12, marginRight: 8 },
  viewAllButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  viewAllText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  messageItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  messageText: { fontSize: 14, color: '#333' },
  messageCategory: { fontSize: 11, color: '#0f6b52', fontWeight: '600' },
  messageTimestamp: { fontSize: 11, color: '#999', marginTop: 2 },
  emptyText: { color: '#999', fontStyle: 'italic', paddingVertical: 8 },
  quickActions: { padding: 16 },
  actionButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  adminButton: { backgroundColor: '#FF9500' },
  settingsButton: { backgroundColor: '#34C759' },
  actionText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});