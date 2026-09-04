// import React from 'react';
// import { NavigationContainer } from '@react-navigation/native';
// import { createNativeStackNavigator } from '@react-navigation/native-stack';
// import Chatboard from './src/screens/Chatboard';
// import ScholarReview from './src/screens/ScholarReview';
// import Settings from './src/screens/Settings';
// import SignIn from './src/screens/SignIn';
// import SignUp from './src/screens/SignUp';
// import AccountsManagement from './src/screens/AccountsManagement';

// const Stack = createNativeStackNavigator();

// export default function App() {
//   return (
//     <NavigationContainer>
//       <Stack.Navigator initialRouteName="SignIn" screenOptions={{ headerShown: true }}>
//         <Stack.Screen name="Chatboard" component={Chatboard} options={{ title: 'Islamic Chatboard' }} />
//         <Stack.Screen name="ScholarReview" component={ScholarReview} options={{ title: 'Scholar Review Queue' }} />
//         <Stack.Screen name="Settings" component={Settings} options={{ title: 'Settings' }} />
//         <Stack.Screen name="SignIn" component={SignIn} options={{ title: 'Sign In', headerShown: false }} />
//         <Stack.Screen name="SignUp" component={SignUp} options={{ title: 'Create Account', headerBackVisible: true }} />
//         <Stack.Screen name="AccountsManagement" component={AccountsManagement} options={{ title: 'Manage Accounts' }} />
//       </Stack.Navigator>
//     </NavigationContainer>
//   );
// }


// App.js
// import React from 'react';
// import { NavigationContainer } from '@react-navigation/native';
// import { createNativeStackNavigator } from '@react-navigation/native-stack';
// import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// import { Ionicons } from '@expo/vector-icons'; // optional, you can use any icon set

// import Chatboard from './src/screens/Chatboard';
// import ScholarReview from './src/screens/ScholarReview';
// import Settings from './src/screens/Settings';
// import SignIn from './src/screens/SignIn';
// import SignUp from './src/screens/SignUp';
// import AccountsManagement from './src/screens/AccountsManagement';
// import Dashboard from './src/screens/Dashboard';

// import { getCurrentUser } from './src/storage/auth';

// const Stack = createNativeStackNavigator();
// const Tab = createBottomTabNavigator();

// // Main Tab Navigator (shown after login)
// function MainTabs() {
//   const [userRole, setUserRole] = React.useState('user');
//   React.useEffect(() => {
//     getCurrentUser().then(user => {
//       if (user) setUserRole(user.role);
//     });
//   }, []);

//   return (
//     <Tab.Navigator
//       screenOptions={({ route }) => ({
//         tabBarIcon: ({ focused, color, size }) => {
//           let iconName;
//           if (route.name === 'Dashboard') {
//             iconName = focused ? 'home' : 'home-outline';
//           } else if (route.name === 'Chatboard') {
//             iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
//           } else if (route.name === 'ScholarReview') {
//             iconName = focused ? 'flag' : 'flag-outline';
//           } else if (route.name === 'Settings') {
//             iconName = focused ? 'settings' : 'settings-outline';
//           }
//           return <Ionicons name={iconName} size={size} color={color} />;
//         },
//         tabBarActiveTintColor: '#007AFF',
//         tabBarInactiveTintColor: 'gray',
//       })}
//     >
//       <Tab.Screen name="Dashboard" component={Dashboard} options={{ title: 'Home' }} />
//       <Tab.Screen name="Chatboard" component={Chatboard} options={{ title: 'Chat' }} />
//       {userRole === 'admin' && (
//         <Tab.Screen name="ScholarReview" component={ScholarReview} options={{ title: 'Review' }} />
//       )}
//       <Tab.Screen name="Settings" component={Settings} options={{ title: 'Settings' }} />
//     </Tab.Navigator>
//   );
// }

// // Main App Navigator
// export default function App() {
//   return (
//     <NavigationContainer>
//       <Stack.Navigator initialRouteName="SignIn" screenOptions={{ headerShown: false }}>
//         <Stack.Screen name="SignIn" component={SignIn} />
//         <Stack.Screen name="SignUp" component={SignUp} options={{ headerShown: true, title: 'Create Account' }} />
//         <Stack.Screen name="Main" component={MainTabs} />
//         <Stack.Screen name="AccountsManagement" component={AccountsManagement} options={{ headerShown: true, title: 'Manage Accounts' }} />
//       </Stack.Navigator>
//     </NavigationContainer>
//   );
// }

// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const originalWarn = console.warn;
console.warn = (...args) => {
  const message = args
    .map((arg) => (typeof arg === 'string' ? arg : String(arg)))
    .join(' ');

  if (message.includes('setNativeProps is deprecated. Please update props using React state instead.')) {
    return;
  }

  originalWarn(...args);
};

import ChatList from './src/screens/ChatList';
import Chatboard from './src/screens/Chatboard';
import ScholarReview from './src/screens/ScholarReview';
import Settings from './src/screens/Settings';
import SignIn from './src/screens/SignIn';
import SignUp from './src/screens/SignUp';
import AccountsManagement from './src/screens/AccountsManagement';
import Dashboard from './src/screens/Dashboard';
import { getCurrentUser } from './src/storage/auth';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Chat Stack Navigator (list + room)
function ChatStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      <Stack.Screen name="ChatList" component={ChatList} options={{ title: 'Chats' }} />
      <Stack.Screen name="ChatRoom" component={Chatboard} options={{ title: 'Chat' }} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  const [userRole, setUserRole] = React.useState('user');
  React.useEffect(() => {
    getCurrentUser().then(user => {
      if (user) setUserRole(user.role);
    });
  }, []);

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
      }}
    >
      <Tab.Screen name="Dashboard" component={Dashboard} options={{ title: 'Home' }} />
      <Tab.Screen name="Chat" component={ChatStack} options={{ title: 'Chat' }} />
      {userRole === 'admin' && (
        <Tab.Screen name="ScholarReview" component={ScholarReview} options={{ title: 'Review' }} />
      )}
      <Tab.Screen name="Settings" component={Settings} options={{ title: 'Settings' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="SignIn" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="SignIn" component={SignIn} />
        <Stack.Screen name="SignUp" component={SignUp} options={{ headerShown: true, title: 'Create Account' }} />
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="AccountsManagement" component={AccountsManagement} options={{ headerShown: true, title: 'Manage Accounts' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}