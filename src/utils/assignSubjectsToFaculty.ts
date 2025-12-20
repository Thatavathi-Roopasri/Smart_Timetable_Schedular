import { db } from '../firebase';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';

interface Subject {
  id: string;
  name: string;
  code: string;
  department: string;
  semester: number;
  credits: number;
}

interface Faculty {
  id: string;
  name: string;
  department: string;
  subjects?: string[];
  semester?: number;
}

export const assignSubjectsToFaculty = async (userEmail: string) => {
  if (!userEmail) {
    throw new Error('User email is required');
  }

  try {
    console.log('🔄 Starting to assign subjects to faculty members...');

    // Fetch all subjects
    const subjectsSnapshot = await getDocs(collection(db, 'users', userEmail, 'subjects'));
    const subjects: Subject[] = [];
    subjectsSnapshot.forEach((doc) => {
      subjects.push({ id: doc.id, ...doc.data() } as Subject);
    });

    console.log(`📚 Found ${subjects.length} subjects`);

    if (subjects.length === 0) {
      throw new Error('No subjects found in database. Please add subjects first.');
    }

    // Fetch all faculty
    const facultySnapshot = await getDocs(collection(db, 'users', userEmail, 'faculties'));
    const faculties: Faculty[] = [];
    facultySnapshot.forEach((doc) => {
      faculties.push({ id: doc.id, ...doc.data() } as Faculty);
    });

    console.log(`👨‍🏫 Found ${faculties.length} faculty members`);

    if (faculties.length === 0) {
      throw new Error('No faculty found in database. Please add faculty first.');
    }

    // Group subjects by department
    const subjectsByDept: Record<string, Subject[]> = {
      'CSE': subjects.filter(sub => sub.department === 'CSE'),
      'ECE': subjects.filter(sub => sub.department === 'ECE'),
      'AIDS': subjects.filter(sub => sub.department === 'AIDS')
    };

    // Assign subjects to each faculty member
    let updatedCount = 0;
    let skippedCount = 0;

    for (const faculty of faculties) {
      // Skip if faculty doesn't have an ID
      if (!faculty.id) {
        console.log(`⚠️ Skipping faculty without ID: ${faculty.name}`);
        skippedCount++;
        continue;
      }

      // Map faculty department to subject department code - handle all variations
      let deptCode = null;
      
      if (faculty.department.includes('Computer Science') || faculty.department === 'CSE') {
        deptCode = 'CSE';
      } else if (faculty.department.includes('Electronics') || faculty.department.includes('Communication') || faculty.department === 'ECE') {
        deptCode = 'ECE';
      } else if (faculty.department.includes('Artificial Intelligence') || faculty.department.includes('Data Science') || faculty.department === 'AIDS') {
        deptCode = 'AIDS';
      }

      if (!deptCode) {
        console.log(`⚠️ Unknown department for ${faculty.name}: ${faculty.department} - defaulting to CSE`);
        deptCode = 'CSE'; // Default to CSE if department unclear
      }

      // Find subjects that match the faculty's department
      const deptSubjects = subjectsByDept[deptCode] || [];

      // If no subjects in their department, use any available subjects
      let assignedSubjects: string[] = [];
      
      if (deptSubjects.length === 0) {
        console.log(`⚠️ No ${deptCode} subjects found for ${faculty.name}, using any available subjects`);
        const allAvailableSubjects = [...subjectsByDept['CSE'], ...subjectsByDept['ECE'], ...subjectsByDept['AIDS']];
        if (allAvailableSubjects.length > 0) {
          const numSubjects = Math.min(Math.floor(Math.random() * 3) + 1, allAvailableSubjects.length);
          assignedSubjects = allAvailableSubjects
            .sort(() => 0.5 - Math.random())
            .slice(0, numSubjects)
            .map(s => s.id);
        }
      } else {
        // Ensure at least 1 subject, maximum 3 subjects per faculty
        const numSubjects = Math.min(Math.floor(Math.random() * 3) + 1, deptSubjects.length);
        assignedSubjects = deptSubjects
          .sort(() => 0.5 - Math.random())
          .slice(0, numSubjects)
          .map(s => s.id);
      }

      // Randomly assign semester 1, 2, or 3
      const assignedSemester = Math.floor(Math.random() * 3) + 1;

      // Update faculty document - ALWAYS UPDATE, even if no subjects
      try {
        const facultyRef = doc(db, 'users', userEmail, 'faculties', faculty.id);
        await updateDoc(facultyRef, {
          subjects: assignedSubjects,
          semester: assignedSemester,
          updatedAt: new Date()
        });

        updatedCount++;
        console.log(`✅ Updated ${faculty.name}: ${assignedSubjects.length} subjects, Semester ${assignedSemester}`);
      } catch (error) {
        console.error(`❌ Failed to update ${faculty.name}:`, error);
        skippedCount++;
      }
    }

    console.log(`🎉 Successfully updated ${updatedCount} faculty members, skipped ${skippedCount}`);
    
    if (updatedCount === 0) {
      throw new Error('No faculty members were updated. Please check if subjects exist in the database.');
    }

    return {
      success: true,
      message: `Successfully assigned subjects to ${updatedCount} faculty members! ${skippedCount > 0 ? `(Skipped ${skippedCount})` : ''}`,
      updatedCount,
      skippedCount
    };

  } catch (error) {
    console.error('❌ Error assigning subjects to faculty:', error);
    throw error;
  }
};
