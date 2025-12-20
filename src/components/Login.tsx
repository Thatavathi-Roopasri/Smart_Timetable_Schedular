import React, { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Typography,
  Button,
  Box,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  TextField,
  Tabs,
  Tab,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Google as GoogleIcon,
  Email,
  Lock,
  Person,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useThemeMode } from '../contexts/ThemeContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

const Login: React.FC = () => {
  const { signInWithGoogle, signInWithEmail, createAccount } = useAuth();
  const { isDarkMode } = useThemeMode();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  // Inline styles for animated button
  const animatedButtonStyles = {
    position: 'relative' as const,
    overflow: 'hidden',
    border: '1px solid #18181a',
    color: '#18181a',
    display: 'inline-block',
    fontSize: '15px',
    lineHeight: '15px',
    padding: '18px 18px 17px',
    textDecoration: 'none',
    cursor: 'pointer',
    background: '#fff',
    userSelect: 'none' as const,
    WebkitUserSelect: 'none' as const,
    touchAction: 'manipulation',
    width: '100%',
    textTransform: 'none' as const,
    fontWeight: 'bold',
    marginTop: '16px',
    marginBottom: '8px',
    '&:hover::after': {
      transformOrigin: 'bottom center',
      transform: 'skewY(9.3deg) scaleY(2)',
    },
    '&:hover .button-text-alternate': {
      transform: 'translateX(-50%) translateY(-50%)',
      opacity: 1,
      transition: 'all 900ms cubic-bezier(0.48, 0, 0.12, 1)',
    },
    '&::after': {
      content: '""',
      position: 'absolute',
      bottom: '-50%',
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'black',
      transformOrigin: 'bottom center',
      transition: 'transform 600ms cubic-bezier(0.48, 0, 0.12, 1)',
      transform: 'skewY(9.3deg) scaleY(0)',
      zIndex: 50,
    },
  };

  const buttonTextStyles = {
    position: 'relative' as const,
    transition: 'color 600ms cubic-bezier(0.48, 0, 0.12, 1)',
    zIndex: 10,
  };

  const buttonTextAlternateStyles = {
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute' as const,
    transition: 'all 500ms cubic-bezier(0.48, 0, 0.12, 1)',
    zIndex: 100,
    opacity: 0,
    top: '50%',
    left: '50%',
    transform: 'translateY(200%) translateX(-50%)',
    width: '100%',
    textAlign: 'center' as const,
  };
  
  // Slideshow state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = useMemo(() => ['/pic1.jpg', '/pic2.jpg', '/pic3.jpeg', '/pic4.webp'], []); // Images from pictures folder rotating
  
  // Preload images for smooth transitions
  useEffect(() => {
    images.forEach((imageSrc) => {
      const img = new Image();
      img.src = imageSrc;
    });
  }, [images]);
  
  // Auto-rotate images every 4 seconds for smoother experience
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 4000); // 4 seconds for more graceful transitions
    
    return () => clearInterval(interval);
  }, [images.length]);

  // Sign In Form State
  const [signInData, setSignInData] = useState({
    email: '',
    password: '',
  });

  // Sign Up Form State
  const [signUpData, setSignUpData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setError('');
  };

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setLoading(true);
      await signInWithGoogle();
    } catch (error: any) {
      setError(error.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInData.email || !signInData.password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setError('');
      setLoading(true);
      await signInWithEmail(signInData.email, signInData.password);
    } catch (error: any) {
      setError(error.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpData.name || !signUpData.email || !signUpData.password || !signUpData.confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (signUpData.password !== signUpData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (signUpData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setError('');
      setLoading(true);
      await createAccount(signUpData.email, signUpData.password, signUpData.name);
    } catch (error: any) {
      setError(error.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
      }}
    >
      {/* Left hero image with smooth crossfade */}
      <Box
        sx={{
          flex: { xs: '0 0 50%', md: '0 0 70%' }, // 70% for images!
          minHeight: { xs: 180, md: '100vh' },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background images with smooth crossfade */}
        {images.map((image, index) => (
          <Box
            key={index}
            sx={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url("${image}")`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              opacity: currentImageIndex === index ? 1 : 0,
              transition: 'opacity 2.5s cubic-bezier(0.4, 0.0, 0.2, 1)',
              zIndex: currentImageIndex === index ? 2 : 1,
            }}
          />
        ))}
        
        {/* Overlay gradient */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: isDarkMode 
              ? 'linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.6) 100%)'
              : 'linear-gradient(135deg, rgba(15,23,42,0.2) 0%, rgba(15,23,42,0.4) 100%)',
            zIndex: 3,
          }}
        />
      </Box>

      {/* Right auth panel */}
      <Box
        sx={{
          flex: '1 1 30%', // 30% for sign-in panel - perfect fit!
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: isDarkMode
            ? 'linear-gradient(135deg, rgba(18,18,18,1) 0%, rgba(30,30,30,1) 50%, rgba(40,40,40,1) 100%)'
            : 'linear-gradient(135deg, rgba(245,247,250,1) 0%, rgba(248,249,252,1) 50%, rgba(255,255,255,1) 100%)',
          px: { xs: 1, md: 2 }, // Much less padding to reduce white waste
          py: { xs: 4, md: 0 },
        }}
      >
        <Container maxWidth="lg" sx={{ width: '100%', maxWidth: '600px !important' }}>
          <Card
            elevation={12}
            sx={{
              borderRadius: 4,
              overflow: 'hidden',
              backdropFilter: 'blur(10px)',
              backgroundColor: 'background.paper',
              boxShadow: isDarkMode 
                ? '0 24px 48px rgba(0, 0, 0, 0.4)'
                : '0 24px 48px rgba(15, 23, 42, 0.15)',
              width: '100%',
              margin: 0, // Remove margins to eliminate white space
            }}
          >
          <CardContent sx={{ padding: 4 }}>
            <Box textAlign="center" mb={2}>
              <Typography
                variant="h5"
                component="h1"
                gutterBottom
                sx={{
                  fontWeight: 'bold',
                  color: 'text.primary',
                  marginBottom: 0.5,
                }}
              >
                Smart Timetable Scheduler
              </Typography>
              <Typography
                variant="subtitle1"
                color="textSecondary"
                sx={{ marginBottom: 1.5 }}
              >
                Professional Timetable Management System
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ marginBottom: 3 }}>
                {error}
              </Alert>
            )}

            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              centered
              sx={{ marginBottom: 2 }}
            >
              <Tab label="Sign In" />
              <Tab label="Create Account" />
            </Tabs>

            <TabPanel value={tabValue} index={0}>
              <Box component="form" onSubmit={handleEmailSignIn}>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={signInData.email}
                  onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                  margin="normal"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email />
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  fullWidth
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={signInData.password}
                  onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                  margin="normal"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <Button
                  type="submit"
                  fullWidth
                  disabled={loading}
                  sx={animatedButtonStyles}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    <>
                      <Box component="span" sx={buttonTextStyles}>
                        Sign In
                      </Box>
                      <Box component="span" className="button-text-alternate" sx={buttonTextAlternateStyles}>
                        Let's Go
                      </Box>
                    </>
                  )}
                </Button>
              </Box>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <Box component="form" onSubmit={handleCreateAccount}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={signUpData.name}
                  onChange={(e) => setSignUpData({ ...signUpData, name: e.target.value })}
                  margin="normal"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person />
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={signUpData.email}
                  onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                  margin="normal"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email />
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  fullWidth
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={signUpData.password}
                  onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                  margin="normal"
                  helperText="Password must be at least 6 characters"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  fullWidth
                  label="Confirm Password"
                  type={showPassword ? 'text' : 'password'}
                  value={signUpData.confirmPassword}
                  onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
                  margin="normal"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock />
                      </InputAdornment>
                    ),
                  }}
                />
                <Button
                  type="submit"
                  fullWidth
                  disabled={loading}
                  sx={animatedButtonStyles}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    <>
                      <Box component="span" sx={buttonTextStyles}>
                        Sign Up
                      </Box>
                      <Box component="span" className="button-text-alternate" sx={buttonTextAlternateStyles}>
                        Welcome
                      </Box>
                    </>
                  )}
                </Button>
              </Box>
            </TabPanel>

            <Divider sx={{ my: 2 }}>
              <Typography variant="body2" color="textSecondary">
                OR
              </Typography>
            </Divider>

            <Button
              fullWidth
              variant="outlined"
              size="medium"
              onClick={handleGoogleSignIn}
              disabled={loading}
              startIcon={<GoogleIcon />}
              sx={{
                padding: '12px 16px',
                fontSize: '14px',
                fontWeight: 500,
                textTransform: 'none',
                borderRadius: '4px',
                border: '1px solid #dadce0',
                backgroundColor: '#fff',
                color: '#3c4043',
                boxShadow: 'none',
                '&:hover': {
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #d2e3fc',
                  boxShadow: '0 1px 2px 0 rgba(60,64,67,.30), 0 1px 3px 1px rgba(60,64,67,.15)',
                },
                '&:active': {
                  backgroundColor: '#f1f3f4',
                },
                '&:disabled': {
                  backgroundColor: '#fff',
                  color: '#9aa0a6',
                  border: '1px solid #dadce0',
                },
                '& .MuiButton-startIcon': {
                  marginRight: '12px',
                },
              }}
            >
              Continue with Google
            </Button>

            <Box mt={2} textAlign="center">
              <Typography variant="caption" color="textSecondary">
                By signing in, you agree to use this system responsibly and in accordance with Smart Timetable policies.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
      </Box>
    </Box>
  );
};

export default Login;