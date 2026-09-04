import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const storage = Platform.select({
  web: {
    getItem: (key) => Promise.resolve(localStorage.getItem(key)),
    setItem: (key, value) => Promise.resolve(localStorage.setItem(key, value)),
    removeItem: (key) => Promise.resolve(localStorage.removeItem(key)),
  },
  default: AsyncStorage,
});

export default storage;