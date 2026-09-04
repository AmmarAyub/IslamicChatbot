// import React, { useState, useCallback } from 'react';
// import {
//   View,
//   Text,
//   Button,
//   TextInput,
//   StyleSheet,
//   ScrollView,
//   ActivityIndicator,
//   RefreshControl,
// } from 'react-native';
// import { useFocusEffect } from '@react-navigation/native';
// import localDb from '../storage/localDb';

// export default function ScholarReview() {
//   const [queue, setQueue] = useState([]);
//   const [drafts, setDrafts] = useState({});
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);

//   // ---- Load data ----
//   const loadQueue = async () => {
//     try {
//       const items = await localDb.getReviewQueue();
//       setQueue(items);
//     } catch (error) {
//       console.error('[ScholarReview] Error loading queue:', error);
//     }
//   };

//   // ---- Refresh with loading ----
//   const refresh = async () => {
//     setRefreshing(true);
//     await loadQueue();
//     setRefreshing(false);
//   };

//   // ---- Auto-refresh when screen gets focus ----
//   useFocusEffect(
//     useCallback(() => {
//       let isActive = true;
//       const fetchData = async () => {
//         if (!isActive) return;
//         setLoading(true);
//         await loadQueue();
//         setLoading(false);
//       };
//       fetchData();
//       return () => { isActive = false; };
//     }, [])
//   );

//   // ---- Draft handling ----
//   const updateDraft = (itemId, value) => {
//     setDrafts((prev) => ({ ...prev, [itemId]: value }));
//   };

//   // ---- Add comment ----
//   const addComment = async (item) => {
//     const note = drafts[item.id] || '';
//     const updated = {
//       ...item,
//       scholarComment: note,
//       reviewedAt: Date.now(),
//       reviewedBy: 'LocalScholar',
//     };
//     await localDb.resolveReviewItem(updated);
//     setDrafts((prev) => ({ ...prev, [item.id]: '' }));
//     await refresh();
//   };

//   // ---- Approve ----
//   const approve = async (item) => {
//     const updated = {
//       ...item,
//       status: 'approved',
//       approved: true,
//       rejected: false,
//       reviewedAt: Date.now(),
//     };
//     await localDb.resolveReviewItem(updated);
//     await refresh();
//   };

//   // ---- Reject ----
//   const reject = async (item) => {
//     const updated = {
//       ...item,
//       status: 'rejected',
//       approved: false,
//       rejected: true,
//       reviewedAt: Date.now(),
//     };
//     await localDb.resolveReviewItem(updated);
//     await refresh();
//   };

//   // ---- Re-open ----
//   const reopen = async (item) => {
//     const updated = {
//       ...item,
//       status: 'pending',
//       approved: false,
//       rejected: false,
//     };
//     await localDb.resolveReviewItem(updated);
//     await refresh();
//   };

//   const getStatus = (item) => item.status || 'pending';

//   const pendingItems = queue.filter((item) => getStatus(item) === 'pending');
//   const approvedItems = queue.filter((item) => getStatus(item) === 'approved');
//   const rejectedItems = queue.filter((item) => getStatus(item) === 'rejected');

//   const renderReviewCard = (item) => (
//     <View key={item.id} style={styles.item}>
//       <View style={styles.itemHeader}>
//         <Text style={styles.role}>{item.role || 'bot'}</Text>
//         <Text
//           style={[
//             styles.statusBadge,
//             getStatus(item) === 'pending' && styles.pending,
//             getStatus(item) === 'approved' && styles.approved,
//             getStatus(item) === 'rejected' && styles.rejected,
//           ]}
//         >
//           {getStatus(item).toUpperCase()}
//         </Text>
//       </View>
//       <Text style={styles.messageText}>{item.text}</Text>
//       <Text style={styles.muted}>
//         Flagged: {item.flaggedAt ? new Date(item.flaggedAt).toLocaleString() : 'Unknown'}
//       </Text>
//       {item.scholarComment ? (
//         <Text style={styles.comment}>Comment: {item.scholarComment}</Text>
//       ) : null}

