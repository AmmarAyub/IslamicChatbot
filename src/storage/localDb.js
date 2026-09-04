// import AsyncStorage from '@react-native-async-storage/async-storage';

// const QUEUE_KEY = '@review_queue';
// const KB_KEY = '@knowledge_base';

// export default {
//   async getKB() {
//     try {
//       const raw = await AsyncStorage.getItem(KB_KEY);
//       if (raw) return JSON.parse(raw);
//       const defaultKB = [
//         { keyword: 'zakat', answer: 'Zakat is one of the five pillars of Islam...' },
//         { keyword: 'prayer', answer: 'Prayer (Salah) is the second pillar of Islam...' },
//         { keyword: 'fasting', answer: 'Fasting (Sawm) is observed during Ramadan...' },
//       ];
//       await AsyncStorage.setItem(KB_KEY, JSON.stringify(defaultKB));
//       return defaultKB;
//     } catch (e) {
//       console.error('getKB error:', e);
//       return [];
//     }
//   },

//   async getReviewQueue() {
//     try {
//       const raw = await AsyncStorage.getItem(QUEUE_KEY);
//       return raw ? JSON.parse(raw) : [];
//     } catch (e) {
//       console.error('getReviewQueue error:', e);
//       return [];
//     }
//   },

//   async addToReviewQueue(item) {
//     try {
//       const queue = await this.getReviewQueue();
//       queue.push(item);
//       await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
//     } catch (e) {
//       console.error('addToReviewQueue error:', e);
//       throw e;
//     }
//   },

//   async resolveReviewItem(updatedItem) {
//     try {
//       let queue = await this.getReviewQueue();
//       queue = queue.map((item) =>
//         item.id === updatedItem.id ? updatedItem : item
//       );
//       await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
//     } catch (e) {
//       console.error('resolveReviewItem error:', e);
//       throw e;
//     }
//   },
// };

import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = '@review_queue';
const KB_KEY = '@knowledge_base';

export default {
  // ---- Knowledge Base ----
  async getKB() {
    try {
      const raw = await AsyncStorage.getItem(KB_KEY);
      if (raw) return JSON.parse(raw);
      const defaultKB = [
        { keyword: 'zakat', answer: 'Zakat is one of the five pillars of Islam...' },
        { keyword: 'prayer', answer: 'Prayer (Salah) is the second pillar of Islam...' },
        { keyword: 'fasting', answer: 'Fasting (Sawm) is observed during Ramadan...' },
      ];
      await AsyncStorage.setItem(KB_KEY, JSON.stringify(defaultKB));
      return defaultKB;
    } catch { return []; }
  },

  // ---- Get all items in review queue ----
  async getReviewQueue() {
    try {
      const raw = await AsyncStorage.getItem(QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  },

  // ---- Add a new item to the queue ----
  async addToReviewQueue(item) {
    try {
      const queue = await this.getReviewQueue();
      queue.push(item);
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
      console.log('[localDb] Queue after add:', queue.length);
    } catch (e) {
      console.error('addToReviewQueue error:', e);
      throw e;
    }
  },

  // ---- Update an existing item (approve/reject/comment) ----
  async resolveReviewItem(updatedItem) {
    try {
      let queue = await this.getReviewQueue();
      queue = queue.map((item) =>
        item.id === updatedItem.id ? updatedItem : item
      );
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.error('resolveReviewItem error:', e);
      throw e;
    }
  },
};