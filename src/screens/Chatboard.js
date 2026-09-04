// import React, { useEffect, useState } from 'react';
// import {
//   View,
//   Text,
//   FlatList,
//   Alert,
//   TouchableOpacity,
//   StyleSheet,
//   ActivityIndicator,
// } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import MessageBubble from '../components/MessageBubble';
// import MessageInput from '../components/MessageInput';
// import localDb from '../storage/localDb';
// import auth from '../storage/auth';
// import aiConfig from '../storage/aiConfig';

// const CONVERSATIONS_KEY = '@chatboard_conversations';

// export default function Chatboard({ navigation }) {
//   const [loading, setLoading] = useState(true);
//   const [messages, setMessages] = useState([]);
//   const [currentUser, setCurrentUser] = useState(null);
//   const [aiSettings, setAiSettings] = useState({ apiKey: '', model: 'gemini-1.5-flash' });
//   const [conversations, setConversations] = useState([]);
//   const [activeConversationId, setActiveConversationId] = useState(null);

//   useEffect(() => {
//     const init = async () => {
//       try {
//         await Promise.all([loadConversations(), loadAiSettings(), loadCurrentUser()]);
//       } catch (e) {
//         console.error(e);
//         Alert.alert('Error', 'Failed to load data.');
//       } finally {
//         setLoading(false);
//       }
//     };
//     init();
//   }, []);

//   const loadAiSettings = async () => {
//     try {
//       const config = await aiConfig.getAiConfig();
//       setAiSettings(config);
//     } catch (e) {
//       console.error(e);
//     }
//   };

//   const loadCurrentUser = async () => {
//     try {
//       const user = await auth.getCurrentUser();
//       setCurrentUser(user);
//     } catch (e) {
//       console.error(e);
//     }
//   };

//   const loadConversations = async () => {
//     try {
//       const stored = await AsyncStorage.getItem(CONVERSATIONS_KEY);
//       if (stored) {
//         const parsed = JSON.parse(stored);
//         if (parsed.length > 0) {
//           setConversations(parsed);
//           setActiveConversationId(parsed[0].id);
//           setMessages(parsed[0].messages || []);
//           return;
//         }
//       }
//       const defaultConv = { id: `conv-${Date.now()}`, title: 'Conversation 1', messages: [] };
//       setConversations([defaultConv]);
//       setActiveConversationId(defaultConv.id);
//       setMessages([]);
//       await saveConversations([defaultConv]);
//     } catch (e) {
//       console.error(e);
//     }
//   };

//   const saveConversations = async (convs) => {
//     try {
//       await AsyncStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(convs));
//     } catch (e) {
//       console.error(e);
//     }
//   };

//   const switchConversation = (id) => {
//     const selected = conversations.find((c) => c.id === id);
//     if (selected) {
//       setActiveConversationId(id);
//       setMessages(selected.messages || []);
//     }
//   };

//   const createNewConversation = () => {
//     const newId = `conv-${Date.now()}`;
//     const newConv = {
//       id: newId,
//       title: `Conversation ${conversations.length + 1}`,
//       messages: [],
//     };
//     const updated = [...conversations, newConv];
//     setConversations(updated);
//     setActiveConversationId(newId);
//     setMessages([]);
//     saveConversations(updated);
//   };

//   const updateActiveConversation = async (newMessages) => {
//     const updated = conversations.map((conv) =>
//       conv.id === activeConversationId ? { ...conv, messages: newMessages } : conv
//     );
//     setConversations(updated);
//     setMessages(newMessages);
//     await saveConversations(updated);
//   };

//   const sendMessage = async (text) => {
//     if (!text.trim()) return;
//     const userMsg = { id: Date.now().toString(), role: 'user', text: text.trim() };
//     const updatedWithUser = [...messages, userMsg];
//     await updateActiveConversation(updatedWithUser);

//     try {
//       const reply = await generateReply(text);
//       const botMsg = {
//         id: (Date.now() + 1).toString(),
//         role: 'bot',
//         text: reply,
//         reviewed: false,
//       };
//       const updatedWithBot = [...updatedWithUser, botMsg];
//       await updateActiveConversation(updatedWithBot);
//     } catch (e) {
//       console.error(e);
//       Alert.alert('Error', 'Unable to get a response.');
//     }
//   };

//   const generateReply = async (text) => {
//     if (aiSettings.apiKey) {
//       try {
//         const url = `https://generativelanguage.googleapis.com/v1beta/models/${aiSettings.model}:generateContent`;
//         const response = await fetch(url, {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//             'x-goog-api-key': aiSettings.apiKey,
//           },
//           body: JSON.stringify({
//             contents: [{ parts: [{ text: `Answer this Islamic query clearly and respectfully:\n\n${text}` }] }],
//           }),
//         });
//         const data = await response.json();
//         if (!response.ok) throw new Error(data.error?.message || 'Gemini failed');
//         const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text;
//         if (answer) return answer.trim();
//       } catch (e) {
//         console.error('Gemini error:', e);
//       }
//     }

