import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  SelectChangeEvent
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Delete,
  Add,
  Save,
  Cancel,
  ExpandMore,
  Business,
  School
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

interface Section {
  id: string;
  name: string;
  department: string;
  semester: number;
  classTeacher?: string;
}

interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
}

interface SectionManagementProps {
  onBack: () => void;
}

const SectionManagement: React.FC<SectionManagementProps> = ({ onBack }) => {
  const { currentUser } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    department: ''
  });
  const [loading, setLoading] = useState(true);

  const fetchDepartments = useCallback(async () => {
    if (!currentUser?.email) return;
    
    try {
      const departmentsQuery = query(
        collection(db, 'users', currentUser.email, 'departments'),
        orderBy('name')
      );
      const departmentsSnapshot = await getDocs(departmentsQuery);
      const departmentsList = departmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Department));
      setDepartments(departmentsList);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  }, [currentUser]);

  const fetchSections = useCallback(async () => {
    if (!currentUser?.email) return;
    
    try {
      const sectionsQuery = query(
        collection(db, 'users', currentUser.email, 'sections'),
        orderBy('name')
      );
      const sectionsSnapshot = await getDocs(sectionsQuery);
      const sectionsList = sectionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Section));
      setSections(sectionsList);
    } catch (error) {
      console.error('Error fetching sections:', error);
    }
  }, [currentUser]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchDepartments(), fetchSections()]);
      setLoading(false);
    };
    
    loadData();
  }, [fetchDepartments, fetchSections]);

  const handleAddSection = () => {
    setEditingSection(null);
    setFormData({
      name: '',
      department: selectedDepartment || ''
    });
    setOpenDialog(true);
  };

  const handleEditSection = (section: Section) => {
    setEditingSection(section);
    setFormData({
      name: section.name,
      department: section.department
    });
    setOpenDialog(true);
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!currentUser?.email) return;
    
    if (window.confirm('Are you sure you want to delete this section?')) {
      try {
        await deleteDoc(doc(db, 'users', currentUser.email, 'sections', sectionId));
        await fetchSections();
      } catch (error) {
        console.error('Error deleting section:', error);
        alert('Error deleting section. Please try again.');
      }
    }
  };

  const handleSaveSection = async () => {
    if (!currentUser?.email) return;
    
    if (!formData.name.trim() || !formData.department) {
      alert('Please fill in all required fields.');
      return;
    }

    try {
      const sectionData = {
        name: formData.name.trim(),
        department: formData.department,
        semester: 3, // Default semester
        classTeacher: ''
      };

      if (editingSection) {
        await updateDoc(
          doc(db, 'users', currentUser.email, 'sections', editingSection.id),
          sectionData
        );
      } else {
        await addDoc(
          collection(db, 'users', currentUser.email, 'sections'),
          sectionData
        );
      }

      setOpenDialog(false);
      await fetchSections();
      
      setFormData({
        name: '',
        department: ''
      });
    } catch (error) {
      console.error('Error saving section:', error);
      alert('Error saving section. Please try again.');
    }
  };

  const getSectionsByDepartment = (departmentCode: string) => {
    return sections.filter(section => section.department === departmentCode);
  };

  const handleDepartmentChange = (event: SelectChangeEvent<string>) => {
    setSelectedDepartment(event.target.value);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Typography>Loading sections...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={onBack} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <School color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
            Section Management
          </Typography>
        </Box>
      </Box>

      {/* Department Filter */}
      <Box sx={{ mb: 3 }}>
        <FormControl sx={{ minWidth: 300, mr: 2 }}>
          <InputLabel>Filter by Department</InputLabel>
          <Select
            value={selectedDepartment}
            label="Filter by Department"
            onChange={handleDepartmentChange}
          >
            <MenuItem value="">
              <em>All Departments</em>
            </MenuItem>
            {departments.map((department) => (
              <MenuItem key={department.id} value={department.code}>
                {department.name} ({department.code})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddSection}
          sx={{ ml: 2 }}
        >
          Add Section
        </Button>
      </Box>

      {/* Sections by Department */}
      <Grid container spacing={3}>
        {departments
          .filter(department => !selectedDepartment || department.code === selectedDepartment)
          .map((department) => {
            const departmentSections = getSectionsByDepartment(department.code);
            
            return (
              <Grid item xs={12} key={department.id}>
                <Accordion defaultExpanded={!selectedDepartment || selectedDepartment === department.code}>
                  <AccordionSummary
                    expandIcon={<ExpandMore />}
                    sx={{
                      bgcolor: 'action.hover',
                      '&:hover': { bgcolor: '#e0e0e0' }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Business color="primary" />
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {department.name} ({department.code})
                      </Typography>
                      <Chip 
                        label={`${departmentSections.length} sections`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    {departmentSections.length > 0 ? (
                      <TableContainer component={Paper} variant="outlined">
                        <Table>
                          <TableHead>
                            <TableRow sx={{ bgcolor: 'action.selected' }}>
                              <TableCell sx={{ fontWeight: 'bold' }}>Section Name</TableCell>
                              <TableCell sx={{ fontWeight: 'bold' }}>Department</TableCell>
                              <TableCell sx={{ fontWeight: 'bold' }}>Semester</TableCell>
                              <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Actions</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {departmentSections.map((section) => (
                              <TableRow key={section.id} hover>
                                <TableCell>
                                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                    {section.name}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Chip 
                                    label={section.department}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2">
                                    Semester {section.semester}
                                  </Typography>
                                </TableCell>
                                <TableCell sx={{ textAlign: 'center' }}>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleEditSection(section)}
                                    sx={{ mr: 1, color: '#1976d2' }}
                                  >
                                    <Edit />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDeleteSection(section.id)}
                                    sx={{ color: '#d32f2f' }}
                                  >
                                    <Delete />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <School sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                          No sections found for {department.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                          Add sections to organize students within this department.
                        </Typography>
                        <Button
                          variant="contained"
                          startIcon={<Add />}
                          onClick={() => {
                            setSelectedDepartment(department.code);
                            handleAddSection();
                          }}
                        >
                          Add First Section
                        </Button>
                      </Box>
                    )}
                  </AccordionDetails>
                </Accordion>
              </Grid>
            );
          })}
      </Grid>

      {/* No departments message */}
      {departments.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Business sx={{ fontSize: 64, color: '#ccc', mb: 3 }} />
          <Typography variant="h5" color="text.secondary" gutterBottom>
            No Departments Found
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            You need to create departments first before adding sections.
          </Typography>
          <Button
            variant="contained"
            onClick={() => {
              // Navigate to department management
              window.history.pushState(null, '', '?view=departments');
              onBack(); // This will return to dashboard, then user can click departments
            }}
          >
            Create Departments First
          </Button>
        </Box>
      )}

      {/* Add/Edit Section Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
          {editingSection ? 'Edit Section' : 'Add New Section'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Section Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., CSE-3A, ECE-4B"
                required
                InputLabelProps={{ shrink: true }}
                sx={{ '& .MuiInputLabel-root': { position: 'static', transform: 'none', fontSize: '0.875rem', marginBottom: 1 } }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel shrink sx={{ position: 'static', transform: 'none', fontSize: '0.875rem', marginBottom: 1 }}>
                  Department
                </InputLabel>
                <Select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  displayEmpty
                >
                  <MenuItem value="">
                    <em>Select Department</em>
                  </MenuItem>
                  {departments.map((department) => (
                    <MenuItem key={department.id} value={department.code}>
                      {department.name} ({department.code})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenDialog(false)} startIcon={<Cancel />}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveSection}
            startIcon={<Save />}
            sx={{ ml: 2 }}
          >
            {editingSection ? 'Update' : 'Add'} Section
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SectionManagement;