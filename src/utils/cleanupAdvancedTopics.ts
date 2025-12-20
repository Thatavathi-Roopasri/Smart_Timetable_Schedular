import { db } from '../firebase';
import { collection, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';

export const cleanupAdvancedTopics = async (userEmail: string) => {
  if (!userEmail) {
    throw new Error('User email is required');
  }

  try {
    console.log('🧹 Starting cleanup of Advanced Topic subjects...');
    
    const subjectsRef = collection(db, 'users', userEmail, 'subjects');
    const querySnapshot = await getDocs(subjectsRef);
    
    let deletedCount = 0;
    const deletePromises: Promise<void>[] = [];

    querySnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      const subjectName = data.name || '';
      const subjectCode = data.code || '';
      
      // Check if it's an Advanced Topic subject
      if (subjectName.includes('Advanced Topic') || subjectCode.startsWith('ADV')) {
        deletePromises.push(
          deleteDoc(doc(db, 'users', userEmail, 'subjects', docSnapshot.id))
        );
        deletedCount++;
        console.log(`Deleting: ${subjectCode} - ${subjectName}`);
      }
    });

    await Promise.all(deletePromises);

    console.log(`✅ Cleanup complete! Deleted ${deletedCount} Advanced Topic subjects`);
    
    return {
      success: true,
      deletedCount,
      message: `Successfully removed ${deletedCount} Advanced Topic subjects from database`
    };

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw new Error(`Cleanup failed: ${error}`);
  }
};