//     try {
//       const kb = await localDb.getKB();
//       const query = text.toLowerCase();
//       for (const item of kb) {
//         if (query.includes(item.keyword.toLowerCase())) return item.answer;
//       }
//       return 'Thank you for your question. Here is a general Islamic perspective: Please consult the Quran and Sunnah. If you need detailed scholarly guidance, flag this response for a scholar review.';
//     } catch (e) {
//       console.error(e);
//       return 'Unable to generate reply. Please try again.';
//     }
//   };

//   // ---------- FLAG FOR REVIEW (fully working) ----------
//   const flagForReview = async (message) => {
//     try {
//       // 1. Check sign-in
//       const signed = await auth.isSignedIn();
//       if (!signed) {
//         Alert.alert('Sign in required', 'Please sign in to flag messages for review.');
//         navigation.navigate('SignIn', { redirect: 'ScholarReview' });
//         return;
//       }

//       // 2. Check if already flagged
//       const queue = await localDb.getReviewQueue();
//       if (queue.some((item) => item.id === message.id)) {
//         Alert.alert('Already flagged', 'This message is already in the review queue.');
//         return;
//       }

//       // 3. Add to queue with status 'pending'
//       await localDb.addToReviewQueue({
//         ...message,
//         flaggedAt: Date.now(),
//         status: 'pending',   // important for filtering
//         reviewed: false,
//       });

//       console.log('[Flag] Message added to queue:', message.id);

//       // 4. Navigate to ScholarReview
//       Alert.alert('Flagged', 'Message added to the scholar review queue.');
//       navigation.navigate('ScholarReview');
//     } catch (e) {
//       console.error('Error flagging for review:', e);
//       Alert.alert('Error', 'Unable to flag message for review.');
//     }
//   };

//   if (loading) {
//     return (
//       <View style={[styles.container, styles.centered]}>
//         <ActivityIndicator size="large" color="#1f3c88" />
//         <Text style={{ marginTop: 12 }}>Loading...</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       {/* Top Bar */}
//       <View style={styles.topbar}>
//         <Text style={styles.brand}>Islamic Chatboard</Text>
//         <View style={styles.topbarActions}>
//           <TouchableOpacity style={styles.topbarButton} onPress={() => navigation.navigate('Chatboard')}>
//             <Text style={styles.topbarButtonText}>Chat</Text>
//           </TouchableOpacity>
//           <TouchableOpacity
//             style={styles.topbarButton}
//             onPress={async () => {
//               const signed = await auth.isSignedIn();
//               signed ? navigation.navigate('ScholarReview') : navigation.navigate('SignIn', { redirect: 'ScholarReview' });
//             }}
//           >
//             <Text style={styles.topbarButtonText}>Scholar Review</Text>
//           </TouchableOpacity>
//           <TouchableOpacity style={styles.topbarButton} onPress={() => navigation.navigate('Settings')}>
//             <Text style={styles.topbarButtonText}>Settings</Text>
//           </TouchableOpacity>
//           {currentUser && <Text style={styles.userBadge}>User: {currentUser}</Text>}
//         </View>
//       </View>

//       {/* Main Content */}
//       <View style={styles.contentArea}>
//         <View style={styles.sidebar}>
//           <TouchableOpacity style={styles.newConversationButton} onPress={createNewConversation}>
//             <Text style={styles.newConversationText}>+ New Conversation</Text>
//           </TouchableOpacity>
//           <FlatList
//             data={conversations}
//             keyExtractor={(item) => item.id}
//             renderItem={({ item }) => (
//               <TouchableOpacity
//                 style={[styles.sidebarItem, item.id === activeConversationId && styles.sidebarItemActive]}
//                 onPress={() => switchConversation(item.id)}
//               >
//                 <Text style={styles.sidebarItemText} numberOfLines={1}>
//                   {item.title}
//                 </Text>
//               </TouchableOpacity>
//             )}
//           />
//         </View>

