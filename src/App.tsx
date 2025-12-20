import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeModeProvider, useThemeMode } from './contexts/ThemeContext';
import { CircularProgress, Box } from '@mui/material';
import ErrorBoundary from './components/ErrorBoundary';

// Simple loading component
const SimpleLoading = () => {
  const { theme } = useThemeMode();
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: theme.palette.background.default,
      color: theme.palette.text.primary
    }}>
      <div>Loading...</div>
    </div>
  );
};

// Optimized lazy loading with faster imports
const Login = lazy(() => import(/* webpackChunkName: "login" */ './components/Login'));
const Dashboard = lazy(() => import(/* webpackChunkName: "dashboard" */ './components/Dashboard'));

const AppContent: React.FC = () => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        flexDirection="column"
        gap={1}
      >
        <CircularProgress size={40} thickness={3} />
        <div style={{fontSize: '14px', opacity: 0.7}}>Loading...</div>
      </Box>
    );
  }

  return (
    <Suspense fallback={<SimpleLoading />}>
      {currentUser ? <Dashboard /> : <Login />}
    </Suspense>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <ThemeModeProvider>
            <AppContent />
          </ThemeModeProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
};

export default App;