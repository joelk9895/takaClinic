'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/authContext';
import NavBar from '../../components/NavBar';
import { getDoctors, UserData, getDoctorDailyRecords, getDoctorExpenses, getUserData } from '../../lib/firebaseService';
import { Timestamp } from 'firebase/firestore';
import { formatCurrency, DoctorStats } from '../../lib/utils';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import AddDoctorForm from '../../components/AddDoctorForm';
import DashboardPage from '../../components/DashboardPage';
import DoctorManagementPage from '../../components/DoctorManagementPage';
import FinancialsPage from '../../components/FinancialsPage';
import AnalyticsPage from '../../components/AnalyticsPage';
import SettingsPage from '../../components/SettingsPage';
import { format, subMonths } from 'date-fns';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement);

// AdminSidebar Component
const AdminSidebar = ({ activePage, onPageChange }: { activePage: string; onPageChange: (page: string) => void }) => {
  const menuItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      )
    },
    { 
      id: 'doctors', 
      label: 'Doctors', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    { 
      id: 'financials', 
      label: 'Financials', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    { 
      id: 'analytics', 
      label: 'Analytics', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
  ];

  return (
    <div className="fixed left-0 top-16 h-full w-64 bg-white shadow-sm border-r border-neutral-200/70 z-10">
      <div className="p-6 border-b border-neutral-200/70">
        <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">Admin Portal</h2>
      </div>
      <nav className="p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onPageChange(item.id)}
                className={`w-full flex items-center px-4 py-2.5 text-left rounded-lg transition-all duration-200 ${
                  activePage === item.id
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                }`}
              >
                <span className={`mr-3 ${activePage === item.id ? 'text-primary-600' : 'text-neutral-400'}`}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');
  const [showAddDoctor, setShowAddDoctor] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [doctors, setDoctors] = useState<UserData[]>([]);
  const [doctorStats, setDoctorStats] = useState<DoctorStats[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<UserData | null>(null);
  const [selectedDateRange, setSelectedDateRange] = useState('30');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [dateRangeText, setDateRangeText] = useState('Last 30 days');
  const [showCalendar, setShowCalendar] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const calendarRef = useRef<HTMLDivElement>(null);

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        const userData = await getUserData(user.uid);
        if (userData?.role !== 'admin') {
          router.push('/dashboard');
          return;
        }
        setIsAdmin(true);
      } catch (error) {
        console.error('Error checking admin status:', error);
        router.push('/dashboard');
      }
    };

    if (!loading) {
      checkAdminStatus();
    }
  }, [user, loading, router]);

  // Function to fetch doctors and calculate their stats
  const fetchDoctorsAndStats = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(''); // Clear any previous errors
      
      // Step 1: Fetch doctors
      const fetchedDoctors = await getDoctors();
      setDoctors(fetchedDoctors);
      console.log(`Fetched ${fetchedDoctors.length} doctors`);

      if (fetchedDoctors.length === 0) {
        setError('No doctors found in the database');
        setIsLoading(false);
        return;
      }

      // For each doctor, fetch their statistics
      const stats = await Promise.all(
        fetchedDoctors.map(async (doctor) => {
          // Step 2: Fetch doctor's records and expenses
          console.log(`Fetching records for doctor: ${doctor.name} (${doctor.uid})`);
          const [records, expenses] = await Promise.all([
            getDoctorDailyRecords(doctor.uid),
            getDoctorExpenses(doctor.uid)
          ]);
          console.log(`Found ${records.length} total records and ${expenses.length} expenses for ${doctor.name}`);
          
          // Print some record details for debugging
          if (records.length > 0) {
            console.log('Sample record:', {
              id: records[0].id,
              date: records[0].date instanceof Timestamp ? records[0].date.toDate() : records[0].date,
              oldPatientCount: records[0].oldPatientCount,
              newPatientCount: records[0].newPatientCount,
              oldPatientAmount: records[0].oldPatientAmount,
              newPatientAmount: records[0].newPatientAmount,
              totalAmount: records[0].totalAmount
            });
          }

          // Helper function to check if a date is within the selected range
          const isDateInRange = (dateInput: Date | Timestamp): boolean => {
            if (!dateInput) return false;
            
            // Convert to Date object if it's a Timestamp
            const date = dateInput instanceof Timestamp ? dateInput.toDate() : dateInput;
            
            if (selectedDateRange.startsWith('month:')) {
              // For month-specific selection, get the year and month
              const [year, month] = selectedDateRange.substring(6).split('-').map(Number);
              return date.getFullYear() === year && date.getMonth() === (month - 1);
            } else if (selectedDateRange.startsWith('year:')) {
              // For year-specific selection
              const year = parseInt(selectedDateRange.substring(5));
              return date.getFullYear() === year;
            } else if (selectedDateRange.startsWith('custom:')) {
              // For custom date range selection
              const [, startDateStr, endDateStr] = selectedDateRange.split(':');
              const startDate = new Date(startDateStr);
              const endDate = new Date(endDateStr);
              endDate.setHours(23, 59, 59, 999);
              return date >= startDate && date <= endDate;
            } else {
              // For day range selection
              const daysAgo = parseInt(selectedDateRange, 10);
              if (!isNaN(daysAgo)) {
                const endDate = new Date(); // Today
                const startDate = new Date();
                startDate.setDate(endDate.getDate() - daysAgo);
                return date >= startDate && date <= endDate;
              }
              return false;
            }
          };

          // Filter records by date range
          const filteredRecords = records.filter(record => {
            return isDateInRange(record.date);
          });

          // Filter expenses by date range
          const filteredExpenses = expenses.filter(expense => {
            return isDateInRange(expense.date);
          });

          // Calculate statistics
          const totalRevenue = filteredRecords.reduce((sum, record) => sum + (record.totalAmount || 0), 0);
          const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
          const totalPatients = filteredRecords.reduce((sum, record) => 
            sum + (record.oldPatientCount || 0) + (record.newPatientCount || 0), 0
          );
          const averageDailyRevenue = filteredRecords.length > 0 ? totalRevenue / filteredRecords.length : 0;

          // Create sorted copy of ALL records for prediction models (unfiltered)
          const sortedAllRecords = [...records].sort((a, b) => {
            const dateA = a.date instanceof Timestamp ? a.date.toDate() : 
                        (a.date instanceof Date ? a.date : new Date(a.date));
            const dateB = b.date instanceof Timestamp ? b.date.toDate() : 
                        (b.date instanceof Date ? b.date : new Date(b.date));
            return dateA.getTime() - dateB.getTime();
          });
          
          // Sort filtered records by date for trends
          const sortedFilteredRecords = [...filteredRecords].sort((a, b) => {
            const dateA = a.date instanceof Timestamp ? a.date.toDate() : 
                        (a.date instanceof Date ? a.date : new Date(a.date));
            const dateB = b.date instanceof Timestamp ? b.date.toDate() : 
                        (b.date instanceof Date ? b.date : new Date(b.date));
            return dateA.getTime() - dateB.getTime();
          });

          // Calculate totals for old and new patients
          const totalOldPatients = filteredRecords.reduce((sum, record) => sum + (record.oldPatientCount || 0), 0);
          const totalNewPatients = filteredRecords.reduce((sum, record) => sum + (record.newPatientCount || 0), 0);
          
          // Ensure proper type handling for revenue calculations
          const totalOldPatientAmount = filteredRecords.reduce((sum, record) => {
            const amount = typeof record.oldPatientAmount === 'string' 
              ? parseFloat(record.oldPatientAmount) 
              : (record.oldPatientAmount || 0);
            return sum + amount;
          }, 0);
          
          const totalNewPatientAmount = filteredRecords.reduce((sum, record) => {
            const amount = typeof record.newPatientAmount === 'string' 
              ? parseFloat(record.newPatientAmount) 
              : (record.newPatientAmount || 0);
            return sum + amount;
          }, 0);
          
          // Debug logging to check old patient revenue data
          console.log(`Doctor ${doctor.name} - Total old patient revenue: ${totalOldPatientAmount}`);
          if (filteredRecords.length > 0) {
            console.log('Sample record oldPatientAmount values:');
            filteredRecords.slice(0, 3).forEach((record, idx) => {
              console.log(`Record ${idx+1}: ${record.oldPatientAmount || 0}`);
            });
          }
          
          // Extract data for trends
          const dates = sortedFilteredRecords.map(record => {
            const date = record.date instanceof Timestamp ? record.date.toDate() : 
                       (record.date instanceof Date ? record.date : new Date(record.date));
            return format(date, 'yyyy-MM-dd');
          });
          
          const oldPatients = sortedFilteredRecords.map(record => record.oldPatientCount || 0);
          const newPatients = sortedFilteredRecords.map(record => record.newPatientCount || 0);
          // Ensure oldPatientAmount is properly parsed as a number
          const oldRevenue = sortedFilteredRecords.map(record => {
            // Convert to number if it's a string or use 0 if undefined
            const amount = typeof record.oldPatientAmount === 'string' 
              ? parseFloat(record.oldPatientAmount) 
              : (record.oldPatientAmount || 0);
            return amount;
          });
          // Ensure newPatientAmount is properly parsed as a number
          const newRevenue = sortedFilteredRecords.map(record => {
            // Convert to number if it's a string or use 0 if undefined
            const amount = typeof record.newPatientAmount === 'string' 
              ? parseFloat(record.newPatientAmount) 
              : (record.newPatientAmount || 0);
            return amount;
          });
          // Calculate totalRevenueTrend directly from our fixed oldRevenue and newRevenue arrays
          // This ensures consistent totals across all visualizations
          const totalRevenueTrend = oldRevenue.map((oldAmount, index) => oldAmount + newRevenue[index]);
          
          const doctorStat: DoctorStats = {
            doctor: doctor, // Include the entire doctor object to match the interface
            totalAmount: totalRevenue, // Map totalRevenue to totalAmount as per interface
            totalPatients,
            totalRecords: filteredRecords.length,
            totalExpenses,
            // Populated values from calculations above
            totalOldPatients,
            totalNewPatients,
            totalOldPatientAmount,
            totalNewPatientAmount,
            recentRecords: sortedFilteredRecords.slice(-5).map(record => ({ ...record })) as Record<string, unknown>[],
            dailyTrends: {
              dates,
              oldPatients,
              newPatients,
              oldRevenue,
              newRevenue,
              totalRevenue: totalRevenueTrend
            },
            // Already defined above - just adding a comment to make sure they're properly computed
            averages: {
              oldPatientsPerDay: filteredRecords.length > 0 ? totalOldPatients / filteredRecords.length : 0,
              newPatientsPerDay: filteredRecords.length > 0 ? totalNewPatients / filteredRecords.length : 0, 
              totalPatientsPerDay: filteredRecords.length > 0 ? totalPatients / filteredRecords.length : 0,
              oldRevenuePerDay: filteredRecords.length > 0 ? totalOldPatientAmount / filteredRecords.length : 0,
              newRevenuePerDay: filteredRecords.length > 0 ? totalNewPatientAmount / filteredRecords.length : 0,
              totalRevenuePerDay: averageDailyRevenue
            },
            // Keep the additional properties for backward compatibility
            filteredRecords,
            filteredExpenses: filteredExpenses as unknown as Record<string, unknown>[],
            allRecords: sortedAllRecords
          };

          return doctorStat;
        })
      );

      setDoctorStats(stats);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching doctors and stats:', error);
      setError('Failed to fetch doctors and stats');
      setIsLoading(false);
    }
  };

  // Fetch data when component mounts or when date range changes
  useEffect(() => {
    if (isAdmin && user) {
      fetchDoctorsAndStats();
    }
  }, [isAdmin,  user, selectedDateRange]);

  // Handle calendar outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [calendarRef]);

  // Function to update date range display text
  useEffect(() => {
    // Check if it's a month selection (format: 'month:yyyy-MM')
    if (selectedDateRange.startsWith('month:')) {
      const monthStr = selectedDateRange.substring(6); // Extract yyyy-MM part
      try {
        const date = new Date(monthStr + '-01'); // Create date from yyyy-MM-01
        setDateRangeText(format(date, 'MMMM yyyy'));
      } catch (e) {
        setDateRangeText('Invalid month');
        console.error('Error parsing month:', e);
      }
    } else if (selectedDateRange.startsWith('year:')) {
      // Handle year selection (format: 'year:yyyy')
      const yearStr = selectedDateRange.substring(5); // Extract yyyy part
      setDateRangeText(`Year ${yearStr}`);
    } else if (selectedDateRange.startsWith('custom:')) {
      // Handle custom date range (format: 'custom:yyyy-MM-dd:yyyy-MM-dd')
      const parts = selectedDateRange.split(':');
      try {
        const startDate = new Date(parts[1]);
        const endDate = new Date(parts[2]);
        setDateRangeText(`${format(startDate, 'dd MMM yyyy')} - ${format(endDate, 'dd MMM yyyy')}`);
      } catch (e) {
        setDateRangeText(`Custom date range ${(e as Error)?.message ? `(${(e as Error)?.message})` : ''}`);
      }
    } else {
      // Handle regular day ranges
      switch (selectedDateRange) {
        case '7':
          setDateRangeText('Last 7 days');
          break;
        case '30':
          setDateRangeText('Last 30 days');
          break;
        case '90':
          setDateRangeText('Last 3 months');
          break;
        case '180':
          setDateRangeText('Last 6 months');
          break;
        case '365':
          setDateRangeText('Last 1 year');
          break;
        default:
          // For any other numeric values
          const days = parseInt(selectedDateRange);
          if (!isNaN(days)) {
            setDateRangeText(`Last ${days} days`);
          } else {
            setDateRangeText('30 days'); // Default fallback
          }
      }
    }
  }, [selectedDateRange]);

  // Function to handle quick date range selection
  const handleQuickRangeSelect = (range: string) => {
    setSelectedDateRange(range);
    setShowCalendar(false);
  };
  
  // Function to handle month selection
  const handleMonthSelect = (monthIndex: number) => {
    const monthDate = subMonths(new Date(), monthIndex);
    const monthStr = format(monthDate, 'yyyy-MM');
    setSelectedDateRange(`month:${monthStr}`);
    setShowCalendar(false);
  };
  
  // Function to handle year selection
  const handleYearSelect = (year: number) => {
    setSelectedDateRange(`year:${year}`);
    setShowCalendar(false);
  };
  
  // Function to handle custom date range selection
  const handleCustomDateRange = () => {
    if (customStartDate && customEndDate) {
      setSelectedDateRange(`custom:${customStartDate}:${customEndDate}`);
      setShowCalendar(false);
    }
  };

  // Function to check if the current month is selected
  const isCurrentMonthSelected = (dateRange: string): boolean => {
    if (dateRange.startsWith('month:')) {
      const currentDate = new Date();
      const currentMonthStr = format(currentDate, 'yyyy-MM');
      return dateRange === `month:${currentMonthStr}`;
    }
    return false;
  };

  // Function to show doctor details
  const handleSelectDoctor = async (doctor: UserData | null) => {
    setSelectedDoctor(doctor);
    setShowAddExpense(false); // Hide expense form when switching doctors
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">You don&apos;t have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <NavBar />
      
      <div className="flex h-full pt-16">
        {/* Sidebar Navigation */}
        <aside className="hidden md:block">
          <AdminSidebar activePage={activePage} onPageChange={setActivePage} />
        </aside>
        
        {/* Main Content Area */}
        <main className="flex-1 py-6 px-4 sm:px-6 lg:px-8 ml-0 md:ml-64">
          {/* Page Header with Actions */}
          <div className="flex items-end mb-6 space-y-4 md:space-y-0">
            <div className="flex items-end space-x-3">
              <div className="relative">
                <label htmlFor="dateRange" className="mr-2 text-gray-700 text-sm">Date Range:</label>
                <div className="inline-flex items-center">
                  <button 
                    type="button" 
                    onClick={() => setShowCalendar(!showCalendar)}
                    className="flex items-center justify-between w-64 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                  >
                    <span>{dateRangeText}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </button>

                  {showCalendar && (
                    <div 
                      ref={calendarRef}
                      className="absolute top-full mt-1 left-0 z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-72"
                    >
                      <div className="flex justify-between mb-4">
                        <h3 className="text-sm font-medium text-gray-700">Select Range</h3>
                        <button 
                          onClick={() => setShowCalendar(false)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      
                      <div className="flex flex-col space-y-1 mb-2">
                        <h4 className="text-xs font-medium text-gray-500">Quick Select</h4>
                        <div className="grid grid-cols-2 gap-2">
                          <button 
                            onClick={() => handleQuickRangeSelect('7')} 
                            className={`text-xs p-2 rounded ${selectedDateRange === '7' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 hover:bg-gray-200'}`}
                          >
                            Last 7 days
                          </button>
                          <button 
                            onClick={() => handleQuickRangeSelect('30')} 
                            className={`text-xs p-2 rounded ${selectedDateRange === '30' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 hover:bg-gray-200'}`}
                          >
                            Last 30 days
                          </button>
                          <button 
                            onClick={() => handleQuickRangeSelect('90')} 
                            className={`text-xs p-2 rounded ${selectedDateRange === '90' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 hover:bg-gray-200'}`}
                          >
                            Last 3 months
                          </button>
                          <button 
                            onClick={() => handleQuickRangeSelect('180')} 
                            className={`text-xs p-2 rounded ${selectedDateRange === '180' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 hover:bg-gray-200'}`}
                          >
                            Last 6 months
                          </button>
                        </div>
                      </div>

                      <div className="mt-4">
                        <h4 className="text-xs font-medium text-gray-500 mb-2">Calendar Months</h4>
                        <div className="grid grid-cols-3 gap-2">
                          {Array.from({ length: 12 }).map((_, i) => {
                            const monthDate = subMonths(new Date(), i);
                            const monthStr = format(monthDate, 'MMM yyyy');
                            const monthValue = format(monthDate, 'yyyy-MM');
                            
                            return (
                              <button 
                                key={i}
                                onClick={() => handleMonthSelect(i)}
                                className={`text-xs p-2 rounded ${selectedDateRange === `month:${monthValue}` ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 hover:bg-gray-200'}`}
                              >
                                {monthStr}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <h4 className="text-xs font-medium text-gray-500 mb-2">Years</h4>
                        <div className="grid grid-cols-4 gap-2">
                          {Array.from({ length: 5 }).map((_, i) => {
                            const year = new Date().getFullYear() - i;
                            return (
                              <button 
                                key={i}
                                onClick={() => handleYearSelect(year)}
                                className={`text-xs p-2 rounded ${selectedDateRange === `year:${year}` ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 hover:bg-gray-200'}`}
                              >
                                {year}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <h4 className="text-xs font-medium text-gray-500 mb-2">Custom Date Range</h4>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label htmlFor="startDate" className="block text-xs text-gray-500 mb-1">Start Date</label>
                            <input 
                              id="startDate"
                              type="date" 
                              className="w-full text-xs p-2 border border-gray-300 rounded" 
                              value={customStartDate}
                              onChange={(e) => setCustomStartDate(e.target.value)}
                            />
                          </div>
                          <div>
                            <label htmlFor="endDate" className="block text-xs text-gray-500 mb-1">End Date</label>
                            <input 
                              id="endDate"
                              type="date" 
                              className="w-full text-xs p-2 border border-gray-300 rounded" 
                              value={customEndDate}
                              onChange={(e) => setCustomEndDate(e.target.value)}
                            />
                          </div>
                        </div>
                        <button 
                          className="w-full mt-2 p-2 bg-primary-500 hover:bg-primary-600 text-white rounded text-xs font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                          disabled={!customStartDate || !customEndDate}
                          onClick={handleCustomDateRange}
                      >
                        Apply Custom Range
                      </button>
                    </div>
                    </div>
                    
                  )}
                
                </div>  
              </div>
              {/* Doctor management actions moved to DoctorManagementPage component */}
            </div>
          </div>
          
          {error && (
            <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
              <button
                className="absolute top-0 bottom-0 right-0 px-4 py-3"
                onClick={() => setError('')}
              >
                <span className="sr-only">Dismiss</span>
                <span className="text-red-500">&times;</span>
              </button>
            </div>
          )}
          
          {/* Add Doctor Form */}
          {showAddDoctor && (
            <div className="mb-8">
              <AddDoctorForm 
                onSuccess={() => {
                  setShowAddDoctor(false);
                  // Refresh the doctor list after adding a new doctor
                  fetchDoctorsAndStats();
                }}
                onCancel={() => setShowAddDoctor(false)}
              />
            </div>
          )}
          
          <div className="mt-6">
            {activePage === 'dashboard' && (
              <DashboardPage doctors={doctors} doctorStats={doctorStats} selectedDateRange={selectedDateRange} />
            )}

            {activePage === 'doctors' && (
              <DoctorManagementPage 
                onDoctorAdded={fetchDoctorsAndStats}
              />
            )}

            {activePage === 'financials' && (
              <FinancialsPage 
                doctorStats={doctorStats}
                selectedDoctor={selectedDoctor}
                handleSelectDoctor={handleSelectDoctor}
                showAddExpense={showAddExpense}
                setShowAddExpense={setShowAddExpense}
                fetchDoctorsAndStats={fetchDoctorsAndStats}
                selectedDateRange={selectedDateRange}
                formatCurrency={formatCurrency}
              />
            )}

            {activePage === 'analytics' && (
              <AnalyticsPage 
                doctorStats={doctorStats} 
                selectedDateRange={selectedDateRange} 
                isCurrentMonth={isCurrentMonthSelected(selectedDateRange)}
              />
            )}

            {activePage === 'settings' && (
              <SettingsPage />
            )}
          </div>
        </main>
      </div> 
    </div>
  );
}