//         <View style={styles.mainPanel}>
//           <FlatList
//             data={messages}
//             keyExtractor={(item) => item.id}
//             renderItem={({ item }) => (
//               <MessageBubble message={item} onFlag={() => flagForReview(item)} />
//             )}
//             contentContainerStyle={styles.messageList}
//           />
//           <MessageInput onSend={sendMessage} />
//         </View>
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#f5f5f5' },
//   centered: { justifyContent: 'center', alignItems: 'center' },
//   topbar: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     backgroundColor: '#fff',
//     borderBottomWidth: 1,
//     borderBottomColor: '#e3e3e3',
//   },
//   brand: { fontSize: 18, fontWeight: '700', color: '#1f3c88' },
//   topbarActions: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
//   topbarButton: {
//     marginHorizontal: 6,
//     paddingHorizontal: 10,
//     paddingVertical: 6,
//     borderRadius: 6,
//     backgroundColor: '#eef3ff',
//   },
//   topbarButtonText: { color: '#1f3c88', fontWeight: '600' },
//   userBadge: { marginLeft: 8, color: '#555', fontSize: 12 },
//   contentArea: { flex: 1, flexDirection: 'row' },
//   sidebar: {
//     width: 220,
//     backgroundColor: '#f7f9fc',
//     borderRightWidth: 1,
//     borderRightColor: '#e3e3e3',
//     padding: 12,
//   },
//   newConversationButton: {
//     backgroundColor: '#1f3c88',
//     paddingVertical: 10,
//     borderRadius: 8,
//     alignItems: 'center',
//     marginBottom: 10,
//   },
//   newConversationText: { color: '#fff', fontWeight: '600' },
//   sidebarItem: { paddingVertical: 10, paddingHorizontal: 8, borderRadius: 8, marginBottom: 6 },
//   sidebarItemActive: { backgroundColor: '#dfe9ff' },
//   sidebarItemText: { color: '#1a1a1a', fontWeight: '500' },
//   mainPanel: { flex: 1, backgroundColor: '#f5f5f5' },
//   messageList: { padding: 12, flexGrow: 1 },
// });

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Alert,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MessageBubble from '../components/MessageBubble';
import MessageInput from '../components/MessageInput';
import localDb from '../storage/localDb';
import auth from '../storage/auth';
import aiConfig from '../storage/aiConfig';

const CONVERSATIONS_KEY = '@chatboard_conversations';

