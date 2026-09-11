// import React from 'react';
// import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
// import { flagMessage } from '../storage/localDb';

// export default function MessageBubble({ message, isUser, onFlag, chatId }) {
//   const handleFlag = async () => {
//     if (isUser) {
//       Alert.alert('Info', 'You can only flag bot responses.');
//       return;
//     }
//     Alert.alert(
//       'Flag for Review',
//       'Do you want to flag this response for scholar review?',
//       [
//         { text: 'Cancel', style: 'cancel' },
//         {
//           text: 'Flag',
//           onPress: async () => {
//             try {
//               if (!chatId) {
//                 throw new Error('Chat not found for this message.');
//               }
//               await flagMessage(chatId, message.id);
//               if (onFlag) onFlag(message.id);
//             } catch (error) {
//               Alert.alert('Flag Failed', error.message || 'Unable to flag this message.');
//             }
//           },
//         },
//       ]
//     );
//   };

//   return (
//     <View style={[styles.container, isUser ? styles.userContainer : styles.botContainer]}>
//       <View style={[styles.bubble, isUser ? styles.userBubble : styles.botBubble]}>
//         <Text style={styles.text}>{message.text}</Text>
//         <Text style={styles.timestamp}>{new Date(message.timestamp).toLocaleTimeString()}</Text>
//       </View>
//       {!isUser && message.sender === 'bot' && !message.isFlagged && (
//         <TouchableOpacity onPress={handleFlag} style={styles.flagButton}>
//           <Text style={styles.flagText}>🚩</Text>
//         </TouchableOpacity>
//       )}
//       {!isUser && message.isFlagged && (
//         <Text style={styles.flaggedBadge}>Flagged</Text>
//       )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     marginVertical: 6,
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 12,
//   },
//   userContainer: {
//     justifyContent: 'flex-end',
//   },
//   botContainer: {
//     justifyContent: 'flex-start',
//   },
//   bubble: {
//     maxWidth: '75%',
//     padding: 12,
//     borderRadius: 16,
//   },
//   userBubble: {
//     backgroundColor: '#007AFF',
//     borderBottomRightRadius: 4,
//   },
//   botBubble: {
//     backgroundColor: '#E5E5EA',
//     borderBottomLeftRadius: 4,
//   },
//   text: {
//     fontSize: 16,
//     color: '#000',
//   },
//   userBubble: {
//     color: '#fff',
//   },
//   timestamp: {
//     fontSize: 10,
//     color: '#666',
//     marginTop: 4,
//     alignSelf: 'flex-end',
//   },
//   flagButton: {
//     marginLeft: 8,
//     padding: 4,
//   },
//   flagText: {
//     fontSize: 18,
//   },
//   flaggedBadge: {
//     fontSize: 12,
//     color: '#FF3B30',
//     marginLeft: 8,
//     fontWeight: 'bold',
//   },
// });

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function MessageBubble({ message, onFlag }) {
  const isUser = message.role === 'user';

  return (
    <View style={[styles.bubble, isUser ? styles.userBubble : styles.botBubble]}>
      <Text style={styles.category}>{message.category || 'Islamic Guidance'}</Text>
      <Text style={styles.text}>{message.text}</Text>
      {!isUser && (
        <TouchableOpacity onPress={onFlag} style={styles.flagButton}>
          <Text style={styles.flagText}>🚩 Flag for Review</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
    maxWidth: '80%',
  },
  userBubble: {
    backgroundColor: '#dcf8c6',
    alignSelf: 'flex-end',
  },
  botBubble: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  text: {
    fontSize: 16,
    color: '#333',
  },
  category: {
    color: '#0f6b52',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  flagButton: {
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#ffebee',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  flagText: {
    color: '#d32f2f',
    fontSize: 12,
    fontWeight: '600',
  },
});