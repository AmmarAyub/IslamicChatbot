import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  Modal,
  Pressable,
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
  const [selectedMessage, setSelectedMessage] = useState(null);

  const loadStats = async () => {
    try {
      const [users, currentUser] = await Promise.all([
        getUsers(),
        getCurrentUser(),
      ]);

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

      setRecentMessages(questions.slice(-5).reverse());

      setFlaggedList(
        reviewQueue
          .slice()
          .sort(
            (first, second) =>
              (second.flaggedAt || 0) - (first.flaggedAt || 0)
          )
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

  const openMessageDetails = (item, type) => {
    setSelectedMessage({ item, type });
  };

  const closeMessageDetails = () => {
    setSelectedMessage(null);
  };

  const formatDate = (value, fallback = 'Time unavailable') =>
    value ? new Date(value).toLocaleString() : fallback;

  const getReviewStatus = (item) => item.status || 'pending';

  const renderMessageItem = ({ item }) => (
    <TouchableOpacity
      style={styles.messageItem}
      onPress={() => openMessageDetails(item, 'recent')}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel="View recent message details"
    >
      <Text style={styles.messageText} numberOfLines={2}>
        {item.text}
      </Text>
      <Text style={styles.messageCategory}>
        {item.category || 'Islamic Guidance'}
      </Text>
      <Text style={styles.messageTimestamp}>
        {formatDate(item.timestamp)}
      </Text>
      <Text style={styles.detailsHint}>Tap to view details</Text>
    </TouchableOpacity>
  );

  const renderFlaggedItem = ({ item }) => (
    <TouchableOpacity
      style={styles.messageItem}
      onPress={() => openMessageDetails(item, 'flagged')}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel="View flagged message details"
    >
      <Text style={styles.messageText} numberOfLines={2}>
        {item.questionText || item.text || 'Flagged response'}
      </Text>
      <Text style={styles.messageCategory}>
        {item.category || 'Islamic Guidance'}
      </Text>
      <Text style={styles.messageTimestamp}>
        Flagged {formatDate(item.flaggedAt || item.timestamp)}
      </Text>
      <Text style={styles.detailsHint}>Tap to view details</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
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

      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🚩 Last Five Flagged Messages</Text>

          <Text style={styles.sectionCount}>
            {stats.flaggedMessages} total
          </Text>

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

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Chat')}
          >
            <Text style={styles.actionText}>💬 Chats</Text>
          </TouchableOpacity>

          {stats.role === 'admin' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.adminButton]}
              onPress={() => navigation.navigate('ScholarReview')}
            >
              <Text style={styles.actionText}>📋 Review</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.settingsButton]}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={styles.actionText}>⚙️ Settings</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        animationType="fade"
        transparent
        visible={Boolean(selectedMessage)}
        onRequestClose={closeMessageDetails}
      >
        <Pressable style={styles.modalOverlay} onPress={closeMessageDetails}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            {selectedMessage && (() => {
              const { item, type } = selectedMessage;
              const isFlagged = type === 'flagged';
              const content = isFlagged
                ? item.questionText || item.text || 'Message unavailable'
                : item.text || 'Message unavailable';

              return (
                <>
                  <View style={styles.modalHeader}>
                    <View>
                      <Text style={styles.modalEyebrow}>
                        {isFlagged ? 'FLAGGED MESSAGE' : 'RECENT MESSAGE'}
                      </Text>
                      <Text style={styles.modalTitle}>Message Details</Text>
                    </View>
                    <Pressable
                      style={styles.modalCloseButton}
                      onPress={closeMessageDetails}
                      accessibilityRole="button"
                      accessibilityLabel="Close message details"
                    >
                      <Text style={styles.modalCloseText}>×</Text>
                    </Pressable>
                  </View>

                  <ScrollView style={styles.modalScroll}>
                    <Text style={styles.modalContentLabel}>
                      {isFlagged && item.questionText ? 'Question' : 'Message'}
                    </Text>
                    <Text style={styles.modalMessageText}>{content}</Text>

                    {isFlagged && item.answerText ? (
                      <>
                        <Text style={styles.modalContentLabel}>Response</Text>
                        <Text style={styles.modalMessageText}>{item.answerText}</Text>
                      </>
                    ) : null}

                    <View style={styles.detailsDivider} />
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Category</Text>
                      <Text style={styles.detailValue}>
                        {item.category || 'Islamic Guidance'}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Role</Text>
                      <Text style={styles.detailValue}>{item.role || 'User'}</Text>
                    </View>
                    {item.ownerId ? (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>User</Text>
                        <Text style={styles.detailValue}>{item.ownerId}</Text>
                      </View>
                    ) : null}
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>
                        {isFlagged ? 'Flagged at' : 'Sent at'}
                      </Text>
                      <Text style={styles.detailValue}>
                        {formatDate(isFlagged ? item.flaggedAt || item.timestamp : item.timestamp)}
                      </Text>
                    </View>
                    {isFlagged ? (
                      <>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Review status</Text>
                          <Text style={styles.detailValue}>
                            {getReviewStatus(item).toUpperCase()}
                          </Text>
                        </View>
                        {item.reviewedAt ? (
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Reviewed at</Text>
                            <Text style={styles.detailValue}>{formatDate(item.reviewedAt)}</Text>
                          </View>
                        ) : null}
                        {item.scholarComment ? (
                          <>
                            <Text style={styles.modalContentLabel}>Scholar comment</Text>
                            <Text style={styles.modalMessageText}>{item.scholarComment}</Text>
                          </>
                        ) : null}
                      </>
                    ) : null}
                  </ScrollView>

                  <Pressable style={styles.modalDoneButton} onPress={closeMessageDetails}>
                    <Text style={styles.modalDoneText}>Done</Text>
                  </Pressable>
                </>
              );
            })()}
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
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
  statCardAlt: {
    backgroundColor: '#f0f8ff',
  },
  statCardApproved: {
    backgroundColor: '#e8f5e9',
  },
  statCardRejected: {
    backgroundColor: '#ffebee',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 9,
    color: '#666',
    marginTop: 3,
    textAlign: 'center',
  },
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
  sectionTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  sectionCount: {
    color: '#666',
    fontSize: 12,
    marginRight: 8,
  },
  viewAllButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  viewAllText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  messageItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  messageText: {
    fontSize: 14,
    color: '#333',
  },
  messageCategory: {
    fontSize: 11,
    color: '#0f6b52',
    fontWeight: '600',
  },
  messageTimestamp: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  detailsHint: {
    fontSize: 11,
    color: '#007AFF',
    marginTop: 4,
    fontWeight: '600',
  },
  emptyText: {
    color: '#999',
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  quickActions: {
    padding: 16,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginTop: 10,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingHorizontal: 4,
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminButton: {
    backgroundColor: '#FF9500',
  },
  settingsButton: {
    backgroundColor: '#34C759',
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  modalCard: {
    maxHeight: '82%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalEyebrow: {
    color: '#0f6b52',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  modalTitle: {
    color: '#333',
    fontSize: 21,
    fontWeight: 'bold',
    marginTop: 3,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
  },
  modalCloseText: {
    color: '#555',
    fontSize: 24,
    lineHeight: 27,
  },
  modalScroll: {
    flexGrow: 0,
  },
  modalContentLabel: {
    color: '#0f6b52',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 5,
    marginTop: 12,
  },
  modalMessageText: {
    color: '#333',
    fontSize: 15,
    lineHeight: 23,
  },
  detailsDivider: {
    height: 1,
    backgroundColor: '#e8e8e8',
    marginTop: 18,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    marginVertical: 5,
  },
  detailLabel: {
    color: '#777',
    fontSize: 13,
    width: 105,
  },
  detailValue: {
    color: '#333',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  modalDoneButton: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 18,
  },
  modalDoneText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
