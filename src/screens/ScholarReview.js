import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Button,
  TextInput,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Pressable,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import localDb from '../storage/localDb';

export default function ScholarReview() {
  const [queue, setQueue] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const loadQueue = async () => {
    try {
      const items = await localDb.getReviewQueue();
      setQueue(items);
      console.log('[ScholarReview] Loaded queue:', items.length);
    } catch (error) {
      console.error('[ScholarReview] Error loading queue:', error);
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    await loadQueue();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const fetch = async () => {
        if (!active) return;
        setLoading(true);
        await loadQueue();
        setLoading(false);
      };
      fetch();
      return () => {
        active = false;
      };
    }, [])
  );

  const updateDraft = (itemId, value) => {
    setDrafts((prev) => ({ ...prev, [itemId]: value }));
  };

  const addComment = async (item) => {
    const note = drafts[item.id] || '';
    const updated = {
      ...item,
      scholarComment: note,
      reviewedAt: Date.now(),
      reviewedBy: 'LocalScholar',
    };
    await localDb.resolveReviewItem(updated);
    setDrafts((prev) => ({ ...prev, [item.id]: '' }));
    await refresh();
  };

  const approve = async (item) => {
    const updated = {
      ...item,
      status: 'approved',
      approved: true,
      rejected: false,
      reviewedAt: Date.now(),
    };
    await localDb.resolveReviewItem(updated);
    await refresh();
  };

  const reject = async (item) => {
    const updated = {
      ...item,
      status: 'rejected',
      approved: false,
      rejected: true,
      reviewedAt: Date.now(),
    };
    await localDb.resolveReviewItem(updated);
    await refresh();
  };

  const reopen = async (item) => {
    const updated = {
      ...item,
      status: 'pending',
      approved: false,
      rejected: false,
    };
    await localDb.resolveReviewItem(updated);
    await refresh();
  };

  const getStatus = (item) => item.status || 'pending';

  const pendingItems = queue.filter((item) => getStatus(item) === 'pending');
  const approvedItems = queue.filter((item) => getStatus(item) === 'approved');
  const rejectedItems = queue.filter((item) => getStatus(item) === 'rejected');

  const openDetails = (item) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  const closeDetails = () => {
    setModalVisible(false);
    setSelectedItem(null);
  };

  const renderReviewCard = (item) => (
    <View key={item.id} style={styles.tile}>
      <View style={styles.tileHeader}>
        <View style={styles.userMeta}>
          <Text style={styles.userLabel}>User</Text>
          <Text style={styles.userName}>{item.ownerId || 'Unknown user'}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            getStatus(item) === 'pending' && styles.pending,
            getStatus(item) === 'approved' && styles.approved,
            getStatus(item) === 'rejected' && styles.rejected,
          ]}
        >
          <Text style={styles.statusText}>{getStatus(item).toUpperCase()}</Text>
        </View>
      </View>

      {item.questionText && item.answerText ? (
        <View style={styles.pairContainer}>
          <Text style={styles.pairLabel}>❓ Question:</Text>
          <Text style={styles.pairText} numberOfLines={2}>
            {item.questionText}
          </Text>
          <Text style={styles.pairLabel}>✅ Answer:</Text>
          <Text style={styles.pairText} numberOfLines={2}>
            {item.answerText}
          </Text>
        </View>
      ) : (
        <Text style={styles.messageText} numberOfLines={1}>
          {item.text}
        </Text>
      )}

      <View style={styles.flagContainer}>
        <Text style={styles.flagLabel}>Flagged:</Text>
        <Text style={styles.flagDate}>
          {item.flaggedAt ? new Date(item.flaggedAt).toLocaleString() : 'Unknown'}
        </Text>
      </View>

      {item.scholarComment ? (
        <View style={styles.commentContainer}>
          <Text style={styles.commentLabel}>Comment:</Text>
          <Text style={styles.commentText} numberOfLines={1}>
            {item.scholarComment}
          </Text>
        </View>
      ) : null}

      <View style={styles.actionRow}>
        <Button title="Details" onPress={() => openDetails(item)} color="#1a73e8" />
        {getStatus(item) === 'pending' && (
          <>
            <TextInput
              placeholder="Add comment"
              value={drafts[item.id] || ''}
              onChangeText={(value) => updateDraft(item.id, value)}
              style={styles.input}
            />
            <View style={styles.buttonGroup}>
              <Button title="Comment" onPress={() => addComment(item)} />
              <Button title="Approve" onPress={() => approve(item)} color="#28a745" />
              <Button title="Reject" onPress={() => reject(item)} color="#dc3545" />
            </View>
          </>
        )}
        {getStatus(item) !== 'pending' && (
          <Button title="Re-open" onPress={() => reopen(item)} color="#f0ad4e" />
        )}
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1a73e8" />
        <Text style={styles.loadingText}>Loading review queue...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
    >
      <Text style={styles.title}>Scholar Review Queue</Text>

      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, styles.summaryPending]}>
          <Text style={styles.summaryValue}>{pendingItems.length}</Text>
          <Text style={styles.summaryLabel}>Pending</Text>
        </View>
        <View style={[styles.summaryCard, styles.summaryApproved]}>
          <Text style={styles.summaryValue}>{approvedItems.length}</Text>
          <Text style={styles.summaryLabel}>Approved</Text>
        </View>
        <View style={[styles.summaryCard, styles.summaryRejected]}>
          <Text style={styles.summaryValue}>{rejectedItems.length}</Text>
          <Text style={styles.summaryLabel}>Rejected</Text>
        </View>
      </View>

      <View style={styles.sectionBox}>
        <Text style={styles.sectionTitle}>Pending Contents</Text>
        {pendingItems.length ? (
          pendingItems.map(renderReviewCard)
        ) : (
          <Text style={styles.emptyText}>No pending contents.</Text>
        )}
      </View>

      <View style={styles.sectionBox}>
        <Text style={styles.sectionTitle}>Approved Contents</Text>
        {approvedItems.length ? (
          approvedItems.map(renderReviewCard)
        ) : (
          <Text style={styles.emptyText}>No approved contents yet.</Text>
        )}
      </View>

      <View style={styles.sectionBox}>
        <Text style={styles.sectionTitle}>Rejected Contents</Text>
        {rejectedItems.length ? (
          rejectedItems.map(renderReviewCard)
        ) : (
          <Text style={styles.emptyText}>No rejected contents yet.</Text>
        )}
      </View>

      <Button title="Refresh" onPress={refresh} color="#1a73e8" />

      {/* Details Modal - Full Screen */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeDetails}
        statusBarTranslucent
        navigationBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {selectedItem?.questionText || 'Content Details'}
            </Text>
            {selectedItem && (
              <View style={styles.modalBody}>
                <ScrollView style={styles.modalScroll}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>User:</Text>
                    <Text style={styles.detailValue}>{selectedItem.ownerId || 'Unknown user'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Role:</Text>
                    <Text style={styles.detailValue}>{selectedItem.role || 'bot'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status:</Text>
                    <Text
                      style={[
                        styles.detailValue,
                        getStatus(selectedItem) === 'approved' && styles.approvedText,
                        getStatus(selectedItem) === 'rejected' && styles.rejectedText,
                        getStatus(selectedItem) === 'pending' && styles.pendingText,
                      ]}
                    >
                      {getStatus(selectedItem).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Flagged At:</Text>
                    <Text style={styles.detailValue}>
                      {selectedItem.flaggedAt
                        ? new Date(selectedItem.flaggedAt).toLocaleString()
                        : 'Unknown'}
                    </Text>
                  </View>
                  {selectedItem.reviewedAt && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Reviewed At:</Text>
                      <Text style={styles.detailValue}>
                        {new Date(selectedItem.reviewedAt).toLocaleString()}
                      </Text>
                    </View>
                  )}
                  {selectedItem.scholarComment ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Scholar Comment:</Text>
                      <Text style={styles.detailValue}>{selectedItem.scholarComment}</Text>
                    </View>
                  ) : null}

                  {selectedItem.answerText ? (
                    <>
                      <Text style={styles.contentLabel}>Answer:</Text>
                      <Text style={styles.modalText}>{selectedItem.answerText}</Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.contentLabel}>Content:</Text>
                      <Text style={styles.modalText}>{selectedItem.text}</Text>
                    </>
                  )}
                </ScrollView>

                <View style={styles.closeButtonContainer}>
                  <Pressable style={styles.closeButton} onPress={closeDetails}>
                    <Text style={styles.closeButtonText}>Close</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: '#f5f7fa' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f7fa' },
  loadingText: { marginTop: 8, fontSize: 16, color: '#555' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 12, color: '#1a237e' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryCard: { flex: 1, marginHorizontal: 4, padding: 10, borderRadius: 8, alignItems: 'center' },
  summaryPending: { backgroundColor: '#fff3e0', borderColor: '#ffb74d', borderWidth: 1 },
  summaryApproved: { backgroundColor: '#e8f5e9', borderColor: '#81c784', borderWidth: 1 },
  summaryRejected: { backgroundColor: '#ffebee', borderColor: '#e57373', borderWidth: 1 },
  summaryValue: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  summaryLabel: { fontSize: 12, color: '#555', marginTop: 2 },
  sectionBox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1a237e',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tile: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  tileHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  userMeta: { flex: 1 },
  userLabel: { color: '#666', fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },
  userName: { color: '#153b32', fontSize: 14, fontWeight: '700', marginTop: 2 },
  role: { fontWeight: 'bold', fontSize: 14, color: '#333' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  pending: { backgroundColor: '#ffc107' },
  approved: { backgroundColor: '#28a745' },
  rejected: { backgroundColor: '#dc3545' },
  statusText: { fontSize: 10, fontWeight: 'bold', color: '#fff' },
  messageText: { fontSize: 13, color: '#222', marginBottom: 4 },
  flagContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  flagLabel: { fontSize: 11, color: '#666', fontWeight: '600' },
  flagDate: { fontSize: 11, color: '#444', marginLeft: 4 },
  commentContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  commentLabel: { fontSize: 11, color: '#2e7d32', fontWeight: '600' },
  commentText: { fontSize: 11, color: '#2e7d32', marginLeft: 4, fontStyle: 'italic', flex: 1 },
  pairContainer: { marginTop: 4 },
  pairLabel: { fontSize: 12, fontWeight: 'bold', color: '#1a237e', marginTop: 2 },
  pairText: { fontSize: 13, color: '#333', marginBottom: 2 },
  actionRow: { marginTop: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 6,
    marginTop: 6,
    marginBottom: 6,
    borderRadius: 4,
    fontSize: 13,
    backgroundColor: '#fafafa',
  },
  buttonGroup: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 },
  emptyText: { color: '#777', paddingVertical: 8, textAlign: 'center', fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: '#fff' },
  modalContent: { flex: 1, padding: 20, backgroundColor: '#fff' },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#1a237e' },
  modalBody: { flex: 1 },
  modalScroll: { flex: 1, marginBottom: 12 },
  detailRow: { flexDirection: 'row', marginBottom: 10, alignItems: 'flex-start' },
  detailLabel: { fontSize: 14, fontWeight: 'bold', color: '#333', width: 120 },
  detailValue: { fontSize: 14, color: '#444', flex: 1 },
  approvedText: { color: '#28a745', fontWeight: 'bold' },
  rejectedText: { color: '#dc3545', fontWeight: 'bold' },
  pendingText: { color: '#ffc107', fontWeight: 'bold' },
  contentLabel: { fontSize: 16, fontWeight: 'bold', marginBottom: 8, color: '#1a237e' },
  modalText: { fontSize: 14, lineHeight: 22, color: '#222' },
  closeButtonContainer: {
    paddingBottom: 10,
    alignItems: 'flex-end',
    marginTop: 10,
  },
  closeButton: {
    backgroundColor: '#1a73e8',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  closeButtonText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
});