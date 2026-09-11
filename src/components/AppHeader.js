import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { getCurrentUser, setCurrentUser } from '../storage/auth';
import localDb from '../storage/localDb';

export default function AppHeader({ navigation }) {
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('');
  const [pendingReviews, setPendingReviews] = useState(0);

  useEffect(() => {
    let active = true;

    const loadHeaderData = async () => {
      const currentUser = await getCurrentUser();
      if (!active) return;

      const currentRole = currentUser?.role || '';
      setUsername(currentUser?.username || '');
      setRole(currentRole);

      if (currentRole === 'admin') {
        const queue = await localDb.getReviewQueue();
        if (active) {
          setPendingReviews(queue.filter(item => (
            item.status === 'pending' || (!item.status && item.reviewed !== true)
          )).length);
        }
      } else {
        setPendingReviews(0);
      }
    };

    loadHeaderData();
    const refreshTimer = setInterval(loadHeaderData, 1000);

    return () => {
      active = false;
      clearInterval(refreshTimer);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await setCurrentUser(null);
      setUsername('');
      setRole('');
      setPendingReviews(0);

      let rootNavigation = navigation;
      while (rootNavigation?.getParent?.()) {
        rootNavigation = rootNavigation.getParent();
      }

      rootNavigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'SignIn' }],
        })
      );
    } catch (error) {
      console.error('[AppHeader] Logout failed:', error);
      Alert.alert('Logout Failed', 'Unable to log out. Please try again.');
    }
  };

  return (
    <View style={styles.header}>
      <View style={styles.brandGroup}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>?</Text>
        </View>
        <View>
          <Text style={styles.title}>Islamic Questions</Text>
          <Text style={styles.subtitle}>Chatbot</Text>
        </View>
      </View>
      <View style={styles.actionsGroup}>
        {username ? <Text style={styles.username}>{username}</Text> : null}
        {/* {role ? <Text style={styles.role}>Role: {role}</Text> : null} */}
        {role === 'admin' ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`${pendingReviews} flagged messages awaiting approval`}
            style={styles.notificationButton}
            onPress={() => navigation.navigate('ScholarReview')}
          >
            <Text style={styles.notificationIcon}>🔔</Text>
            {pendingReviews > 0 ? (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {pendingReviews > 99 ? '99+' : pendingReviews}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Log out"
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutIcon}>↪</Text>
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomColor: '#d9e2dc',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 72,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  brandGroup: { alignItems: 'center', flexDirection: 'row' },
  actionsGroup: { alignItems: 'center', flexDirection: 'row' },
  logo: {
    alignItems: 'center',
    backgroundColor: '#0f6b52',
    borderColor: '#d5b45b',
    borderRadius: 22,
    borderWidth: 2,
    height: 44,
    justifyContent: 'center',
    marginRight: 10,
    width: 44,
  },
  logoText: { color: '#fff', fontSize: 26, fontWeight: '700' },
  title: { color: '#153b32', fontSize: 17, fontWeight: '700' },
  subtitle: { color: '#6b7d75', fontSize: 12, marginTop: 1 },
  username: { color: '#153b32', fontSize: 13, fontWeight: '600', marginRight: 10 },
  role: { color: '#53665e', fontSize: 13, marginRight: 10 },
  notificationButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    minHeight: 38,
    minWidth: 38,
    position: 'relative',
  },
  notificationIcon: { fontSize: 20 },
  notificationBadge: {
    alignItems: 'center',
    backgroundColor: '#c62828',
    borderColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 18,
    minWidth: 18,
    paddingHorizontal: 3,
    position: 'absolute',
    right: -2,
    top: -2,
  },
  notificationBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  logoutButton: {
    alignItems: 'center',
    borderColor: '#d9e2dc',
    borderRadius: 7,
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  logoutIcon: { color: '#b33a3a', fontSize: 18, marginRight: 5 },
  logoutText: { color: '#8f3030', fontSize: 14, fontWeight: '600' },
});