//       {getStatus(item) === 'pending' && (
//         <>
//           <TextInput
//             placeholder="Scholar comment"
//             value={drafts[item.id] || ''}
//             onChangeText={(value) => updateDraft(item.id, value)}
//             style={styles.input}
//           />
//           <View style={styles.row}>
//             <Button title="Add Comment" onPress={() => addComment(item)} />
//             <Button title="Approve" onPress={() => approve(item)} />
//             <Button title="Reject" onPress={() => reject(item)} color="#d9534f" />
//           </View>
//         </>
//       )}

//       {getStatus(item) !== 'pending' && (
//         <View style={styles.row}>
//           <Button title="Re-open" onPress={() => reopen(item)} color="#f0ad4e" />
//         </View>
//       )}
//     </View>
//   );

//   if (loading && !refreshing) {
//     return (
//       <View style={styles.centered}>
//         <ActivityIndicator size="large" color="#1f3c88" />
//         <Text style={styles.loadingText}>Loading review queue...</Text>
//       </View>
//     );
//   }

//   return (
//     <ScrollView
//       style={styles.container}
//       refreshControl={
//         <RefreshControl refreshing={refreshing} onRefresh={refresh} />
//       }
//     >
//       <Text style={styles.title}>Scholar Review Queue</Text>

//       <View style={styles.summaryRow}>
//         <View style={styles.summaryCard}>
//           <Text style={styles.summaryValue}>{pendingItems.length}</Text>
//           <Text>Pending</Text>
//         </View>
//         <View style={styles.summaryCard}>
//           <Text style={styles.summaryValue}>{approvedItems.length}</Text>
//           <Text>Approved</Text>
//         </View>
//         <View style={styles.summaryCard}>
//           <Text style={styles.summaryValue}>{rejectedItems.length}</Text>
//           <Text>Rejected</Text>
//         </View>
//       </View>

//       <View style={styles.sectionBox}>
//         <Text style={styles.sectionTitle}>Pending Contents</Text>
//         {pendingItems.length ? (
//           pendingItems.map(renderReviewCard)
//         ) : (
//           <Text style={styles.emptyText}>No pending contents.</Text>
//         )}
//       </View>

//       <View style={styles.sectionBox}>
//         <Text style={styles.sectionTitle}>Approved Contents</Text>
//         {approvedItems.length ? (
//           approvedItems.map(renderReviewCard)
//         ) : (
//           <Text style={styles.emptyText}>No approved contents yet.</Text>
//         )}
//       </View>

//       <View style={styles.sectionBox}>
//         <Text style={styles.sectionTitle}>Rejected Contents</Text>
//         {rejectedItems.length ? (
//           rejectedItems.map(renderReviewCard)
//         ) : (
//           <Text style={styles.emptyText}>No rejected contents yet.</Text>
//         )}
//       </View>

//       <Button title="Refresh" onPress={refresh} />
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, padding: 12, backgroundColor: '#f7f9fc' },
//   centered: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#f7f9fc',
//   },
//   loadingText: { marginTop: 12, fontSize: 16, color: '#555' },
//   title: { fontSize: 20, fontWeight: '700', marginBottom: 10 },
//   summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
//   summaryCard: {
//     flex: 1,
//     marginHorizontal: 4,
//     padding: 10,
//     borderRadius: 8,
//     backgroundColor: '#fff',
//     alignItems: 'center',
//   },
//   summaryValue: { fontSize: 18, fontWeight: '700', color: '#1f3c88' },
//   sectionBox: {
//     backgroundColor: '#fff',
//     borderRadius: 8,
//     padding: 10,
//     marginBottom: 12,
//   },
//   sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
//   item: {
//     paddingVertical: 8,
//     borderBottomWidth: 1,
//     borderColor: '#eee',
//     marginBottom: 8,
//   },
//   itemHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 4,
//   },
//   role: { fontWeight: '700' },
//   messageText: { fontSize: 14, color: '#222' },
//   statusBadge: {
//     fontSize: 12,
//     fontWeight: '600',
//     paddingHorizontal: 8,
//     paddingVertical: 2,
//     borderRadius: 12,
//     overflow: 'hidden',
//   },
//   pending: { backgroundColor: '#ffc107', color: '#333' },
//   approved: { backgroundColor: '#28a745', color: '#fff' },
//   rejected: { backgroundColor: '#dc3545', color: '#fff' },
//   muted: { color: '#666', marginTop: 4, fontSize: 12 },
//   comment: { color: '#2e7d32', marginTop: 4, fontStyle: 'italic' },
//   input: {
//     borderWidth: 1,
//     borderColor: '#ccc',
//     padding: 6,
//     marginTop: 6,
//     marginBottom: 6,
//     borderRadius: 4,
//   },
//   row: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     flexWrap: 'wrap',
//     gap: 6,
//     marginTop: 4,
//   },
//   emptyText: { color: '#777', paddingVertical: 8, textAlign: 'center' },
// });



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
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import localDb from '../storage/localDb';

