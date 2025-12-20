import React, { useEffect, useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Grid,
  Paper,
  Card,
  Box,
  Avatar,
  IconButton,
  Chip,
  Drawer,
  Switch,
  FormControlLabel,
  Divider,
  CardContent,
  CircularProgress,
} from '@mui/material';
import {
  Schedule,
  School,
  Person,
  Room,
  Settings,
  AutoAwesome,
  Home,
  AccessTime,
  Business,
  DarkMode,
  LightMode,
  Palette,
  Security,
  ArrowBack,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useThemeMode } from '../contexts/ThemeContext';
import SubjectManagement from './SubjectManagement';
import TimetableGenerator from './TimetableGenerator';
import FacultyManagement from './FacultyManagement';
import ClassroomManagement from './ClassroomManagement';
import TimetableManagement from './TimetableManagement';
import SectionManagement from './SectionManagement';
import DepartmentManagement from './DepartmentManagement';
import TimeSettings from './TimeSettings';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { seedEngineeringData } from '../utils/seedEngineeringData';

const SettingsPanel = ({ onBack }: { onBack: () => void }) => {
  const { isDarkMode, toggleTheme } = useThemeMode();
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    faculties: 0,
    departments: 0,
    sections: 0,
    subjects: 0
  });
  const [seeding, setSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);

  // Load dashboard stats
  useEffect(() => {
    const loadStats = async () => {
      if (!currentUser?.email) return;
      
      try {
        const userEmail = currentUser.email;
        const [facultiesSnap, deptSnap, sectionsSnap, subjectsSnap] = await Promise.all([
          getDocs(collection(db, 'users', userEmail, 'faculties')),
          getDocs(collection(db, 'users', userEmail, 'departments')),
          getDocs(collection(db, 'users', userEmail, 'sections')),
          getDocs(collection(db, 'users', userEmail, 'subjects'))
        ]);
        
        setStats({
          faculties: facultiesSnap.docs.length,
          departments: deptSnap.docs.length,
          sections: sectionsSnap.docs.length,
          subjects: subjectsSnap.docs.length
        });
      } catch (error) {
        console.error('Error loading stats:', error);
      }
    };
    
    loadStats();
  }, [currentUser]);

  const handleSeed = async () => {
    if (!currentUser?.email) return;
    setSeeding(true);
    setSeedMessage(null);
    try {
      const result = await seedEngineeringData(currentUser.email);
      setSeedMessage(result.message || 'Seeding completed.');
      const [facultiesSnap, deptSnap, sectionsSnap, subjectsSnap] = await Promise.all([
        getDocs(collection(db, 'users', currentUser.email, 'faculties')),
        getDocs(collection(db, 'users', currentUser.email, 'departments')),
        getDocs(collection(db, 'users', currentUser.email, 'sections')),
        getDocs(collection(db, 'users', currentUser.email, 'subjects'))
      ]);
      setStats({
        faculties: facultiesSnap.docs.length,
        departments: deptSnap.docs.length,
        sections: sectionsSnap.docs.length,
        subjects: subjectsSnap.docs.length
      });
    } catch (error) {
      setSeedMessage('Seeding failed: ' + error);
    } finally {
      setSeeding(false);
    }
  };



  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <IconButton color="inherit" onClick={onBack} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Settings sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Settings
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          
          {/* Theme Settings */}
          <Grid item xs={12} md={6}>
            <Card elevation={3}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Palette sx={{ mr: 2, color: 'primary.main' }} />
                  <Typography variant="h6" fontWeight="bold">
                    Appearance
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Customize your app's appearance and theme preferences
                </Typography>
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={isDarkMode}
                      onChange={toggleTheme}
                      color="primary"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {isDarkMode ? <DarkMode /> : <LightMode />}
                      {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                    </Box>
                  }
                />
                
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {isDarkMode 
                    ? 'Switch to light mode for better visibility in bright environments'
                    : 'Switch to dark mode to reduce eye strain in low-light conditions'
                  }
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          

          
          {/* Data Overview */}
          <Grid item xs={12}>
            <Card elevation={3}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Security sx={{ mr: 2, color: 'primary.main' }} />
                  <Typography variant="h6" fontWeight="bold">
                    Data Overview
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Current state of your timetable data
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={6} md={3}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                      <Person sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                      <Typography variant="h4" fontWeight="bold" color="primary.main">
                        {stats.faculties}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Faculty Members
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                      <Business sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
                      <Typography variant="h4" fontWeight="bold" color="secondary.main">
                        {stats.departments}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Departments
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                      <School sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                      <Typography variant="h4" fontWeight="bold" color="success.main">
                        {stats.sections}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Sections
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                      <Schedule sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                      <Typography variant="h4" fontWeight="bold" color="warning.main">
                        {stats.subjects}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Subjects
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          
          {/* App Information */}
          <Grid item xs={12}>
            <Card elevation={3}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Smart Timetable Scheduler
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Professional timetable management application with AI-powered scheduling and conflict resolution.
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="body2" color="text.secondary">
                  <strong>Version:</strong> 1.0.0<br/>
                  <strong>Last Updated:</strong> November 2024<br/>
                  <strong>Features:</strong> Dark/Light Mode, Conflict Resolution, AI Generation
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};


