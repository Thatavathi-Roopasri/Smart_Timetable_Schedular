import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  AppBar,
  Toolbar,
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Delete,
  Save,
  Cancel,
  Schedule,
  School,
  AccessTime,
  Visibility,
  Download,
  Person
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { generateTimetablePDF, downloadFacultyTimetablePDF } from '../utils/timetablePDF';

interface TimetableManagementProps {
  onBack: () => void;
}

interface SavedTimetable {
  id: string;
  name: string;
  department: string;
  section: string;
  semester: string;
  createdAt: any;
  schedule: any[];
  isLiked?: boolean;
}

const TimetableManagement: React.FC<TimetableManagementProps> = ({ onBack }) => {
  const { currentUser } = useAuth();
  const [savedTimetables, setSavedTimetables] = useState<SavedTimetable[]>([]);
  const [open, setOpen] = useState(false);
  const [editingTimetable, setEditingTimetable] = useState<SavedTimetable | null>(null);
  const [viewingTimetable, setViewingTimetable] = useState<SavedTimetable | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFacultyForDownload, setSelectedFacultyForDownload] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    department: '',
    section: '',
    semester: ''
  });

  const departments = [
    'Computer Science',
    'Information Technology',
    'Electronics & Communication',
    'Mechanical Engineering',
    'Civil Engineering',
    'Electrical Engineering'
  ];

  const sections = ['A', 'B', 'C', 'D'];
  const semesters = ['1', '2', '3', '4', '5', '6', '7', '8'];

  const fetchTimetables = useCallback(async () => {
    if (!currentUser?.email) return;
    
    setLoading(true);
    try {
      console.log('Fetching timetables for user:', currentUser.email);
      const q = query(
        collection(db, 'users', currentUser.email, 'timetables'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      const timetableList: SavedTimetable[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        timetableList.push({ 
          id: doc.id, 
          ...data,
          schedule: data.schedule || []
        } as SavedTimetable);
      });
      
      console.log('Fetched timetables:', timetableList.length);
      setSavedTimetables(timetableList);
    } catch (error) {
      console.error('Error fetching timetables:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser?.email) {
      fetchTimetables();
    }
  }, [currentUser, fetchTimetables]);

  const handleClose = () => {
    setOpen(false);
    setEditingTimetable(null);
    setFormData({
      name: '',
      department: '',
      section: '',
      semester: ''
    });
  };

  const handleEdit = (timetable: SavedTimetable) => {
    setEditingTimetable(timetable);
    setFormData({
      name: timetable.name,
      department: timetable.department,
      section: timetable.section,
      semester: timetable.semester
    });
    setOpen(true);
  };

  const handleView = (timetable: SavedTimetable) => {
    setViewingTimetable(timetable);
  };

  const handleCloseView = () => {
    setViewingTimetable(null);
    setSelectedFacultyForDownload('');
  };

  const handleDownloadPDF = (timetable: SavedTimetable) => {
    if (!timetable || !timetable.schedule || timetable.schedule.length === 0) {
      alert('No schedule data available for PDF generation');
      return;
    }
    try {
      const timetableData = {
        name: timetable.name,
        schedule: timetable.schedule
      };

      generateTimetablePDF(
        timetableData, 
        timetable.department, 
        `${timetable.section} (Sem ${timetable.semester})`
      );
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  const handleDownloadFacultyTimetable = () => {
    if (!viewingTimetable) {
      return;
    }

    if (!selectedFacultyForDownload) {
      alert('Please select a faculty member to download their timetable.');
      return;
    }

    const timetableData = {
      name: viewingTimetable.name,
      schedule: viewingTimetable.schedule || []
    };

    downloadFacultyTimetablePDF(
      timetableData,
      viewingTimetable.department,
      `${viewingTimetable.section} (Sem ${viewingTimetable.semester})`,
      selectedFacultyForDownload
    );
  };

  const handleDelete = async (id: string) => {
    if (!currentUser?.email) return;
    
    try {
      await deleteDoc(doc(db, 'users', currentUser.email, 'timetables', id));
      await fetchTimetables();
    } catch (error) {
      console.error('Error deleting timetable:', error);
    }
  };

  const handleSubmit = async () => {
    if (!currentUser?.email) return;
    
    try {
      if (editingTimetable) {
        await updateDoc(
          doc(db, 'users', currentUser.email, 'timetables', editingTimetable.id),
          formData
        );
      } else {
        await addDoc(
          collection(db, 'users', currentUser.email, 'timetables'),
          {
            ...formData,
            createdAt: new Date(),
            schedule: [],
            isLiked: false
          }
        );
      }
      await fetchTimetables();
      handleClose();
    } catch (error) {
      console.error('Error saving timetable:', error);
    }
  };

  const toggleLike = async (timetable: SavedTimetable) => {
    if (!currentUser?.email) return;
    
    try {
      await updateDoc(
        doc(db, 'users', currentUser.email, 'timetables', timetable.id),
        { isLiked: !timetable.isLiked }
      );
      await fetchTimetables();
    } catch (error) {
      console.error('Error updating timetable:', error);
    }
  };

  const formatSchedule = (schedule: any[]) => {
    if (!schedule || schedule.length === 0) return 'No schedule data';
    
    const totalClasses = schedule.length;
    const uniqueDays = new Set(schedule.map(item => item.day));
    const days = Array.from(uniqueDays).length;
    
    return `${totalClasses} classes across ${days} days`;
  };

  useEffect(() => {
    if (viewingTimetable) {
      setSelectedFacultyForDownload('');
    }
  }, [viewingTimetable]);

  const facultyOptions = useMemo(() => {
    if (!viewingTimetable || !Array.isArray(viewingTimetable.schedule)) {
      return [] as string[];
    }

    // Extract all unique faculty names from the schedule
    const facultyNames = new Set<string>();
    
    viewingTimetable.schedule.forEach((entry: any) => {
      if (entry?.faculty && typeof entry.faculty === 'string' && entry.faculty.trim().length > 0) {
        facultyNames.add(entry.faculty.trim());
      }
    });

    // Convert to sorted array
    return Array.from(facultyNames).sort((a, b) => a.localeCompare(b));
  }, [viewingTimetable]);

  const getDepartmentColor = (department: string) => {
    const colors = {
      'Computer Science': '#2196F3',
      'Information Technology': '#9C27B0',
      'Electronics & Communication': '#FF9800',
      'Mechanical Engineering': '#4CAF50',
      'Civil Engineering': '#795548',
      'Electrical Engineering': '#F44336'
    };
    return colors[department as keyof typeof colors] || '#607D8B';
  };

  const renderTimetableGrid = (timetable: SavedTimetable) => {
    if (!timetable.schedule || timetable.schedule.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="textSecondary">
            No schedule data available
          </Typography>
        </Box>
      );
    }

    // Get unique days and times from the schedule
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const times = Array.from(new Set(timetable.schedule.map((entry: any) => entry.time))).sort();

    return (
      <TableContainer id="weekly-schedule" component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: 'action.hover' }}>Time</TableCell>
              {days.map((day) => (
                <TableCell key={day} sx={{ fontWeight: 'bold', textAlign: 'center', bgcolor: 'action.hover' }}>
                  {day}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {times.map((timeSlot) => (
              <TableRow key={timeSlot}>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'action.selected' }}>
                  {timeSlot}
                </TableCell>
                {days.map((day) => {
                  const entry = timetable.schedule.find((s: any) => s.day === day && s.time === timeSlot);
                  const isSelectedFaculty = entry?.faculty === selectedFacultyForDownload;
                  return (
                    <TableCell key={`${day}-${timeSlot}`} sx={{ textAlign: 'center', p: 2, minWidth: 150 }}>
                      {timeSlot.includes('LUNCH BREAK') ? (
                        <Chip label="🍽️ LUNCH BREAK" size="small" color="warning" sx={{ fontWeight: 'bold' }} />
                      ) : timeSlot.includes('BREAK') ? (
                        <Chip label="☕ BREAK" size="small" color="info" sx={{ fontWeight: 'bold' }} />
                      ) : entry ? (
                        <Box sx={{ 
                          bgcolor: '#1a1a1a', 
                          p: 1, 
                          borderRadius: 1, 
                          border: isSelectedFaculty ? '2px solid #90caf9' : '1px solid #333333', 
                          boxShadow: isSelectedFaculty ? '0 0 8px rgba(144, 202, 249, 0.6)' : 1,
                          transition: 'all 0.3s ease'
                        }}>
                          <Typography variant="body2" sx={{ 
                            fontWeight: 'bold', 
                            color: '#ffffff'
                          }}>
                            {entry.subject}
                          </Typography>
                          <Typography variant="caption" sx={{ 
                            display: 'block', 
                            color: '#ffffff',
                            fontWeight: 'bold'
                          }}>
                            👨‍🏫 {entry.faculty}
                          </Typography>
                          <Typography variant="caption" sx={{ 
                            display: 'block', 
                            color: '#ffffff'
                          }}>
                            🏫 {entry.classroom}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="caption" color="textSecondary">
                          Free
                        </Typography>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  if (loading) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        bgcolor: 'background.default',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  // Full-page timetable view
  if (viewingTimetable) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        {/* Header */}
        <AppBar position="static" sx={{ bgcolor: 'primary.main' }}>
          <Toolbar>
            <IconButton color="inherit" onClick={handleCloseView} sx={{ mr: 2 }}>
              <ArrowBack />
            </IconButton>
            <Schedule sx={{ mr: 2 }} />
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
              {viewingTimetable.name}
            </Typography>
            <Chip 
              label={viewingTimetable.department}
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                color: 'white',
                mr: 2
              }}
            />
          </Toolbar>
        </AppBar>

        {/* Timetable Details */}
        <Container maxWidth="xl" sx={{ mt: 3, mb: 4 }}>
          <Card elevation={3} sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={3} alignItems="center">
                <Grid item>
                  <Avatar sx={{ 
                    bgcolor: getDepartmentColor(viewingTimetable.department),
                    width: 64,
                    height: 64
                  }}>
                    {viewingTimetable.name.charAt(0).toUpperCase()}
                  </Avatar>
                </Grid>
                <Grid item xs>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {viewingTimetable.name}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Chip 
                      icon={<School />}
                      label={`Department: ${viewingTimetable.department}`}
                      color="primary"
                    />
                    <Chip 
                      icon={<School />}
                      label={`Section: ${viewingTimetable.section}`}
                      color="secondary"
                    />
                    <Chip 
                      icon={<AccessTime />}
                      label={`Semester: ${viewingTimetable.semester}`}
                      color="info"
                    />
                  </Box>
                  <Typography variant="body1" color="textSecondary">
                    {formatSchedule(viewingTimetable.schedule)} • Created on {viewingTimetable.createdAt ? 
                      viewingTimetable.createdAt.toDate().toLocaleDateString() :
                      new Date().toLocaleDateString()
                    }
                  </Typography>
                </Grid>
                <Grid item>
                  <Button
                    variant="contained"
                    startIcon={<Download />}
                    onClick={() => handleDownloadPDF(viewingTimetable)}
                    sx={{ 
                      bgcolor: '#4CAF50',
                      '&:hover': { bgcolor: '#388e3c' }
                    }}
                  >
                    Download PDF
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {facultyOptions.length > 0 && (
            <Card elevation={2} sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 2, fontWeight: 'bold' }}>
                  <Person sx={{ mr: 1 }} /> Faculty Timetable Options
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  Available Faculty in this Schedule: {facultyOptions.length} faculty members
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                  <FormControl fullWidth sx={{ minWidth: { sm: 240 } }}>
                    <InputLabel id="faculty-action-label">Select Faculty</InputLabel>
                    <Select
                      labelId="faculty-action-label"
                      value={selectedFacultyForDownload}
                      label="Select Faculty"
                      onChange={(event) => setSelectedFacultyForDownload(event.target.value as string)}
                    >
                      <MenuItem value="">
                        <em>Choose a faculty member...</em>
                      </MenuItem>
                      {facultyOptions.map((name) => (
                        <MenuItem key={name} value={name}>
                          {name} ({viewingTimetable?.schedule?.filter((entry: any) => entry?.faculty === name).length || 0} classes)
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Box sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
                    <Button
                      variant="outlined"
                      startIcon={<Visibility />}
                      onClick={() => {
                        if (selectedFacultyForDownload) {
                          // Scroll to schedule and highlight faculty classes
                          const scheduleElement = document.getElementById('weekly-schedule');
                          if (scheduleElement) {
                            scheduleElement.scrollIntoView({ behavior: 'smooth' });
                          }
                        }
                      }}
                      disabled={!selectedFacultyForDownload}
                      sx={{ minWidth: { sm: 120 } }}
                    >
                      View
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<Download />}
                      onClick={handleDownloadFacultyTimetable}
                      disabled={!selectedFacultyForDownload}
                      sx={{ minWidth: { sm: 120 } }}
                    >
                      Download PDF
                    </Button>
                  </Box>
                </Box>
                {selectedFacultyForDownload && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'primary.50', borderRadius: 1, border: '1px solid', borderColor: 'primary.200' }}>
                    <Typography variant="body2" color="primary.main" sx={{ fontWeight: 'medium' }}>
                      📋 Selected: {selectedFacultyForDownload}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Total Classes: {viewingTimetable?.schedule?.filter((entry: any) => entry?.faculty === selectedFacultyForDownload).length || 0}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}

          {/* Timetable Grid */}
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
                📅 Weekly Schedule
              </Typography>
              {renderTimetableGrid(viewingTimetable)}
            </CardContent>
          </Card>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', p: 3 }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        mb: 3,
        bgcolor: 'background.paper',
        p: 2,
        borderRadius: 2,
        boxShadow: 1
      }}>
        <IconButton 
          onClick={onBack} 
          sx={{ 
            mr: 2,
            color: '#1976d2'
          }}
        >
          <ArrowBack />
        </IconButton>
        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <Schedule sx={{ mr: 2, color: '#1976d2', fontSize: 28 }} />
          <Typography variant="h5" sx={{ fontWeight: 600, color: '#1976d2' }}>
            My Timetables
          </Typography>
        </Box>
        <Typography variant="body2" color="textSecondary">
          {savedTimetables.length} saved timetables
        </Typography>
      </Box>

      {/* Timetables Grid */}
      {savedTimetables.length === 0 ? (
        <Box sx={{ 
          textAlign: 'center', 
          py: 8,
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 1
        }}>
          <Schedule sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No Saved Timetables
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            You haven't saved any timetables yet. Create and save your first timetable!
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {savedTimetables.map((timetable) => (
            <Grid item xs={12} sm={6} md={4} key={timetable.id}>
              <Card sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                },
                border: timetable.isLiked ? '2px solid #4CAF50' : 'none'
              }}>
                <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {/* Header with Avatar */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ 
                      bgcolor: getDepartmentColor(timetable.department),
                      width: 48,
                      height: 48,
                      mr: 2
                    }}>
                      {timetable.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {timetable.name}
                      </Typography>
                      <Chip 
                        label={timetable.department}
                        size="small"
                        sx={{ 
                          bgcolor: getDepartmentColor(timetable.department),
                          color: 'white',
                          fontSize: '0.75rem'
                        }}
                      />
                    </Box>
                  </Box>

                  {/* Details */}
                  <Box sx={{ mb: 2, flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <School sx={{ fontSize: 16, mr: 1, color: '#666' }} />
                      <Typography variant="body2" color="textSecondary">
                        Section: {timetable.section} | Semester: {timetable.semester}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <AccessTime sx={{ fontSize: 16, mr: 1, color: '#666' }} />
                      <Typography variant="body2" color="textSecondary">
                        {formatSchedule(timetable.schedule)}
                      </Typography>
                    </Box>

                    {timetable.createdAt && (
                      <Typography variant="caption" color="textSecondary">
                        Created: {timetable.createdAt.toDate ? 
                          timetable.createdAt.toDate().toLocaleDateString() :
                          new Date(timetable.createdAt).toLocaleDateString()
                        }
                      </Typography>
                    )}
                  </Box>

                  {/* Actions */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 'auto', alignItems: 'center' }}>
                    <Box>
                      <IconButton 
                        size="small" 
                        onClick={() => handleView(timetable)}
                        sx={{ color: '#4CAF50', mr: 1 }}
                        title="View Full Timetable"
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => handleEdit(timetable)}
                        sx={{ color: '#1976d2', mr: 1 }}
                        title="Edit Timetable"
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => handleDelete(timetable.id)}
                        sx={{ color: 'error.main' }}
                        title="Delete Timetable"
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                    
                    <Button
                      size="small"
                      variant={timetable.isLiked ? "contained" : "outlined"}
                      onClick={() => toggleLike(timetable)}
                      sx={{
                        bgcolor: timetable.isLiked ? '#4CAF50' : 'transparent',
                        borderColor: '#4CAF50',
                        color: timetable.isLiked ? 'white' : '#4CAF50',
                        '&:hover': {
                          bgcolor: timetable.isLiked ? '#388e3c' : 'rgba(76, 175, 80, 0.08)'
                        }
                      }}
                    >
                      {timetable.isLiked ? 'Liked' : 'Like'}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingTimetable ? 'Edit Timetable' : 'Create New Timetable'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Timetable Name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              sx={{ mb: 2 }}
            />
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Department</InputLabel>
              <Select
                value={formData.department}
                label="Department"
                onChange={(e) => setFormData({...formData, department: e.target.value})}
              >
                {departments.map((dept) => (
                  <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl sx={{ flex: 1 }}>
                <InputLabel>Section</InputLabel>
                <Select
                  value={formData.section}
                  label="Section"
                  onChange={(e) => setFormData({...formData, section: e.target.value})}
                >
                  {sections.map((section) => (
                    <MenuItem key={section} value={section}>{section}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl sx={{ flex: 1 }}>
                <InputLabel>Semester</InputLabel>
                <Select
                  value={formData.semester}
                  label="Semester"
                  onChange={(e) => setFormData({...formData, semester: e.target.value})}
                >
                  {semesters.map((sem) => (
                    <MenuItem key={sem} value={sem}>{sem}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} startIcon={<Cancel />}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            startIcon={<Save />}
            disabled={!formData.name || !formData.department || !formData.section || !formData.semester}
          >
            {editingTimetable ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TimetableManagement;