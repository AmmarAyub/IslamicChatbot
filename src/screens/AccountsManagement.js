import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Button, Alert, TextInput, Modal, TouchableOpacity } from 'react-native';
import { getUsers, saveUsers, createUser } from '../storage/auth';
import { useFocusEffect } from '@react-navigation/native';

export default function AccountsManagement() {
  const [users, setUsers] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('user');

  const loadUsers = async () => {
    const data = await getUsers();
    setUsers(data);
  };

  useFocusEffect(
    useCallback(() => {
      loadUsers();
    }, [])
  );

  const handleCreate = async () => {
    if (!newUsername || !newPassword) {
      Alert.alert('Error', 'Username and password required');
      return;
    }
    try {
      await createUser(newUsername, newPassword, newRole);
      setModalVisible(false);
      setNewUsername('');
      setNewPassword('');
      loadUsers();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleDelete = (username) => {
    Alert.alert(
      'Delete Account',
      `Delete user "${username}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            const updated = { ...users };
            delete updated[username];
            await saveUsers(updated);
            loadUsers();
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.username}>{item[0]}</Text>
      <Text style={styles.role}>Role: {item[1].role}</Text>
      <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item[0])}>
        <Text style={styles.deleteText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Manage Accounts</Text>
      <Button title="Add New Account" onPress={() => setModalVisible(true)} />
      {Object.keys(users).length === 0 ? (
        <Text style={styles.empty}>No users found.</Text>
      ) : (
        <FlatList
          data={Object.entries(users)}
          keyExtractor={(item) => item[0]}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Account</Text>
            <TextInput
              style={styles.input}
              placeholder="Username"
              value={newUsername}
              onChangeText={setNewUsername}
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
            <View style={styles.rolePicker}>
              <Text>Role: </Text>
              <TouchableOpacity
                style={[styles.roleButton, newRole === 'user' && styles.roleSelected]}
                onPress={() => setNewRole('user')}
              >
                <Text>User</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleButton, newRole === 'admin' && styles.roleSelected]}
                onPress={() => setNewRole('admin')}
              >
                <Text>Admin</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalActions}>
              <Button title="Cancel" onPress={() => setModalVisible(false)} />
              <Button title="Create" onPress={handleCreate} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  list: {
    marginTop: 16,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  username: {
    fontSize: 16,
    fontWeight: '500',
  },
  role: {
    fontSize: 14,
    color: '#666',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  deleteText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  empty: {
    textAlign: 'center',
    marginTop: 40,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    width: '85%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  rolePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  roleButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    marginHorizontal: 4,
  },
  roleSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
});