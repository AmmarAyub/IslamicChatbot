// // src/screens/Dashboard.js
// import React, { useState, useCallback } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   TouchableOpacity,
//   RefreshControl,
//   FlatList,
// } from 'react-native';
// import { useFocusEffect } from '@react-navigation/native';
// import { getMessages, getReviewQueue, flagMessage } from '../storage/localDb';
// import { getUsers } from '../storage/auth';
// import { getCurrentUser } from '../storage/auth';

// export default function Dashboard({ navigation }) {
//   const [stats, setStats] = useState({
//     totalMessages: 0,
//     flaggedMessages: 0,
//     reviewQueue: 0,
//     totalUsers: 0,
//     username: '',
//     role: '',
//   });
//   const [flaggedList, setFlaggedList] = useState([]);
//   const [refreshing, setRefreshing] = useState(false);

//   const loadStats = async () => {
//     const messages = await getMessages();
//     const queue = await getReviewQueue();
//     const users = await getUsers();
//     const currentUser = await getCurrentUser();

//     const flagged = messages.filter(m => m.isFlagged === true);
//     const pendingReview = queue.filter(item => !item.reviewed);

//     setStats({
//       totalMessages: messages.length,
//       flaggedMessages: flagged.length,
//       reviewQueue: pendingReview.length,
//       totalUsers: Object.keys(users).length,
//       username: currentUser?.username || '',
//       role: currentUser?.role || '',
//     });

//     // Get last 5 flagged messages for display
//     setFlaggedList(flagged.slice(-5).reverse());
//   };

//   useFocusEffect(
//     useCallback(() => {
//       loadStats();
//     }, [])
//   );

//   const onRefresh = async () => {
//     setRefreshing(true);
//     await loadStats();
//     setRefreshing(false);
//   };

//   const renderFlaggedItem = ({ item }) => (
//     <View style={styles.flaggedItem}>
//       <Text style={styles.flaggedText} numberOfLines={2}>
//         {item.text}
//       </Text>
//       <Text style={styles.flaggedTimestamp}>
//         {new Date(item.timestamp).toLocaleString()}
//       </Text>
//     </View>
//   );

//   return (
//     <ScrollView
//       style={styles.container}
//       refreshControl={
//         <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
//       }
//     >
//       <View style={styles.header}>
//         <Text style={styles.welcome}>Welcome, {stats.username}!</Text>
//         <Text style={styles.role}>Role: {stats.role}</Text>
//       </View>

//       {/* Stats Grid */}
//       <View style={styles.statsGrid}>
//         <View style={styles.statCard}>
//           <Text style={styles.statNumber}>{stats.totalMessages}</Text>
//           <Text style={styles.statLabel}>Total Messages</Text>
//         </View>
//         <View style={[styles.statCard, styles.statCardAlt]}>
//           <Text style={styles.statNumber}>{stats.flaggedMessages}</Text>
//           <Text style={styles.statLabel}>Flagged</Text>
//         </View>
//         <View style={styles.statCard}>
//           <Text style={styles.statNumber}>{stats.reviewQueue}</Text>
//           <Text style={styles.statLabel}>Review Queue</Text>
//         </View>
//         <View style={[styles.statCard, styles.statCardAlt]}>
//           <Text style={styles.statNumber}>{stats.totalUsers}</Text>
//           <Text style={styles.statLabel}>Total Users</Text>
//         </View>
//       </View>

//       {/* Flagged Messages Section */}
//       <View style={styles.flaggedSection}>
//         <View style={styles.sectionHeader}>
//           <Text style={styles.sectionTitle}>🚩 Flagged Messages</Text>
//           {stats.role === 'admin' && (
//             <TouchableOpacity
//               style={styles.viewAllButton}
//               onPress={() => navigation.navigate('ScholarReview')}
//             >
//               <Text style={styles.viewAllText}>View All</Text>
//             </TouchableOpacity>
//           )}
//         </View>
//         {flaggedList.length === 0 ? (
//           <Text style={styles.emptyText}>No flagged messages yet.</Text>
//         ) : (
//           <FlatList
//             data={flaggedList}
//             keyExtractor={(item) => item.id.toString()}
//             renderItem={renderFlaggedItem}
//             scrollEnabled={false}
//             style={styles.flaggedList}
//           />
//         )}
//       </View>

