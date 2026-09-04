// src/storage/chatStorage.js
import storage from './secureStorageWeb';

const CHATS_KEY = '@chatboard_chats';

// Structure: { chatId: { id, title, createdAt, messages: [] } }

export async function getChats() {
  const data = await storage.getItem(CHATS_KEY);
  return data ? JSON.parse(data) : {};
}

export async function saveChats(chats) {
  await storage.setItem(CHATS_KEY, JSON.stringify(chats));
}

export async function createChat(title) {
  const chats = await getChats();
  const id = Date.now().toString();
  const newChat = {
    id,
    title: title || `Chat ${Object.keys(chats).length + 1}`,
    createdAt: new Date().toISOString(),
    messages: [],
  };
  chats[id] = newChat;
  await saveChats(chats);
  return newChat;
}

export async function getChat(chatId) {
  const chats = await getChats();
  return chats[chatId] || null;
}

export async function addMessageToChat(chatId, message) {
  const chats = await getChats();
  const chat = chats[chatId];
  if (!chat) throw new Error('Chat not found');
  chat.messages.push(message);
  await saveChats(chats);
  return chat;
}

export async function updateMessageInChat(chatId, updatedMsg) {
  const chats = await getChats();
  const chat = chats[chatId];
  if (!chat) throw new Error('Chat not found');
  const index = chat.messages.findIndex(m => m.id === updatedMsg.id);
  if (index !== -1) {
    chat.messages[index] = updatedMsg;
    await saveChats(chats);
  }
  return chat;
}

export async function deleteChat(chatId) {
  const chats = await getChats();
  delete chats[chatId];
  await saveChats(chats);
}

export async function deleteAllChats() {
  await storage.removeItem(CHATS_KEY);
}

export async function getAllMessages() {
  const chats = await getChats();
  let all = [];
  for (const id in chats) {
    all = all.concat(chats[id].messages);
  }
  return all;
}