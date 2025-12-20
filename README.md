# Smart Timetable Scheduler Management System

A professional timetable management application built for Smart Timetable Scheduler with React, TypeScript, and Firebase.

## 🚀 Features

- **Google Authentication**: Secure sign-in restricted to @email.com domains
- **Subject Management**: Add, edit, and organize academic subjects
- **Faculty Management**: Manage faculty members and their assignments
- **Classroom Management**: Handle classroom resources and availability
- **Timetable Creation**: Create and manage class schedules
- **Professional UI**: Modern, responsive design using Material-UI
- **Real-time Updates**: Live synchronization of schedule changes

## 🛠️ Technology Stack

- **Frontend**: React 18 with TypeScript
- **Authentication**: Firebase Auth with Google provider
- **Database**: Firestore (Firebase)
- **UI Framework**: Material-UI (MUI)
- **Routing**: React Router DOM
- **State Management**: React Context API
- **Build Tool**: Create React App

## 📋 Prerequisites

Before running this application, make sure you have:

- Node.js (version 16 or higher)
- npm or yarn package manager
- Firebase project with authentication enabled
- Google OAuth credentials configured

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd dmart-timetable
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   - Create a Firebase project at https://console.firebase.google.com
   - Enable Authentication and Firestore
   - Add Google as a sign-in provider
   - Copy your Firebase configuration
   - Update `src/firebase.ts` with your Firebase config

4. **Set up Google Authentication**
   - In Firebase Console, go to Authentication > Sign-in method
   - Enable Google provider
   - Add your domain to authorized domains
   - Configure OAuth consent screen in Google Cloud Console

## 🚀 Getting Started

1. **Start the development server**
   ```bash
   npm start
   ```

2. **Open your browser**
   Navigate to `http://localhost:3000`

3. **Sign in**
   Use a Google account with @email.com domain to access the system

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── Login.tsx       # Authentication component
│   ├── Dashboard.tsx   # Main dashboard
│   └── Subjects.tsx    # Subject management
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication context
├── types/             # TypeScript type definitions
│   └── index.ts       # Main type definitions
├── firebase.ts        # Firebase configuration
├── App.tsx           # Main application component
└── index.tsx         # Application entry point
```

## 🔐 Authentication

The application uses Firebase Authentication with Google provider and includes domain restriction:

- Only users with @email.com accounts can sign in
- Domain validation is enforced both client-side and server-side
- Automatic sign-out for unauthorized domains

## 📊 Features Overview

### Dashboard
- Overview of system statistics
- Quick access to all management modules
- Professional UI with Material Design

### Subject Management
- Add/edit/delete subjects
- Color coding for easy identification
- Credit system management
- Search and filter capabilities

### Faculty Management (Coming Soon)
- Faculty profile management
- Subject assignments
- Availability tracking
- Contact information

### Timetable Management (Coming Soon)
- Drag-and-drop schedule builder
- Conflict detection
- Multiple view formats (weekly, daily)
- Export capabilities

## 🔧 Configuration

### Firebase Setup

1. Replace the placeholder configuration in `src/firebase.ts`:

```typescript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

### Environment Variables

Create a `.env` file in the root directory:

```env
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
```

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

## 🧪 Testing

Run the test suite:

```bash
npm test
```

## 📝 Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues or need help:

1. Check the Firebase console for authentication issues
2. Verify your domain restrictions are properly configured
3. Ensure all dependencies are properly installed
4. Check the browser console for error messages

## 🔄 Recent Updates

- ✅ Initial project setup with React + TypeScript
- ✅ Firebase authentication with Google provider
- ✅ Domain restriction implementation (@email.com)
- ✅ Professional UI design with Material-UI
- ✅ Subject management module
- 🔄 Faculty management (in development)
- 🔄 Timetable creation (in development)
- 🔄 Classroom management (in development)

---

**Smart Timetable Scheduler Management System** - Professional academic scheduling made simple.