const Dashboard: React.FC = () => {
  const { currentUser, signOut } = useAuth();
  const { theme } = useThemeMode();
  const [currentView, setCurrentView] = useState<string>('dashboard');

  // Sidebar button style helper
  const navBtnSx = (view: string) => {
    return {
      justifyContent: 'flex-start',
      fontWeight: currentView === view ? 'bold' : 500,
      borderRadius: 2,
      textTransform: 'none',
      bgcolor: currentView === view ? 'action.selected' : 'background.paper',
      color: 'primary.main',
      mb: 0.5,
      px: 2.5,
      py: 1.2,
      boxShadow: currentView === view ? 2 : 0,
      '&:hover': {
        bgcolor: 'action.hover',
        color: 'primary.dark',
        boxShadow: 2,
      },
      fontSize: 16,
      alignItems: 'center',
      gap: 1.5,
    };
  };
  // Dynamic counts
  const [subjectCount, setSubjectCount] = useState(0);
  const [facultyCount, setFacultyCount] = useState(0);
  const [classroomCount, setClassroomCount] = useState(0);
  const [timetableCount, setTimetableCount] = useState(0);

  // Fetch dynamic counts from Firestore
  useEffect(() => {
    if (!currentUser?.email) return;
    const userEmail = currentUser.email;
    getDocs(collection(db, 'users', userEmail, 'subjects')).then((qs: any) => setSubjectCount(qs.size));
    getDocs(collection(db, 'users', userEmail, 'faculties')).then((qs: any) => setFacultyCount(qs.size));
    getDocs(collection(db, 'users', userEmail, 'classrooms')).then((qs: any) => setClassroomCount(qs.size));
    getDocs(collection(db, 'users', userEmail, 'timetables')).then((qs: any) => setTimetableCount(qs.size));
  }, [currentUser]);



  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  if (currentView !== 'dashboard') {
    const handleBack = () => setCurrentView('dashboard');
    switch (currentView) {
      case 'subjects':
        return <SubjectManagement onBack={handleBack} />;
      case 'faculty':
        return <FacultyManagement onBack={handleBack} />;
      case 'classrooms':
        return <ClassroomManagement onBack={handleBack} />;
      case 'generator':
        return <TimetableGenerator onBack={handleBack} />;
      case 'timetables':
        return <TimetableManagement onBack={handleBack} />;
      case 'sections':
        return <SectionManagement onBack={handleBack} />;
      case 'departments':
        return <DepartmentManagement onBack={handleBack} />;
      case 'time-settings':
        return <TimeSettings onBack={handleBack} />;
      case 'settings':
        return <SettingsPanel onBack={handleBack} />;
      default:
        return null;
    }
  }



  return (
    <Box sx={{ 
      display: 'flex', 
      minHeight: '100vh',
      backgroundColor: theme.palette.background.default,
      color: theme.palette.text.primary
    }}>
      {/* Left Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: 280,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 280,
            boxSizing: 'border-box',
            bgcolor: 'primary.dark', // darker blue for contrast
            color: 'primary.contrastText',
            borderRight: '2px solid #1976d2',
            boxShadow: 3,
          },
        }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main', textAlign: 'center', letterSpacing: 1 }}>
            Timetable System
          </Typography>
        </Box>
        <Box sx={{ 
          flexGrow: 1, 
          px: 1, 
          py: 2.5, 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 0.5, 
          backgroundColor: theme.palette.background.default,
          minHeight: 0 
        }}>
          <Button startIcon={<Home />} fullWidth sx={navBtnSx('dashboard')} onClick={() => setCurrentView('dashboard')}>Dashboard</Button>
          <Button startIcon={<Room />} fullWidth sx={navBtnSx('classrooms')} onClick={() => setCurrentView('classrooms')}>Classrooms</Button>
          <Button startIcon={<School />} fullWidth sx={navBtnSx('sections')} onClick={() => setCurrentView('sections')}>Sections</Button>
          <Button startIcon={<AccessTime />} fullWidth sx={navBtnSx('time-settings')} onClick={() => setCurrentView('time-settings')}>Time Settings</Button>
          <Button startIcon={<School />} fullWidth sx={navBtnSx('subjects')} onClick={() => setCurrentView('subjects')}>Subjects</Button>
          <Button startIcon={<Business />} fullWidth sx={navBtnSx('departments')} onClick={() => setCurrentView('departments')}>Departments</Button>
          <Button startIcon={<Person />} fullWidth sx={navBtnSx('faculty')} onClick={() => setCurrentView('faculty')}>Faculty</Button>
          <Button startIcon={<AutoAwesome />} fullWidth sx={navBtnSx('generator')} onClick={() => setCurrentView('generator')}>Generate Timetable</Button>
          <Button startIcon={<Schedule />} fullWidth sx={navBtnSx('timetables')} onClick={() => setCurrentView('timetables')}>My Timetables</Button>
          <Button startIcon={<Settings />} fullWidth sx={navBtnSx('settings')} onClick={() => setCurrentView('settings')}>Settings</Button>
          <Box sx={{ flexGrow: 1 }} />
          {/* Profile at bottom */}
          <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar
                src={currentUser?.photoURL || ''}
                alt={currentUser?.displayName || 'User'}
                sx={{ width: 40, height: 40, mr: 2 }}
              />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  {currentUser?.displayName || 'User'}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8, color: 'primary.main' }}>
                  {currentUser?.email}
                </Typography>
              </Box>
            </Box>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleSignOut}
              sx={{ 
                color: 'primary.main', 
                borderColor: 'primary.main',
                '&:hover': { borderColor: 'primary.dark', color: 'primary.dark' }
              }}
            >
              Sign Out
            </Button>
          </Box>
        </Box>

      </Drawer>



      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default', overflow: 'auto' }}>
        {/* Top Bar */}
        <AppBar 
          position="static" 
          elevation={1} 
          sx={{ 
            bgcolor: 'background.paper', 
            color: 'text.primary',
            borderBottom: '1px solid', borderColor: 'divider'
          }}
        >
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
              Welcome back, {currentUser?.displayName?.split(' ')[0] || 'User'}!
            </Typography>
          </Toolbar>
        </AppBar>

        {/* Dashboard Content */}
        <Container maxWidth="xl" sx={{ mt: 1.5, mb: 4 }}>
          {/* Welcome Section */}
          <Paper
            elevation={3}
            sx={{
              p: 4,
              mb: 4,
              background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
              color: 'primary.contrastText',
              borderRadius: 3,
            }}
          >
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
              Smart Timetable Dashboard
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9, mb: 2 }}>
              Efficiently manage your academic schedules with AI-powered tools
            </Typography>
            
            <Grid container spacing={2} alignItems="center">
              <Grid item>
                <Chip 
                  label="Academic Year 2024-25" 
                  size="small"
                  sx={{ bgcolor: 'action.hover', color: 'primary.contrastText' }} 
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Quick Stats */}
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={3} sx={{ textAlign: 'center', p: 3 }}>
                <Person sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="h3" color="primary" sx={{ fontWeight: 'bold' }}>
                  {facultyCount}
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  Total Faculty
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={3} sx={{ textAlign: 'center', p: 3 }}>
                <Room sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
                <Typography variant="h3" color="secondary" sx={{ fontWeight: 'bold' }}>
                  {classroomCount}
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  Available Classrooms
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={3} sx={{ textAlign: 'center', p: 3 }}>
                <Schedule sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                <Typography variant="h3" color="success.main" sx={{ fontWeight: 'bold' }}>
                  {timetableCount}
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  Saved Timetables
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={3} sx={{ textAlign: 'center', p: 3 }}>
                <School sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                <Typography variant="h3" color="warning.main" sx={{ fontWeight: 'bold' }}>
                  {subjectCount}
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  Total Subjects
                </Typography>
              </Card>
            </Grid>
          </Grid>


        </Container>
      </Box>
    </Box>
  );
}

export default Dashboard;