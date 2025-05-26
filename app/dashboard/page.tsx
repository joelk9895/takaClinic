'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/authContext';
import DailyRecordForm from '@/components/DailyRecordForm';

// This page is deprecated and redirects users based on their role
export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    const redirect = async () => {
      // Prevent multiple redirects
      if (redirecting) return;
      setRedirecting(true);
      
      // If user is not logged in, redirect to login
      if (!loading && !user) {
        router.push('/login');
        return;
      }
      
      // If still loading, wait
      if (loading) return;
      
    };
    
    redirect();
  }, [user, loading, router, redirecting]);

  // Show loading spinner while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
     <DailyRecordForm />
    </div>
  );
}