//       {/* Quick Actions */}
//       <View style={styles.quickActions}>
//         <Text style={styles.sectionTitle}>Quick Actions</Text>
//         <TouchableOpacity
//           style={styles.actionButton}
//           onPress={() => navigation.navigate('Chatboard')}
//         >
//           <Text style={styles.actionText}>💬 Go to Chat</Text>
//         </TouchableOpacity>
//         {stats.role === 'admin' && (
//           <TouchableOpacity
//             style={[styles.actionButton, styles.adminButton]}
//             onPress={() => navigation.navigate('ScholarReview')}
//           >
//             <Text style={styles.actionText}>📋 Review Queue</Text>
//           </TouchableOpacity>
//         )}
//         <TouchableOpacity
//           style={[styles.actionButton, styles.settingsButton]}
//           onPress={() => navigation.navigate('Settings')}
//         >
//           <Text style={styles.actionText}>⚙️ Settings</Text>
//         </TouchableOpacity>
//       </View>
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f5f5f5',
//   },
//   header: {
//     backgroundColor: '#007AFF',
//     padding: 24,
//     paddingTop: 40,
//     paddingBottom: 30,
//     borderBottomLeftRadius: 20,
//     borderBottomRightRadius: 20,
//   },
//   welcome: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#fff',
//   },
//   role: {
//     fontSize: 16,
//     color: '#e0e0e0',
//     marginTop: 4,
//   },
//   statsGrid: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     justifyContent: 'space-between',
//     padding: 16,
//     marginTop: -20,
//   },
//   statCard: {
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     padding: 16,
//     width: '48%',
//     marginBottom: 12,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 2,
//     alignItems: 'center',
//   },
//   statCardAlt: {
//     backgroundColor: '#f0f8ff',
//   },
//   statNumber: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     color: '#333',
//   },
//   statLabel: {
//     fontSize: 14,
//     color: '#666',
//     marginTop: 4,
//   },
//   flaggedSection: {
//     backgroundColor: '#fff',
//     marginHorizontal: 16,
//     marginVertical: 8,
//     padding: 16,
//     borderRadius: 12,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.05,
//     shadowRadius: 3,
//     elevation: 1,
//   },
//   sectionHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 10,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#333',
//   },
//   viewAllButton: {
//     backgroundColor: '#007AFF',
//     paddingHorizontal: 12,
//     paddingVertical: 4,
//     borderRadius: 12,
//   },
//   viewAllText: {
//     color: '#fff',
//     fontSize: 12,
//     fontWeight: '600',
//   },
//   flaggedList: {
//     marginTop: 4,
//   },
//   flaggedItem: {
//     paddingVertical: 8,
//     borderBottomWidth: 1,
//     borderBottomColor: '#f0f0f0',
//   },
//   flaggedText: {
//     fontSize: 14,
//     color: '#333',
//   },
//   flaggedTimestamp: {
//     fontSize: 11,
//     color: '#999',
//     marginTop: 2,
//   },
//   emptyText: {
//     color: '#999',
//     fontStyle: 'italic',
//     paddingVertical: 8,
//   },
//   quickActions: {
//     padding: 16,
//   },
//   actionButton: {
//     backgroundColor: '#007AFF',
//     padding: 16,
//     borderRadius: 10,
//     marginBottom: 10,
//     alignItems: 'center',
//   },
//   adminButton: {
//     backgroundColor: '#FF9500',
//   },
//   settingsButton: {
//     backgroundColor: '#34C759',
//   },
//   actionText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//   },
// });

// src/screens/Dashboard.js
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
import { getReviewQueue, getFlaggedMessages, getTotalMessages } from '../storage/localDb';
import { getChats } from '../storage/chatStorage';
import { getUsers } from '../storage/auth';
import { getCurrentUser } from '../storage/auth';

export default function Dashboard({ navigation }) {
  const [stats, setStats] = useState({
    totalMessages: 0,
    flaggedMessages: 0,
    reviewQueue: 0,
    totalUsers: 0,
    username: '',
    role: '',
  });
  const [flaggedList, setFlaggedList] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = async () => {
    const messages = await getFlaggedMessages(); // returns all flagged messages from all chats
    const queue = await getReviewQueue();
    const users = await getUsers();
    const currentUser = await getCurrentUser();
    const totalMsgs = await getTotalMessages();

    const pendingReview = queue.filter(item => !item.reviewed);

    setStats({
      totalMessages: totalMsgs,
      flaggedMessages: messages.length,
      reviewQueue: pendingReview.length,
      totalUsers: Object.keys(users).length,
      username: currentUser?.username || '',
      role: currentUser?.role || '',
    });

    setFlaggedList(messages.slice(-5).reverse());
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

  const renderFlaggedItem = ({ item }) => (
    <View style={styles.flaggedItem}>
      <Text style={styles.flaggedText} numberOfLines={2}>
        {item.text}
      </Text>
      <Text style={styles.flaggedTimestamp}>
        {new Date(item.timestamp).toLocaleString()}
      </Text>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.welcome}>Welcome, {stats.username}!</Text>
        <Text style={styles.role}>Role: {stats.role}</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalMessages}</Text>
          <Text style={styles.statLabel}>Total Messages</Text>
        </View>
        <View style={[styles.statCard, styles.statCardAlt]}>
          <Text style={styles.statNumber}>{stats.flaggedMessages}</Text>
          <Text style={styles.statLabel}>Flagged</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.reviewQueue}</Text>
          <Text style={styles.statLabel}>Review Queue</Text>
        </View>
        <View style={[styles.statCard, styles.statCardAlt]}>
          <Text style={styles.statNumber}>{stats.totalUsers}</Text>
          <Text style={styles.statLabel}>Total Users</Text>
        </View>
      </View>

      <View style={styles.flaggedSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🚩 Flagged Messages</Text>
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
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderFlaggedItem}
            scrollEnabled={false}
            style={styles.flaggedList}
          />
        )}
      </View>

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

// (Styles remain the same as before)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    backgroundColor: '#007AFF',
    padding: 24,
    paddingTop: 40,
    paddingBottom: 30,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  welcome: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  role: { fontSize: 16, color: '#e0e0e0', marginTop: 4 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 16,
    marginTop: -20,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
  },
  statCardAlt: { backgroundColor: '#f0f8ff' },
  statNumber: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  statLabel: { fontSize: 14, color: '#666', marginTop: 4 },
  flaggedSection: {
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
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  viewAllButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  viewAllText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  flaggedList: { marginTop: 4 },
  flaggedItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  flaggedText: { fontSize: 14, color: '#333' },
  flaggedTimestamp: { fontSize: 11, color: '#999', marginTop: 2 },
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