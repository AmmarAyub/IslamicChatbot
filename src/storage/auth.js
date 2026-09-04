 import storage from './secureStorageWeb';

const USERS_KEY = '@chatboard_users';
const CURRENT_USER_KEY = '@chatboard_current_user';

async function sha256(message) {
  if (window.crypto && window.crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } else {
    let hash = 0;
    for (let i = 0; i < message.length; i++) {
      const char = message.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(16);
  }
}

export async function getUsers() {
  const data = await storage.getItem(USERS_KEY);
  return data ? JSON.parse(data) : {};
}

export async function saveUsers(users) {
  await storage.setItem(USERS_KEY, JSON.stringify(users));
}

export async function createUser(username, password, role = 'user') {
  const users = await getUsers();
  if (users[username]) {
    throw new Error('Username already exists');
  }
  const hashed = await sha256(password);
  users[username] = { password: hashed, role };
  await saveUsers(users);
  return true;
}

export async function authenticateUser(username, password) {
  const users = await getUsers();
  const user = users[username];
  if (!user) return null;
  const hashed = await sha256(password);
  if (user.password === hashed) {
    return { username, role: user.role };
  }
  return null;
}

export async function setCurrentUser(user) {
  if (user) {
    await storage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    await storage.removeItem(CURRENT_USER_KEY);
  }
}

export async function getCurrentUser() {
  const data = await storage.getItem(CURRENT_USER_KEY);
  return data ? JSON.parse(data) : null;
}

export async function isAdmin() {
  const user = await getCurrentUser();
  return user && user.role === 'admin';
}

// Auto-create admin if no users exist
export async function ensureAdminExists() {
  const users = await getUsers();
  if (Object.keys(users).length === 0) {
    const hashed = await sha256('admin123');
    users.admin = { password: hashed, role: 'admin' };
    await saveUsers(users);
  }
}

// import AsyncStorage from '@react-native-async-storage/async-storage';

// const USER_KEY = '@current_user';
// const ADMIN_KEY = '@is_admin';

// export async function getCurrentUser() {
//   try {
//     const json = await AsyncStorage.getItem(USER_KEY);
//     return json ? JSON.parse(json) : null;
//   } catch { return null; }
// }

// export async function setCurrentUser(user) {
//   try {
//     if (user) await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
//     else await AsyncStorage.removeItem(USER_KEY);
//   } catch (e) { console.error(e); }
// }

// export async function isSignedIn() {
//   return (await getCurrentUser()) !== null;
// }

// export async function isAdmin() {
//   try {
//     const flag = await AsyncStorage.getItem(ADMIN_KEY);
//     return flag === 'true';
//   } catch { return false; }
// }

// export async function setAdmin(flag) {
//   try { await AsyncStorage.setItem(ADMIN_KEY, String(flag)); } catch {}
// }

// // Default export – so `import auth from './auth'` works
// const auth = { getCurrentUser, setCurrentUser, isSignedIn, isAdmin, setAdmin };
// export default auth;