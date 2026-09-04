# Islamic Chatboard - Web Application Setup & Deployment Guide

## ✅ Current Status

Your Islamic Chatboard is **fully functional** as a web application with all features working:

- ✅ Chatboard messaging interface
- ✅ Local knowledge base and auto-reply generation
- ✅ Scholar Review queue system
- ✅ Multi-account management (create/edit/delete accounts)
- ✅ Admin role-based access control
- ✅ Secure password hashing (SHA256)
- ✅ Persistent local storage (browser localStorage)
- ✅ Fully offline (zero external API dependencies)

## 🚀 Quick Start - Development

### Prerequisites
- Node.js (v14+) and npm installed
- Windows PowerShell or any terminal

### Start the Web Server

```powershell
cd "D:/react chatboard/islamic-chatboard"
npm run web
```

The app will be available at: **http://localhost:8082** (or next available port)

**First Login:**
- Username: `admin`
- Password: `admin123`

### Features to Try

1. **Chatboard Tab** → Ask Islamic questions
2. **Settings Tab** → Manage scholar accounts (admin only), change password
3. **Scholar Review** → Flag responses for review (requires sign-in)

## 📦 Production Build

Build for web deployment (creates optimized static files):

```powershell
npm run web:build
```

Output folder: `dist/` (ready to deploy to any static host)

## 🌐 Deployment Options

### Option 1: Vercel (Recommended)
```powershell
npm install -g vercel
vercel
```

### Option 2: Netlify
1. Install Netlify CLI
2. Run `netlify deploy --prod --dir=dist`

### Option 3: Traditional Web Server
Copy the `dist/` folder contents to your web server root.

## 🔧 Technical Stack

- **Framework**: React Native + Expo Web
- **Storage**: AsyncStorage (web: browser localStorage)
- **Authentication**: SHA256 password hashing with local SecureStore
- **Navigation**: React Navigation (works on web)
- **Styling**: React Native StyleSheet

## 📝 File Structure

```
islamic-chatboard/
├── App.js                          # Entry point & navigation
├── src/
│   ├── components/
│   │   ├── MessageBubble.js       # Chat message UI
│   │   └── MessageInput.js        # Input field
│   ├── screens/
│   │   ├── Chatboard.js           # Main chat interface
│   │   ├── ScholarReview.js       # Review queue admin panel
│   │   ├── Settings.js            # Settings & account management
│   │   ├── SignIn.js              # Login screen
│   │   └── AccountsManagement.js  # Admin account CRUD
│   └── storage/
│       ├── auth.js                # Authentication & secure storage
│       ├── localDb.js             # Message & knowledge base persistence
│       └── secureStorageWeb.js    # Web/mobile storage adapter
├── package.json                    # Dependencies & build scripts
├── app.json                        # Expo configuration
└── README.md                       # User documentation
```

## 🔐 Security Notes

- Passwords are hashed using SHA256 algorithm
- On web: passwords stored in browser localStorage (use HTTPS in production)
- On mobile: passwords stored in secure device storage
- **Important**: This is suitable for trusted environments. For production apps with user data, implement additional security measures (HTTPS, secure headers, server-side validation)

## 🛠️ Development Commands

```powershell
# Start web development server
npm run web

# Build for production web
npm run web:build

# Start on Android emulator
npm start --android

# Start on iOS simulator
npm start --ios

# Install all dependencies
npm install --legacy-peer-deps

# Check for vulnerabilities
npm audit
```

## 🚨 Troubleshooting

### Port Already in Use
If port 8082 is taken, Expo will prompt to use the next available port.

### Missing Dependencies
If you get dependency errors, run:
```powershell
npm install --legacy-peer-deps
```

### Storage Not Persisting
- Web: Check browser's localStorage is enabled
- Clear browser cache if issues persist

### Build Fails
Clear cache and reinstall:
```powershell
rm -r node_modules dist
npm install --legacy-peer-deps
npm run web:build
```

## 📱 Add to Home Screen (PWA)

On mobile browsers, the web app can be installed as a PWA:
1. Open http://localhost:8082 on mobile
2. Tap menu → "Add to Home Screen" (varies by browser)

## 🎓 Next Steps

- Extend the knowledge base in `src/storage/localDb.js` (add more Q&A pairs)
- Customize styling in component files
- Add export/backup functionality for scholar review data
- Integrate with a backend API for multi-device sync (optional)

## ✉️ Support

For issues or questions about the application, review the main README.md or modify the source code as needed.

---

**Happy Chatboarding! 🕌**

