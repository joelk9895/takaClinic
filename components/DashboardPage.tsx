import React, { useState } from 'react';
import { DoctorStats, formatCurrency } from '../lib/utils';
import { UserData } from '../lib/firebaseService';
import DashboardMetricsCards from './DashboardMetricsCards';
import DoctorPerformanceTable from './DoctorPerformanceTable';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

interface DashboardPageProps {
  doctors: UserData[];
  doctorStats: DoctorStats[];
  selectedDateRange: string;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ doctors, doctorStats }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'performance'>('overview');
  
  // Calculate top performing doctor
  const topDoctor = doctorStats.length > 0 
    ? doctorStats.reduce((prev, current) => (prev.totalAmount > current.totalAmount) ? prev : current)
    : null;
    
  // Calculate total revenue
  const totalRevenue = doctorStats.reduce((sum, stat) => sum + stat.totalAmount, 0);
  
  // Calculate total patients
  const totalPatients = doctorStats.reduce((sum, stat) => sum + stat.totalPatients, 0);
  
  // Calculate average revenue per patient
  const avgRevenuePerPatient = totalPatients > 0 ? totalRevenue / totalPatients : 0;
  
  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6 shadow-lg text-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-2xl font-bold font-plus-jakarta mb-2">Welcome to Taka Clinic Dashboard</h1>
            <p className="text-primary-100 text-sm">Here&apos;s what&apos;s happening with your clinic today</p>
          </div>
        </div>
      </div>
      
      {/* Key Metrics */}
      <DashboardMetricsCards doctors={doctors} doctorStats={doctorStats} />
      
      {/* Quick Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Top Performer */}
        {topDoctor && (
          <div className="glass p-6 rounded-xl shadow-sm border border-neutral-200/50 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Top Performer</h3>
              <span className="p-1.5 rounded-full bg-purple-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </span>
            </div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                {topDoctor.doctor?.name ? topDoctor.doctor.name.charAt(0) : ''}
              </div>
              <div>
                <h4 className="text-lg font-semibold text-neutral-800">{topDoctor.doctor?.name || 'Unknown Doctor'}</h4>
                <p className="text-sm text-neutral-500">{topDoctor.totalPatients} patients</p>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-neutral-500 mb-1">Total Revenue</p>
                <p className="text-xl font-bold text-neutral-800">{formatCurrency(topDoctor.totalAmount)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-neutral-500 mb-1">New Patients</p>
                <p className="text-xl font-bold text-green-600">{topDoctor.totalNewPatients}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Revenue Breakdown */}
        <div className="glass p-6 rounded-xl shadow-sm border border-neutral-200/50 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Revenue Breakdown</h3>
            <span className="p-1.5 rounded-full bg-blue-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </span>
          </div>
          
          <div className="h-48">
            <Doughnut 
              data={{
                labels: ['Old Patients', 'New Patients'],
                datasets: [
                  {
                    data: [
                      doctorStats.reduce((sum, stat) => sum + stat.totalOldPatientAmount, 0),
                      doctorStats.reduce((sum, stat) => sum + stat.totalNewPatientAmount, 0)
                    ],
                    backgroundColor: [
                      'rgba(79, 70, 229, 0.8)', // Primary color for old patients
                      'rgba(16, 185, 129, 0.8)', // Green for new patients
                    ],
                    borderColor: [
                      'rgba(79, 70, 229, 1)',
                      'rgba(16, 185, 129, 1)',
                    ],
                    borderWidth: 1,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      usePointStyle: true,
                      padding: 15,
                    }
                  }
                }
              }}
            />
          </div>
        </div>
        
        {/* Patient Metrics */}
        <div className="glass p-6 rounded-xl shadow-sm border border-neutral-200/50 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Patient Metrics</h3>
            <span className="p-1.5 rounded-full bg-green-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </span>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
              <span className="text-sm text-neutral-600">Total Patients</span>
              <span className="text-lg font-semibold text-neutral-800">{totalPatients}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-sm text-green-700">New Patients</span>
              <span className="text-lg font-semibold text-green-700">{doctorStats.reduce((sum, stat) => sum + stat.totalNewPatients, 0)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-sm text-blue-700">Avg. Revenue/Patient</span>
              <span className="text-lg font-semibold text-blue-700">{formatCurrency(avgRevenuePerPatient)}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabs for Performance Data */}
      <div className="border-b border-neutral-200 mb-6">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 font-medium text-sm border-b-2 ${
              activeTab === 'overview' 
                ? 'border-primary-500 text-primary-600' 
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
            } transition-colors duration-200`}
          >
            Revenue Overview
          </button>
          <button
            onClick={() => setActiveTab('performance')}
            className={`py-4 px-1 font-medium text-sm border-b-2 ${
              activeTab === 'performance' 
                ? 'border-primary-500 text-primary-600' 
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
            } transition-colors duration-200`}
          >
            Doctor Performance
          </button>
        </div>
      </div>
      
      {/* Tab Content */}
      {activeTab === 'overview' ? (
        <div className="glass p-6 rounded-xl shadow-sm border border-neutral-200/50 animate-fadeIn">
          <h3 className="text-lg font-semibold text-neutral-800 mb-6">Revenue Trends</h3>
          <div className="h-80">
            {doctorStats[0]?.dailyTrends.dates.length > 0 ? (
              <Line
                data={{
                  labels: doctorStats[0]?.dailyTrends.dates,
                  datasets: [{
                    label: 'Total Revenue',
                    data: doctorStats[0]?.dailyTrends.dates.map((date, i) => {
                      return doctorStats.reduce((sum, stat) => {
                        return sum + (stat.dailyTrends.totalRevenue[i] || 0);
                      }, 0);
                    }),
                    borderColor: 'rgba(79, 70, 229, 1)',
                    backgroundColor: 'rgba(79, 70, 229, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: 'rgba(79, 70, 229, 1)',
                    pointRadius: 3,
                    pointHoverRadius: 5,
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          let label = context.dataset.label || '';
                          if (label) {
                            label += ': ';
                          }
                          if (context.parsed.y !== null) {
                            label += new Intl.NumberFormat('en-KW', {
                              style: 'currency',
                              currency: 'KWD',
                              minimumFractionDigits: 3,
                              maximumFractionDigits: 3
                            }).format(context.parsed.y);
                          }
                          return label;
                        }
                      }
                    }
                  },
                  scales: {
                    x: {
                      grid: {
                        display: false,
                      },
                      ticks: {
                        maxRotation: 0,
                        maxTicksLimit: 7,
                      }
                    },
                    y: {
                      grid: {
                        color: 'rgba(0, 0, 0, 0.05)',
                      },
                      ticks: {
                        callback: function(value) {
                          return new Intl.NumberFormat('en-KW', {
                            style: 'currency',
                            currency: 'KWD',
                            notation: 'compact',
                            compactDisplay: 'short',
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          }).format(value as number);
                        }
                      }
                    }
                  }
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-neutral-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p className="text-neutral-500">No trend data available in selected date range</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="animate-fadeIn">
          <DoctorPerformanceTable doctorStats={doctorStats} />
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
