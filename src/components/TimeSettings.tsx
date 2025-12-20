import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Snackbar,
  LinearProgress,
  Switch,
  FormControlLabel,
  Tooltip
} from '@mui/material';
import {
  ArrowBack,
  Save,
  AccessTime,
  Schedule,
  Refresh,
  Business,
  CheckCircle
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useThemeMode } from '../contexts/ThemeContext';
import { db } from '../firebase';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  query,
  where,
  writeBatch,
  onSnapshot
} from 'firebase/firestore';

interface TimeSettingsComponent {
  id?: string;
  department: string;
  startTime: string;
  endTime: string;
  lunchStartTime: string;
  lunchEndTime: string;
  periodDuration: number;
  breakDuration: number;
  numberOfBreaks: number;
  breakAfterPeriods: number[];
  workingDays: string[];
  autoUpdate: boolean;
  lastModified: string;
  appliedAt?: string;
}

interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
}

interface TimeSettingsProps {
  onBack: () => void;
}

const TimeSettings: React.FC<TimeSettingsProps> = ({ onBack }) => {
  const { currentUser } = useAuth();
  const { theme } = useThemeMode();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [settings, setSettings] = useState<TimeSettingsComponent>({
    department: '',
    startTime: '09:00',
    endTime: '17:00',
    lunchStartTime: '12:30',
    lunchEndTime: '13:30',
    periodDuration: 60,
    breakDuration: 15,
    numberOfBreaks: 2,
    breakAfterPeriods: [2, 4], // Default: break after 2 periods, then after 4 periods
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    autoUpdate: true,
    lastModified: new Date().toISOString()
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'warning' });

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    loadDepartments();
  }, [currentUser]); // loadDepartments is defined below, keeping it out of dependencies

  useEffect(() => {
    if (selectedDepartment) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      loadTimeSettings(selectedDepartment);
    }
  }, [selectedDepartment, currentUser]); // loadTimeSettings is defined below, keeping it out of dependencies

  // Real-time listener for time settings changes
  useEffect(() => {
    if (!currentUser?.email || !selectedDepartment) return;
    
    const docRef = doc(db, 'users', currentUser.email, 'departments', selectedDepartment, 'timeSettings', 'config');
    const unsubscribe = onSnapshot(docRef, (doc) => {
      if (doc.exists() && doc.data().autoUpdate) {
        const data = doc.data() as TimeSettingsComponent;
        setSettings(data);
        showNotification('⚡ Time settings updated automatically', 'success');
      }
    });

    return () => unsubscribe();
  }, [currentUser?.email, selectedDepartment]);

  const loadDepartments = async () => {
    if (!currentUser?.email) return;
    
    try {
      const departmentsSnapshot = await getDocs(collection(db, 'users', currentUser.email, 'departments'));
      const departmentsList: Department[] = [];
      departmentsSnapshot.forEach((doc) => {
        departmentsList.push({ id: doc.id, ...doc.data() } as Department);
      });
      setDepartments(departmentsList);
      
      // Auto-select first department if available
      if (departmentsList.length > 0 && !selectedDepartment) {
        setSelectedDepartment(departmentsList[0].code);
      }
    } catch (error) {
      console.error('Error loading departments:', error);
      showNotification('Error loading departments', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadTimeSettings = async (department: string) => {
    if (!currentUser?.email || !department) return;
    
    try {
      const docRef = doc(db, 'users', currentUser.email, 'departments', department, 'timeSettings', 'config');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as TimeSettingsComponent;
        setSettings({ 
          ...data, 
          department,
          numberOfBreaks: data.numberOfBreaks ?? 2 // Fallback for existing data without numberOfBreaks
        });
      } else {
        // Set default settings for new department
        setSettings({
          department: department,
          startTime: '09:00',
          endTime: '17:00',
          lunchStartTime: '12:30',
          lunchEndTime: '13:30',
          periodDuration: 60,
          breakDuration: 15,
          numberOfBreaks: 2,
          breakAfterPeriods: [2, 4],
          workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          autoUpdate: true,
          lastModified: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error loading time settings:', error);
      showNotification('Error loading time settings', 'error');
    }
  };

  const showNotification = (message: string, severity: 'success' | 'error' | 'warning' = 'success') => {
    setNotification({ open: true, message, severity });
  };

  const handleBreakPeriodChange = async (index: number, value: number) => {
    const newBreakPeriods = [...(settings.breakAfterPeriods || [])];
    newBreakPeriods[index] = value;
    await handleSettingChange('breakAfterPeriods', newBreakPeriods);
  };

  const handleSettingChange = async (field: keyof TimeSettingsComponent, value: any) => {
    const newSettings = {
      ...settings,
      [field]: value,
      lastModified: new Date().toISOString()
    };
    
    // If numberOfBreaks changes, adjust breakAfterPeriods array
    if (field === 'numberOfBreaks') {
      const numBreaks = parseInt(value) || 0;
      const currentBreaks = settings.breakAfterPeriods || [];
      
      if (numBreaks > currentBreaks.length) {
        // Add more break periods with default values
        const newBreaks = [...currentBreaks];
        for (let i = currentBreaks.length; i < numBreaks; i++) {
          newBreaks.push((i + 1) * 2); // Default: every 2 periods
        }
        newSettings.breakAfterPeriods = newBreaks;
      } else if (numBreaks < currentBreaks.length) {
        // Remove extra break periods
        newSettings.breakAfterPeriods = currentBreaks.slice(0, numBreaks);
      }
    }
    
    setSettings(newSettings);
    
    // Immediate save if auto-update is enabled
    if (settings.autoUpdate && currentUser?.email && selectedDepartment) {
      try {
        const docRef = doc(db, 'users', currentUser.email, 'departments', selectedDepartment, 'timeSettings', 'config');
        await setDoc(docRef, { ...newSettings, department: selectedDepartment, appliedAt: new Date().toISOString() });
        
        // Auto-update timetables immediately for critical time changes
        if (field === 'startTime' || field === 'endTime' || field === 'periodDuration' || field === 'lunchStartTime' || field === 'lunchEndTime') {
          showNotification('⚡ Time settings updated instantly! Regenerating schedules...', 'success');
          await updateDepartmentTimetables();
        }
      } catch (error) {
        console.error('Error auto-saving settings:', error);
      }
    }
  };

  const saveTimeSettings = async () => {
    if (!currentUser?.email || !selectedDepartment) return;
    
    setSaving(true);
    try {
      const updatedSettings = {
        ...settings,
        department: selectedDepartment,
        lastModified: new Date().toISOString(),
        appliedAt: new Date().toISOString()
      };
      
      const docRef = doc(db, 'users', currentUser.email, 'departments', selectedDepartment, 'timeSettings', 'config');
      await setDoc(docRef, updatedSettings);
      
      setSettings(updatedSettings);
      showNotification('💾 Time settings saved! Auto-updating timetables...', 'success');
      
      // Auto-update timetables if enabled
      if (settings.autoUpdate) {
        await updateDepartmentTimetables();
      }
      
    } catch (error) {
      console.error('Error saving time settings:', error);
      showNotification('Error saving settings. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const updateDepartmentTimetables = async () => {
    if (!currentUser?.email || !selectedDepartment) return;
    
    setUpdating(true);
    try {
      // Get all sections for this department
      const sectionsSnapshot = await getDocs(
        query(collection(db, 'users', currentUser.email, 'sections'), 
              where('department', '==', selectedDepartment))
      );
      
      let totalUpdated = 0;
      const batch = writeBatch(db);
      
      // Generate new time slots based on settings
      const timeSlots = generateTimeSlots();
      
      for (const sectionDoc of sectionsSnapshot.docs) {
        const sectionId = sectionDoc.id;
        
        // Get existing timetables for this section
        const timetablesSnapshot = await getDocs(
          collection(db, 'users', currentUser.email, 'departments', selectedDepartment, 'sections', sectionId, 'timetables')
        );
        
        // Update each timetable entry with new time slots
        timetablesSnapshot.docs.forEach((timetableDoc, index) => {
          const timetableData = timetableDoc.data();
          const newTimeSlot = timeSlots[index % timeSlots.length];
          const currentTotalUpdated = totalUpdated; // Capture the current value
          
          // Update with new time settings
          const updatedTimetable = {
            ...timetableData,
            time: newTimeSlot,
            updatedAt: new Date().toISOString(),
            timeSettingsVersion: settings.lastModified
          };
          
          batch.update(timetableDoc.ref, updatedTimetable);
          totalUpdated = currentTotalUpdated + 1;
        });
      }
      
      await batch.commit();
      
      showNotification(`✅ Successfully updated ${totalUpdated} timetable entries!`, 'success');
      
    } catch (error) {
      console.error('Error updating timetables:', error);
      showNotification('Error updating timetables. Manual refresh may be needed.', 'warning');
    } finally {
      setUpdating(false);
    }
  };

  const generateTimeSlots = (): string[] => {
    const slots: string[] = [];
    const startHour = parseInt(settings.startTime.split(':')[0]);
    const startMinute = parseInt(settings.startTime.split(':')[1]);
    const endHour = parseInt(settings.endTime.split(':')[0]);
    const lunchStart = parseInt(settings.lunchStartTime.split(':')[0]);
    const lunchEnd = parseInt(settings.lunchEndTime.split(':')[0]);
    
    let currentHour = startHour;
    let currentMinute = startMinute;
    
    while (currentHour < endHour) {
      const nextHour = currentHour + Math.floor((currentMinute + settings.periodDuration) / 60);
      const nextMinute = (currentMinute + settings.periodDuration) % 60;
      
      // Skip lunch break
      if (!(currentHour >= lunchStart && currentHour < lunchEnd)) {
        const timeSlot = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}-${nextHour.toString().padStart(2, '0')}:${nextMinute.toString().padStart(2, '0')}`;
        slots.push(timeSlot);
      }
      
      currentHour = nextHour;
      currentMinute = nextMinute;
      
      // Add break time
      currentMinute += settings.breakDuration;
      if (currentMinute >= 60) {
        currentHour += Math.floor(currentMinute / 60);
        currentMinute = currentMinute % 60;
      }
    }
    
    return slots;
  };

  const toggleWorkingDay = (day: string) => {
    const newWorkingDays = settings.workingDays.includes(day)
      ? settings.workingDays.filter(d => d !== day)
      : [...settings.workingDays, day];
    
    handleSettingChange('workingDays', newWorkingDays);
  };

  const resetToDefaults = () => {
    const defaultSettings = {
      department: selectedDepartment,
      startTime: '09:00',
      endTime: '17:00',
      lunchStartTime: '12:30',
      lunchEndTime: '13:30',
      periodDuration: 60,
      breakDuration: 15,
      numberOfBreaks: 2,
      breakAfterPeriods: [2, 4],
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      autoUpdate: true,
      lastModified: new Date().toISOString()
    };

    setSettings(defaultSettings);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Typography>Loading departments and time settings...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: 2, 
      maxWidth: 1200, 
      mx: 'auto', 
      minHeight: '100vh', 
      overflow: 'auto',
      backgroundColor: theme.palette.background.default,
      color: theme.palette.text.primary
    }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={onBack} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <AccessTime color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            ⚡ Smart Time Settings
          </Typography>
        </Box>
        <Box sx={{ flexGrow: 1 }} />
        {updating && <LinearProgress sx={{ width: 100, mr: 2 }} />}
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={resetToDefaults}
          sx={{ mr: 2 }}
        >
          Reset
        </Button>
        <Button
          variant="contained"
          startIcon={<Save />}
          onClick={saveTimeSettings}
          disabled={saving || !selectedDepartment}
        >
          {saving ? 'Saving...' : '💾 Save & Apply'}
        </Button>
      </Box>

      {/* Department Selection & Auto-Update */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Business sx={{ mr: 1 }} />
                Department Selection
              </Typography>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Select Department</InputLabel>
                <Select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  label="Select Department"
                >
                  {departments.map((dept) => (
                    <MenuItem key={dept.id} value={dept.code}>
                      {dept.name} ({dept.code})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.autoUpdate}
                    onChange={(e) => handleSettingChange('autoUpdate', e.target.checked)}
                    color="primary"
                  />
                }
                label="⚡ Auto-Update Timetables (Instant Apply)"
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                When enabled, changes apply immediately and regenerate all department timetables automatically
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Working Hours */}
        <Grid item xs={12}>
          <Card elevation={2}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                <Schedule sx={{ mr: 1 }} />
                Working Hours Configuration
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Day Start Time"
                    type="time"
                    value={settings.startTime}
                    onChange={(e) => handleSettingChange('startTime', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Day End Time"
                    type="time"
                    value={settings.endTime}
                    onChange={(e) => handleSettingChange('endTime', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Lunch Break */}
        <Grid item xs={12}>
          <Card elevation={2}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                🍽️ Lunch Break Settings
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Lunch Start Time"
                    type="time"
                    value={settings.lunchStartTime}
                    onChange={(e) => handleSettingChange('lunchStartTime', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Lunch End Time"
                    type="time"
                    value={settings.lunchEndTime}
                    onChange={(e) => handleSettingChange('lunchEndTime', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Duration Settings */}
        <Grid item xs={12}>
          <Card elevation={2}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                ⏱️ Period & Break Duration
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Period Duration (minutes)"
                    type="number"
                    value={settings.periodDuration}
                    onChange={(e) => handleSettingChange('periodDuration', parseInt(e.target.value) || 0)}
                    inputProps={{ min: 30, max: 120 }}
                    helperText="Recommended: 45-75 minutes"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Break Duration (minutes)"
                    type="number"
                    value={settings.breakDuration}
                    onChange={(e) => handleSettingChange('breakDuration', parseInt(e.target.value) || 0)}
                    inputProps={{ min: 5, max: 30 }}
                    helperText="Recommended: 10-20 minutes"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Number of Breaks"
                    type="number"
                    value={settings.numberOfBreaks || 2}
                    onChange={(e) => handleSettingChange('numberOfBreaks', parseInt(e.target.value) || 0)}
                    inputProps={{ min: 0, max: 5 }}
                    helperText="How many short breaks per day"
                  />
                </Grid>
                
                {/* Dynamic Break Periods Configuration */}
                {settings.numberOfBreaks > 0 && (
                  <Grid item xs={12}>
                    <Box sx={{ mt: 3, p: 2, bgcolor: 'action.hover', borderRadius: 2, border: '1px solid', borderColor: 'primary.main' }}>
                      <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                        🕐 Break Schedule Configuration
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Configure when breaks should occur by specifying after how many periods each break should happen.
                      </Typography>
                      <Grid container spacing={2}>
                        {Array.from({ length: settings.numberOfBreaks }, (_, index) => (
                          <Grid item xs={12} sm={6} md={4} key={index}>
                            <TextField
                              fullWidth
                              label={`Break ${index + 1} after periods`}
                              type="number"
                              value={settings.breakAfterPeriods?.[index] || (index + 1) * 2}
                              onChange={(e) => handleBreakPeriodChange(index, parseInt(e.target.value) || 1)}
                              inputProps={{ min: 1, max: 10 }}
                              helperText={`🚀 Break ${index + 1} occurs after ${settings.breakAfterPeriods?.[index] || (index + 1) * 2} periods`}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  '&:hover fieldset': {
                                    borderColor: '#4CAF50',
                                  },
                                  '&.Mui-focused fieldset': {
                                    borderColor: '#4CAF50',
                                  },
                                },
                              }}
                            />
                          </Grid>
                        ))}
                      </Grid>
                      <Alert severity="info" sx={{ mt: 2 }}>
                        💡 <strong>Tip:</strong> Periods are counted from the start of the day. For example, if you set "Break 1 after 2 periods", 
                        the first break will occur after the 2nd class period.
                      </Alert>
                    </Box>
                  </Grid>
                )}
                
                {/* Dynamic Break Periods Configuration */}
                {settings.numberOfBreaks > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold', mt: 2 }}>
                      🕐 Break Periods Configuration
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Specify after how many periods each break should occur
                    </Typography>
                    <Grid container spacing={2}>
                      {Array.from({ length: settings.numberOfBreaks }, (_, index) => (
                        <Grid item xs={12} sm={6} md={4} key={index}>
                          <TextField
                            fullWidth
                            label={`Break ${index + 1} after periods`}
                            type="number"
                            value={settings.breakAfterPeriods?.[index] || (index + 1) * 2}
                            onChange={(e) => handleBreakPeriodChange(index, parseInt(e.target.value) || 1)}
                            inputProps={{ min: 1, max: 10 }}
                            helperText={`Break ${index + 1} will occur after this many periods`}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                '&:hover fieldset': {
                                  borderColor: '#4CAF50',
                                },
                                '&.Mui-focused fieldset': {
                                  borderColor: '#4CAF50',
                                },
                              },
                            }}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Working Days */}
        <Grid item xs={12}>
          <Card elevation={2}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                📅 Working Days Configuration
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Select the days when classes are conducted for {selectedDepartment || 'this department'}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {daysOfWeek.map((day) => (
                  <Tooltip key={day} title={`Click to ${settings.workingDays.includes(day) ? 'remove' : 'add'} ${day}`}>
                    <Chip
                      label={day}
                      onClick={() => toggleWorkingDay(day)}
                      variant={settings.workingDays.includes(day) ? 'filled' : 'outlined'}
                      color={settings.workingDays.includes(day) ? 'primary' : 'default'}
                      sx={{ 
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        '&:hover': { transform: 'scale(1.05)' }
                      }}
                    />
                  </Tooltip>
                ))}
              </Box>
              {settings.autoUpdate && (
                <Typography variant="caption" color="primary" sx={{ display: 'block', mt: 1 }}>
                  ⚡ Day changes apply instantly to all schedules
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Live Preview */}
        <Grid item xs={12}>
          <Card elevation={2} sx={{ bgcolor: 'background.paper', border: '2px dashed', borderColor: 'primary.main' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                <CheckCircle sx={{ mr: 1 }} />
                📊 Live Configuration Preview
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body1">
                    <strong>🏢 Department:</strong> {selectedDepartment || 'None Selected'}<br />
                    <strong>🕘 Working Hours:</strong> {settings.startTime} - {settings.endTime}<br />
                    <strong>🍽️ Lunch Break:</strong> {settings.lunchStartTime} - {settings.lunchEndTime}<br />
                    <strong>⏱️ Period Duration:</strong> {settings.periodDuration} minutes<br />
                    <strong>🕐 Break Duration:</strong> {settings.breakDuration} minutes<br />
                    <strong>📅 Working Days:</strong> {settings.workingDays.join(', ')}<br />
                    <strong>⚡ Auto-Update:</strong> {settings.autoUpdate ? '🟢 Enabled' : '🔴 Disabled'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Generated Time Slots:</strong><br />
                    {generateTimeSlots().slice(0, 6).map((slot, index) => (
                      <Chip 
                        key={index} 
                        label={slot} 
                        size="small" 
                        variant="outlined" 
                        sx={{ mr: 0.5, mb: 0.5 }} 
                      />
                    ))}
                    {generateTimeSlots().length > 6 && (
                      <Typography variant="caption" color="text.secondary">
                        ... and {generateTimeSlots().length - 6} more slots
                      </Typography>
                    )}
                  </Typography>
                </Grid>
              </Grid>
              
              {settings.lastModified && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                  🕒 Last Modified: {new Date(settings.lastModified).toLocaleString()}
                  {settings.appliedAt && ` | ✅ Applied: ${new Date(settings.appliedAt).toLocaleString()}`}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setNotification({ ...notification, open: false })} 
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TimeSettings;