export default function ScholarReview() {
  const [queue, setQueue] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
      return () => { active = false; };
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

  const renderReviewCard = (item) => (
    <View key={item.id} style={styles.item}>
      <View style={styles.itemHeader}>
        <Text style={styles.role}>{item.role || 'bot'}</Text>
        <Text
          style={[
            styles.statusBadge,
            getStatus(item) === 'pending' && styles.pending,
            getStatus(item) === 'approved' && styles.approved,
            getStatus(item) === 'rejected' && styles.rejected,
          ]}
        >
          {getStatus(item).toUpperCase()}
        </Text>
      </View>
      <Text style={styles.messageText}>{item.text}</Text>
      <Text style={styles.muted}>
        Flagged: {item.flaggedAt ? new Date(item.flaggedAt).toLocaleString() : 'Unknown'}
      </Text>
      {item.scholarComment ? (
        <Text style={styles.comment}>Comment: {item.scholarComment}</Text>
      ) : null}

      {getStatus(item) === 'pending' && (
        <>
          <TextInput
            placeholder="Scholar comment"
            value={drafts[item.id] || ''}
            onChangeText={(value) => updateDraft(item.id, value)}
            style={styles.input}
          />
          <View style={styles.row}>
            <Button title="Add Comment" onPress={() => addComment(item)} />
            <Button title="Approve" onPress={() => approve(item)} />
            <Button title="Reject" onPress={() => reject(item)} color="#d9534f" />
          </View>
        </>
      )}

      {getStatus(item) !== 'pending' && (
        <View style={styles.row}>
          <Button title="Re-open" onPress={() => reopen(item)} color="#f0ad4e" />
        </View>
      )}
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1f3c88" />
        <Text style={styles.loadingText}>Loading review queue...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refresh} />
      }
    >
      <Text style={styles.title}>Scholar Review Queue</Text>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{pendingItems.length}</Text>
          <Text>Pending</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{approvedItems.length}</Text>
          <Text>Approved</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{rejectedItems.length}</Text>
          <Text>Rejected</Text>
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

      <Button title="Refresh" onPress={refresh} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: '#f7f9fc' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7f9fc' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#555' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 10 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryCard: { flex: 1, marginHorizontal: 4, padding: 10, borderRadius: 8, backgroundColor: '#fff', alignItems: 'center' },
  summaryValue: { fontSize: 18, fontWeight: '700', color: '#1f3c88' },
  sectionBox: { backgroundColor: '#fff', borderRadius: 8, padding: 10, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  item: { paddingVertical: 8, borderBottomWidth: 1, borderColor: '#eee', marginBottom: 8 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  role: { fontWeight: '700' },
  messageText: { fontSize: 14, color: '#222' },
  statusBadge: { fontSize: 12, fontWeight: '600', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  pending: { backgroundColor: '#ffc107', color: '#333' },
  approved: { backgroundColor: '#28a745', color: '#fff' },
  rejected: { backgroundColor: '#dc3545', color: '#fff' },
  muted: { color: '#666', marginTop: 4, fontSize: 12 },
  comment: { color: '#2e7d32', marginTop: 4, fontStyle: 'italic' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 6, marginTop: 6, marginBottom: 6, borderRadius: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  emptyText: { color: '#777', paddingVertical: 8, textAlign: 'center' },
});