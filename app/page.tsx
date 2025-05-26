'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '../lib/authContext';
import NavBar from '../components/NavBar';
import { useState, useEffect } from 'react';
import { getUserData } from '../lib/firebaseService';

export default function Home() {
  const { user, loading } = useAuth();
  const [userRole, setUserRole] = useState<'admin' | 'doctor' | null>(null);
  
  useEffect(() => {
    // Fetch user role when user is logged in
    const fetchUserRole = async () => {
      if (user) {
        try {
          const userData = await getUserData(user.uid);
          setUserRole(userData.role as 'admin' | 'doctor');
        } catch (err) {
          console.error('Error fetching user role:', err);
          // Default to doctor if error
          setUserRole('doctor');
        }
      } else {
        setUserRole(null);
      }
    };
    
    fetchUserRole();
  }, [user]);

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-700 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="md:w-1/2 mb-8 md:mb-0">
                <h1 className="text-4xl md:text-5xl font-bold mb-4">Taka Clinic Management System</h1>
                <p className="text-xl mb-8">
                  Efficiently track patient visits and revenue with our easy-to-use clinic management system.
                </p>
                {!loading && (
                  <div className="space-x-4">
                    {user ? (
                      userRole === 'admin' ? (
                        <Link 
                          href="/admin" 
                          className="bg-white text-blue-600 px-6 py-3 rounded-md font-medium hover:bg-blue-50 transition-colors"
                        >
                          Admin Dashboard
                        </Link>
                      ) : (
                        <Link 
                          href="/entry" 
                          className="bg-white text-blue-600 px-6 py-3 rounded-md font-medium hover:bg-blue-50 transition-colors"
                        >
                          Data Entry Page
                        </Link>
                      )
                    ) : (
                      <>
                        <Link 
                          href="/login"
                          className="bg-white text-blue-600 px-6 py-3 rounded-md font-medium hover:bg-blue-50 transition-colors"
                        >
                          Login
                        </Link>
                        <Link 
                          href="/signup"
                          className="bg-transparent border-2 border-white text-white px-6 py-3 rounded-md font-medium hover:bg-white/10 transition-colors"
                        >
                          Sign Up
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>
              <div className="md:w-1/2 flex justify-center">
                <div className="bg-white rounded-lg shadow-xl p-4 max-w-md">
                  <Image
                    src="/next.svg"
                    alt="Clinic Management"
                    width={400}
                    height={300}
                    className="rounded"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900">Key Features</h2>
              <p className="mt-4 text-lg text-gray-600">Everything you need to manage your clinic efficiently</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="text-blue-600 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Daily Record Entry</h3>
                <p className="text-gray-600">Easily track old and new patient visits and revenue with our intuitive interface.</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="text-blue-600 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Detailed Reports</h3>
                <p className="text-gray-600">Generate detailed reports on patient visits and revenue for any date range.</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="text-blue-600 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Secure Access</h3>
                <p className="text-gray-600">Your data is securely stored with Firebase and accessible only to authorized users.</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-xl font-bold">Taka Clinic</h3>
              <p className="text-gray-400">© {new Date().getFullYear()} All rights reserved.</p>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Contact Us</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
