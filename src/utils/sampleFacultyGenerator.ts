import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const generateSampleFaculty = async (userEmail: string): Promise<{success: boolean, message: string}> => {
  try {
    const sampleFaculty = [
      {
        name: 'Dr. Naveen Kumar',
        email: 'naveen.kumar@university.edu',
        department: 'Computer Science Engineering',
        specialization: 'Python Programming',
        phone: '+91-9876543210',
        experience: 8,
        subjects: ['Python Programming', 'Data Structures', 'Web Development']
      },
      {
        name: 'Dr. Pooja Gupta',
        email: 'pooja.gupta@university.edu',
        department: 'Computer Science Engineering',
        specialization: 'Statistics for Data Science',
        phone: '+91-9876543211',
        experience: 6,
        subjects: ['Statistics for Data Science', 'Machine Learning', 'Data Analytics']
      },
      {
        name: 'Prof. Rajesh Sharma',
        email: 'rajesh.sharma@university.edu',
        department: 'Electronics and Communication Engineering',
        specialization: 'Digital Electronics',
        phone: '+91-9876543212',
        experience: 10,
        subjects: ['Digital Electronics', 'Signal Processing', 'Communication Systems']
      },
      {
        name: 'Dr. Anita Verma',
        email: 'anita.verma@university.edu',
        department: 'Artificial Intelligence and Data Science',
        specialization: 'Machine Learning',
        phone: '+91-9876543213',
        experience: 7,
        subjects: ['Machine Learning', 'Deep Learning', 'AI Fundamentals']
      },
      {
        name: 'Prof. Vikram Singh',
        email: 'vikram.singh@university.edu',
        department: 'Computer Science Engineering',
        specialization: 'Database Management',
        phone: '+91-9876543214',
        experience: 9,
        subjects: ['Database Management', 'SQL', 'Big Data']
      },
      {
        name: 'Dr. Priya Patel',
        email: 'priya.patel@university.edu',
        department: 'Artificial Intelligence and Data Science',
        specialization: 'Data Visualization',
        phone: '+91-9876543215',
        experience: 5,
        subjects: ['Data Visualization', 'Business Intelligence', 'Analytics']
      }
    ];

    const facultyRef = collection(db, 'users', userEmail, 'faculties');
    
    for (const faculty of sampleFaculty) {
      await addDoc(facultyRef, faculty);
    }

    return {
      success: true,
      message: `Successfully added ${sampleFaculty.length} sample faculty members to get you started!`
    };
  } catch (error) {
    console.error('Error generating sample faculty:', error);
    return {
      success: false,
      message: 'Failed to generate sample faculty. Please try again.'
    };
  }
};