export default function Chatboard({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [aiSettings, setAiSettings] = useState({ apiKey: '', model: 'gemini-1.5-flash' });
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        await Promise.all([loadConversations(), loadAiSettings(), loadCurrentUser()]);
      } catch (e) {
        console.error(e);
        Alert.alert('Error', 'Failed to load data.');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const loadAiSettings = async () => {
    try {
      const config = await aiConfig.getAiConfig();
      setAiSettings(config);
      console.log('[AI Config] Loaded:', config.apiKey ? 'Key present' : 'No key');
    } catch (e) { console.error(e); }
  };

  const loadCurrentUser = async () => {
    try {
      const user = await auth.getCurrentUser();
      setCurrentUser(user);
    } catch (e) { console.error(e); }
  };

  const loadConversations = async () => {
    try {
      const stored = await AsyncStorage.getItem(CONVERSATIONS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.length > 0) {
          setConversations(parsed);
          setActiveConversationId(parsed[0].id);
          setMessages(parsed[0].messages || []);
          return;
        }
      }
      const defaultConv = { id: `conv-${Date.now()}`, title: 'Conversation 1', messages: [] };
      setConversations([defaultConv]);
      setActiveConversationId(defaultConv.id);
      setMessages([]);
      await saveConversations([defaultConv]);
    } catch (e) { console.error(e); }
  };

  const saveConversations = async (convs) => {
    try {
      await AsyncStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(convs));
    } catch (e) { console.error(e); }
  };

  const switchConversation = (id) => {
    const selected = conversations.find((c) => c.id === id);
    if (selected) {
      setActiveConversationId(id);
      setMessages(selected.messages || []);
    }
  };

  const createNewConversation = () => {
    const newId = `conv-${Date.now()}`;
    const newConv = {
      id: newId,
      title: `Conversation ${conversations.length + 1}`,
      messages: [],
    };
    const updated = [...conversations, newConv];
    setConversations(updated);
    setActiveConversationId(newId);
    setMessages([]);
    saveConversations(updated);
  };

  const updateActiveConversation = async (newMessages) => {
    const updated = conversations.map((conv) =>
      conv.id === activeConversationId ? { ...conv, messages: newMessages } : conv
    );
    setConversations(updated);
    setMessages(newMessages);
    await saveConversations(updated);
  };

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    const userMsg = { id: Date.now().toString(), role: 'user', text: text.trim() };
    const updatedWithUser = [...messages, userMsg];
    await updateActiveConversation(updatedWithUser);

    try {
      const reply = await generateReply(text);
      const botMsg = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        text: reply,
        reviewed: false,
      };
      const updatedWithBot = [...updatedWithUser, botMsg];
      await updateActiveConversation(updatedWithBot);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Unable to get a response.');
    }
  };

  // ---------- IMPROVED GENERATE REPLY ----------
   const generateReply = async (text) => {
    if (aiSettings.apiKey) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${aiSettings.model}:generateContent`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': aiSettings.apiKey,
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `Answer this Islamic query clearly and respectfully:\n\n${text}` }] }],
          }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || 'Gemini failed');
        const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (answer) return answer.trim();
      } catch (e) {
        console.error('Gemini error:', e);
      }
    }

    try {
      const kb = await localDb.getKB();
      const query = text.toLowerCase();
      for (const item of kb) {
        if (query.includes(item.keyword.toLowerCase())) return item.answer;
      }
      return 'Thank you for your question. Here is a general Islamic perspective: Please consult the Quran and Sunnah. If you need detailed scholarly guidance, flag this response for a scholar review.';
    } catch (e) {
      console.error(e);
      return 'Unable to generate reply. Please try again.';
    }
  };


  // ---------- FLAG FOR REVIEW – NO SIGN‑IN REQUIRED ----------
  const flagForReview = async (message) => {
    try {
      const queue = await localDb.getReviewQueue();
      if (queue.some((item) => item.id === message.id)) {
        Alert.alert('Already flagged', 'This message is already in the review queue.');
        return;
      }

      const itemToAdd = {
        ...message,
        flaggedAt: Date.now(),
        status: 'pending',
        reviewed: false,
      };
      await localDb.addToReviewQueue(itemToAdd);
      console.log('[Flag] Added to queue:', itemToAdd);
      Alert.alert('Flagged', 'Message added to the scholar review queue.');
      navigation.navigate('ScholarReview');
    } catch (e) {
      console.error('[Flag] Error:', e);
      Alert.alert('Error', 'Unable to flag message for review.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#1f3c88" />
        <Text style={{ marginTop: 12 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topbar}>
        <Text style={styles.brand}>Islamic Chatboard</Text>
        <View style={styles.topbarActions}>
          <TouchableOpacity style={styles.topbarButton} onPress={() => navigation.navigate('Chatboard')}>
            <Text style={styles.topbarButtonText}>Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.topbarButton}
            onPress={async () => {
              const signed = await auth.isSignedIn();
              signed ? navigation.navigate('ScholarReview') : navigation.navigate('SignIn', { redirect: 'ScholarReview' });
            }}
          >
            <Text style={styles.topbarButtonText}>Scholar Review</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.topbarButton} onPress={() => navigation.navigate('Settings')}>
            <Text style={styles.topbarButtonText}>Settings</Text>
          </TouchableOpacity>
          {currentUser && <Text style={styles.userBadge}>User: {currentUser}</Text>}
        </View>
      </View>

      <View style={styles.contentArea}>
        <View style={styles.sidebar}>
          <TouchableOpacity style={styles.newConversationButton} onPress={createNewConversation}>
            <Text style={styles.newConversationText}>+ New Conversation</Text>
          </TouchableOpacity>
          <FlatList
            data={conversations}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.sidebarItem, item.id === activeConversationId && styles.sidebarItemActive]}
                onPress={() => switchConversation(item.id)}
              >
                <Text style={styles.sidebarItemText} numberOfLines={1}>
                  {item.title}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>

        <View style={styles.mainPanel}>
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <MessageBubble message={item} onFlag={() => flagForReview(item)} />
            )}
            contentContainerStyle={styles.messageList}
          />
          <MessageInput onSend={sendMessage} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e3e3e3',
  },
  brand: { fontSize: 18, fontWeight: '700', color: '#1f3c88' },
  topbarActions: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  topbarButton: {
    marginHorizontal: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#eef3ff',
  },
  topbarButtonText: { color: '#1f3c88', fontWeight: '600' },
  userBadge: { marginLeft: 8, color: '#555', fontSize: 12 },
  contentArea: { flex: 1, flexDirection: 'row' },
  sidebar: {
    width: 220,
    backgroundColor: '#f7f9fc',
    borderRightWidth: 1,
    borderRightColor: '#e3e3e3',
    padding: 12,
  },
  newConversationButton: {
    backgroundColor: '#1f3c88',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  newConversationText: { color: '#fff', fontWeight: '600' },
  sidebarItem: { paddingVertical: 10, paddingHorizontal: 8, borderRadius: 8, marginBottom: 6 },
  sidebarItemActive: { backgroundColor: '#dfe9ff' },
  sidebarItemText: { color: '#1a1a1a', fontWeight: '500' },
  mainPanel: { flex: 1, backgroundColor: '#f5f5f5' },
  messageList: { padding: 12, flexGrow: 1 },
});