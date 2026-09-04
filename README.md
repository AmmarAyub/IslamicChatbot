# Islamic Chatboard (React Native - Expo)

This is a local, offline-first React Native chatboard implemented with Expo. It answers Islamic questions using a local knowledge base and provides a Scholar Review queue for manual review. The app runs on mobile (iOS/Android) and web.

## Quick Start

### Mobile (iOS/Android):

1. Install Expo CLI globally if you don't have it:

```
npm install -g expo-cli
```

2. Install dependencies in the project folder:

```
cd "D:/react chatboard/islamic-chatboard"
npm install --legacy-peer-deps
```

3. Start the app on mobile:

```
npm start
```

Then open on a phone with the Expo Go app or run an emulator:
```
expo start --android
expo start --ios
```

### Web Application:

Start the web version:

```
npm run web
```

This will open the app in your default browser at `http://localhost:8082` (or next available port). The web app runs in development mode with hot reload support.

To build for production web deployment:

```
npm run web:build
```

## Features

- **Chatboard**: Ask Islamic questions and get replies from a local knowledge base
- **Scholar Review**: Flag responses for scholar review and comment
- **Multi-account Support**: Manage multiple scholar accounts with roles (scholar/admin)
- **Secure Storage**: Passwords are hashed and stored securely (SecureStore on mobile, localStorage on web)
- **Offline**: All data stored locally; no external APIs used
- **Web Compatible**: Works on web browsers and mobile devices

## Default Admin Account

- username: `admin`
- password: `admin123`

After first login, you can create additional scholar accounts and change passwords in Settings.

## Notes

- No external APIs are used; all data is stored in AsyncStorage (browser storage on web).
- The Scholar Review screen shows flagged messages and allows scholars to add comments or approve.
- To extend the knowledge base, modify the default KB in `src/storage/localDb.js`.
- On web, passwords are stored in localStorage (use in trusted environments only).



