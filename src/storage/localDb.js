import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = '@review_queue';
const KB_KEY = '@knowledge_base';
const MESSAGES_KEY = '@messages';
const CHATS_KEY = '@chats';

export default {
  // ---------- Knowledge Base ----------
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

  // ---------- Review Queue ----------
  async getReviewQueue(ownerId) {
    try {
      const raw = await AsyncStorage.getItem(QUEUE_KEY);
      const queue = raw ? JSON.parse(raw) : [];
      return ownerId ? queue.filter(item => item.ownerId === ownerId) : queue;
    } catch { return []; }
  },

  async addToReviewQueue(item) {
    try {
      const queue = await this.getReviewQueue();
      queue.push(item);
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.error('addToReviewQueue error:', e);
      throw e;
    }
  },

  async resolveReviewItem(updatedItem) {
    try {
      let queue = await this.getReviewQueue();
      queue = queue.map(item => item.id === updatedItem.id ? updatedItem : item);
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.error('resolveReviewItem error:', e);
      throw e;
    }
  },

  // ---------- Messages ----------
  async getMessages(ownerId) {
    try {
      const raw = await AsyncStorage.getItem(MESSAGES_KEY);
      const messages = raw ? JSON.parse(raw) : [];
      return ownerId ? messages.filter(message => message.ownerId === ownerId) : messages;
    } catch { return []; }
  },

  async addMessage(message) {
    try {
      const messages = await this.getMessages();
      messages.push({ ...message, ownerId: message.ownerId || 'unknown' });
      await AsyncStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
      return message;
    } catch (e) {
      console.error('addMessage error:', e);
      throw e;
    }
  },

  async deleteMessagesForConversation(ownerId, conversationId) {
    try {
      const messages = await this.getMessages();
      const remaining = messages.filter(message => (
        !(message.ownerId === ownerId && message.conversationId === conversationId)
      ));
      await AsyncStorage.setItem(MESSAGES_KEY, JSON.stringify(remaining));
    } catch (e) {
      console.error('deleteMessagesForConversation error:', e);
      throw e;
    }
  },

  async updateMessage(updatedMessage) {
    try {
      let messages = await this.getMessages();
      messages = messages.map(msg => msg.id === updatedMessage.id ? updatedMessage : msg);
      await AsyncStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
    } catch (e) {
      console.error('updateMessage error:', e);
      throw e;
    }
  },

  async flagMessage(messageId, isFlagged = true) {
    try {
      let messages = await this.getMessages();
      messages = messages.map(msg => {
        if (msg.id === messageId) {
          return { ...msg, isFlagged };
        }
        return msg;
      });
      await AsyncStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
    } catch (e) {
      console.error('flagMessage error:', e);
      throw e;
    }
  },

  async getFlaggedMessages() {
    try {
      const messages = await this.getMessages();
      return messages.filter(msg => msg.isFlagged === true);
    } catch { return []; }
  },

  async getTotalMessages() {
    try {
      const messages = await this.getMessages();
      return messages.length;
    } catch { return 0; }
  },

  // ---------- Chats (optional) ----------
  async getChats() {
    try {
      const raw = await AsyncStorage.getItem(CHATS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  },

  async saveChats(chats) {
    try {
      await AsyncStorage.setItem(CHATS_KEY, JSON.stringify(chats));
    } catch (e) {
      console.error('saveChats error:', e);
      throw e;
    }
  },
};