import { db, auth } from './firebase';
import { collection, addDoc, getDocs, query, where, orderBy, Timestamp, updateDoc, doc, getDoc, deleteDoc, limit, writeBatch } from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

// User Types
export type UserRole = 'admin' | 'doctor';

export interface UserData {
  id?: string;
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  photoURL?: string;
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

// Interface for DailyRecord
export interface DailyRecord {
  id?: string;
  date: Date | Timestamp;
  oldPatientAmount: number;
  newPatientAmount: number;
  oldPatientCount: number;
  newPatientCount: number;
  totalAmount?: number;
  totalPatientCount?: number;
  doctorId: string;
  doctorName: string;
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

// Collection names
const USERS_COLLECTION = 'users';
const DAILY_RECORDS_COLLECTION = 'dailyRecords';
const EXPENSES_COLLECTION = 'expenses';

// Interface for Expense
export interface Expense {
  id?: string;
  doctorId: string;
  doctorName: string;
  amount: number;
  description: string;
  date: Date | Timestamp;
  category: string;
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

// User management functions
export const createUser = async (email: string, password: string, name: string, role: UserRole = 'doctor') => {
  try {
    // Create auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update display name
    await updateProfile(user, { displayName: name });
    
    // Store additional user data
    const userData: UserData = {
      uid: user.uid,
      email: user.email || email,
      name,
      role,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    
    await addDoc(collection(db, USERS_COLLECTION), userData);
    return userData;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

// Get user data by uid
export const getUserData = async (uid: string) => {
  try {
    const q = query(collection(db, USERS_COLLECTION), where('uid', '==', uid), limit(1));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      throw new Error('User not found');
    }
    
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as UserData;
  } catch (error) {
    console.error('Error getting user data:', error);
    throw error;
  }
};

// NOTE: Profile photo upload functionality has been removed as Firebase Storage is a paid feature

// Update user profile
export const updateUserProfile = async (userId: string, userData: Partial<UserData>, currentPassword?: string, newEmail?: string) => {
  try {
    // First get the document ID by querying with the uid
    const q = query(collection(db, USERS_COLLECTION), where('uid', '==', userId), limit(1));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      throw new Error('User not found');
    }
    
    const docRef = querySnapshot.docs[0].ref;
    const currentUser = auth.currentUser;
    
    // If email is being updated and we have the current password
    if (newEmail && currentPassword && currentUser) {
      // For security, we need to reauthenticate the user before changing email
      // This would typically need to be done by the user themselves
      // Here we're just updating the Firestore document
      
      // Update the email in Firestore
      userData.email = newEmail;
    }
    
    // Update the user data with timestamp
    const updatedData = {
      ...userData,
      updatedAt: Timestamp.now()
    };
    
    await updateDoc(docRef, updatedData);
    
    // If name is being updated, also update the auth profile
    if (userData.name && currentUser) {
      await updateProfile(currentUser, { displayName: userData.name });
    }
    
    // NOTE: Photo upload functionality has been removed as Firebase Storage is a paid feature
    
    return { id: docRef.id, ...updatedData };
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Get all doctors
export const getDoctors = async () => {
  try {
    const q = query(collection(db, USERS_COLLECTION), where('role', '==', 'doctor'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as UserData[];
  } catch (error) {
    console.error('Error getting doctors:', error);
    throw error;
  }
};

// Add a new daily record
export const addDailyRecord = async (recordData: Omit<DailyRecord, 'id' | 'createdAt' | 'updatedAt' | 'totalAmount' | 'totalPatientCount'>) => {
  try {
    // Calculate totals
    const totalAmount = recordData.oldPatientAmount + recordData.newPatientAmount;
    const totalPatientCount = recordData.oldPatientCount + recordData.newPatientCount;
    
    const recordWithTotals = {
      ...recordData,
      totalAmount,
      totalPatientCount,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    
    const docRef = await addDoc(collection(db, DAILY_RECORDS_COLLECTION), recordWithTotals);
    return { id: docRef.id, ...recordWithTotals };
  } catch (error) {
    console.error('Error adding daily record:', error);
    throw error;
  }
};

// Get all daily records for a specific doctor, ordered by date
export const getDoctorDailyRecords = async (doctorId: string) => {
  try {
    const q = query(
      collection(db, DAILY_RECORDS_COLLECTION),
      where('doctorId', '==', doctorId),
      orderBy('date', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as DailyRecord[];
  } catch (error) {
    console.error('Error getting doctor daily records:', error);
    throw error;
  }
};

// Get a specific daily record by ID
export const getDailyRecord = async (recordId: string) => {
  try {
    const docRef = doc(db, DAILY_RECORDS_COLLECTION, recordId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as DailyRecord;
    } else {
      throw new Error('Record does not exist');
    }
  } catch (error) {
    console.error('Error getting daily record:', error);
    throw error;
  }
};

// Update a daily record
export const updateDailyRecord = async (recordId: string, recordData: Partial<DailyRecord>) => {
  try {
    // Recalculate totals if any of the components changed
    const updatedData = { ...recordData, updatedAt: Timestamp.now() };
    
    if (recordData.oldPatientAmount !== undefined || recordData.newPatientAmount !== undefined) {
      // Get current record to calculate correct total
      const currentRecord = await getDailyRecord(recordId);
      const oldAmount = recordData.oldPatientAmount ?? currentRecord.oldPatientAmount;
      const newAmount = recordData.newPatientAmount ?? currentRecord.newPatientAmount;
      updatedData.totalAmount = oldAmount + newAmount;
    }
    
    if (recordData.oldPatientCount !== undefined || recordData.newPatientCount !== undefined) {
      // Get current record to calculate correct total
      const currentRecord = await getDailyRecord(recordId);
      const oldCount = recordData.oldPatientCount ?? currentRecord.oldPatientCount;
      const newCount = recordData.newPatientCount ?? currentRecord.newPatientCount;
      updatedData.totalPatientCount = oldCount + newCount;
    }
    
    const docRef = doc(db, DAILY_RECORDS_COLLECTION, recordId);
    await updateDoc(docRef, updatedData);
    return { id: recordId, ...updatedData };
  } catch (error) {
    console.error('Error updating daily record:', error);
    throw error;
  }
};

// Delete a daily record
export const deleteDailyRecord = async (recordId: string) => {
  try {
    const docRef = doc(db, DAILY_RECORDS_COLLECTION, recordId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error('Error deleting daily record:', error);
    throw error;
  }
};

// Expense management functions
export const addExpense = async (expenseData: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const expenseWithTimestamps = {
      ...expenseData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    
    const docRef = await addDoc(collection(db, EXPENSES_COLLECTION), expenseWithTimestamps);
    return { id: docRef.id, ...expenseWithTimestamps };
  } catch (error) {
    console.error('Error adding expense:', error);
    throw error;
  }
};

export const getDoctorExpenses = async (doctorId: string) => {
  try {
    const q = query(
      collection(db, EXPENSES_COLLECTION),
      where('doctorId', '==', doctorId),
      orderBy('date', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Expense[];
  } catch (error) {
    console.error('Error getting doctor expenses:', error);
    throw error;
  }
};

export const updateExpense = async (expenseId: string, expenseData: Partial<Expense>) => {
  try {
    const updatedData = { ...expenseData, updatedAt: Timestamp.now() };
    const docRef = doc(db, EXPENSES_COLLECTION, expenseId);
    await updateDoc(docRef, updatedData);
    return { id: expenseId, ...updatedData };
  } catch (error) {
    console.error('Error updating expense:', error);
    throw error;
  }
};

export const deleteExpense = async (expenseId: string) => {
  try {
    const docRef = doc(db, EXPENSES_COLLECTION, expenseId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error('Error deleting expense:', error);
    throw error;
  }
};

// Delete a user and all associated records
export const deleteUser = async (userId: string) => {
  try {
    // First get the document ID by querying with the uid
    const q = query(collection(db, USERS_COLLECTION), where('uid', '==', userId), limit(1));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      throw new Error('User not found');
    }
    
    // Get the document reference for the user
    const userDocRef = querySnapshot.docs[0].ref;
    
    // Delete all daily records associated with this doctor
    const dailyRecordsQuery = query(
      collection(db, DAILY_RECORDS_COLLECTION),
      where('doctorId', '==', userId)
    );
    const dailyRecordsSnapshot = await getDocs(dailyRecordsQuery);
    
    // Use a batch to delete all daily records
    let batch = null;
    let operationCount = 0;
    const MAX_BATCH_SIZE = 500; // Firestore limit
    
    for (const docSnapshot of dailyRecordsSnapshot.docs) {
      if (!batch) {
        batch = writeBatch(db);
      }
      
      batch.delete(docSnapshot.ref);
      operationCount++;
      
      // If batch is full, commit it and start a new one
      if (operationCount >= MAX_BATCH_SIZE) {
        await batch.commit();
        batch = null;
        operationCount = 0;
      }
    }
    
    // Commit any remaining daily record deletions
    if (batch) {
      await batch.commit();
      batch = null;
      operationCount = 0;
    }
    
    // Delete all expenses associated with this doctor
    const expensesQuery = query(
      collection(db, EXPENSES_COLLECTION),
      where('doctorId', '==', userId)
    );
    const expensesSnapshot = await getDocs(expensesQuery);
    
    // Use a batch to delete all expenses
    for (const docSnapshot of expensesSnapshot.docs) {
      if (!batch) {
        batch = writeBatch(db);
      }
      
      batch.delete(docSnapshot.ref);
      operationCount++;
      
      // If batch is full, commit it and start a new one
      if (operationCount >= MAX_BATCH_SIZE) {
        await batch.commit();
        batch = null;
        operationCount = 0;
      }
    }
    
    // Commit any remaining expense deletions
    if (batch) {
      await batch.commit();
    }
    
    // Finally, delete the user document
    await deleteDoc(userDocRef);
    
    // Note: This doesn't delete the Auth user, which would require Firebase Admin SDK
    // For complete removal, consider adding server-side function with Admin SDK
    
    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

// Get expenses within a date range for a specific doctor
export const getExpensesInDateRange = async (doctorId: string, startDate: Date, endDate: Date) => {
  try {
    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);
    
    const q = query(
      collection(db, EXPENSES_COLLECTION),
      where('doctorId', '==', doctorId),
      where('date', '>=', startTimestamp),
      where('date', '<=', endTimestamp),
      orderBy('date', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Expense[];
  } catch (error) {
    console.error('Error getting expenses in date range:', error);
    throw error;
  }
};

// Get daily records within a date range for a specific user
export const getRecordsInDateRange = async (doctorId: string, startDate: Date, endDate: Date) => {
  try {
    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);
    
    const q = query(
      collection(db, DAILY_RECORDS_COLLECTION),
      where('doctorId', '==', doctorId),
      where('date', '>=', startTimestamp),
      where('date', '<=', endTimestamp),
      orderBy('date', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as DailyRecord[];
  } catch (error) {
    console.error('Error getting records in date range:', error);
    throw error;
  }
};

// Get summary statistics for a specific user over a time period
export const getUserStatistics = async (userId: string, startDate: Date, endDate: Date) => {
  try {
    const records = await getRecordsInDateRange(userId, startDate, endDate);
    
    const summary = records.reduce((acc, record) => {
      return {
        totalOldPatientAmount: acc.totalOldPatientAmount + record.oldPatientAmount,
        totalNewPatientAmount: acc.totalNewPatientAmount + record.newPatientAmount,
        totalOldPatientCount: acc.totalOldPatientCount + record.oldPatientCount,
        totalNewPatientCount: acc.totalNewPatientCount + record.newPatientCount,
        totalAmount: acc.totalAmount + (record.totalAmount || 0),
        totalPatientCount: acc.totalPatientCount + (record.totalPatientCount || 0),
        recordCount: acc.recordCount + 1,
      };
    }, {
      totalOldPatientAmount: 0,
      totalNewPatientAmount: 0,
      totalOldPatientCount: 0,
      totalNewPatientCount: 0,
      totalAmount: 0,
      totalPatientCount: 0,
      recordCount: 0,
    });
    
    return {
      ...summary,
      averagePerDay: summary.recordCount > 0 ? summary.totalAmount / summary.recordCount : 0,
      averagePatientsPerDay: summary.recordCount > 0 ? summary.totalPatientCount / summary.recordCount : 0,
      dateRange: { start: startDate, end: endDate },
      recordCount: summary.recordCount,
    };
  } catch (error) {
    console.error('Error getting user statistics:', error);
    throw error;
  }
};
