'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/authContext';
import DailyRecordForm from '../../components/DailyRecordForm';
import { getUserData } from '../../lib/firebaseService';

export default function EntryPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  // Removed lastRecord state since doctors don't need to see past data
  const [isLoading, setIsLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    // If user is not logged in and not in loading state, redirect to login
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    // Check user role and redirect if not doctor
    const checkUserRole = async () => {
      try {
        if (user) {
          const userData = await getUserData(user.uid);
          if (userData.role !== 'doctor') {
            console.log('Redirecting admin user to admin dashboard');
            router.push('/admin');
            return;
          }
          // User is a doctor, continue with entry page
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error checking user role:', err);
        setIsLoading(false);
      }
    };
    
    checkUserRole();
  }, [user, loading, router]);

  const handleFormSuccess = () => {
    setSuccessMessage('Record saved successfully!');
    // Clear success message after 3 seconds
    setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
    
    // No need to refresh records since doctors don't see past data
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Taka Clinic</h1>
          <div className="flex items-center space-x-3">
            <div className="flex items-center">
              <span className="text-sm font-medium mr-2">{user?.email}</span>
              <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-md">Doctor</span>
            </div>
            <button 
              onClick={handleLogout}
              className="bg-white text-blue-600 px-3 py-1 rounded-md text-sm hover:bg-blue-50"
              aria-label="Logout"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      
      <main className="flex justify-center items-center p-4 max-w-xl mx-auto mt-6">
        <div className="bg-white rounded-lg shadow-md overflow-hidden w-full">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Daily Patient Record Entry</h2>
              <div className="text-sm text-gray-500">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
            
            {successMessage && (
              <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
                {successMessage}
              </div>
            )}
            
            <DailyRecordForm onSuccess={handleFormSuccess} />
            
            <div className="mt-4 pt-4 border-t border-gray-100 text-center text-xs text-gray-500">
              Enter today&apos;s patient data. This form cannot be used to view or edit past entries.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
