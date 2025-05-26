import React from 'react';
import { UserData } from '../lib/firebaseService'; // Assuming UserData is exported from firebaseService
import { formatCurrency, DoctorStats } from '../lib/utils';



interface DashboardMetricsCardsProps {
  doctors: UserData[];
  doctorStats: DoctorStats[];
}

const DashboardMetricsCards: React.FC<DashboardMetricsCardsProps> = ({ doctors, doctorStats }) => {
  // Calculate percentage change (placeholder for now - would need historical data)
  const getRandomChange = () => {
    return (Math.random() * 20 - 5).toFixed(1);
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="glass p-6 rounded-xl shadow-sm border border-neutral-200/50 hover:shadow-md transition-all duration-300">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Total Doctors</h2>
          <span className="p-1.5 rounded-full bg-primary-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </span>
        </div>
        <div className="flex items-end justify-between">
          <p className="text-3xl font-bold text-neutral-800 font-plus-jakarta">{doctors.length}</p>
          <div className="flex items-center text-xs font-medium text-green-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            {getRandomChange()}%
          </div>
        </div>
      </div>

      <div className="glass p-6 rounded-xl shadow-sm border border-neutral-200/50 hover:shadow-md transition-all duration-300">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Total Patients</h2>
          <span className="p-1.5 rounded-full bg-blue-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </span>
        </div>
        <div className="flex items-end justify-between">
          <p className="text-3xl font-bold text-neutral-800 font-plus-jakarta">
            {doctorStats.reduce((sum, stat) => sum + stat.totalPatients, 0)}
          </p>
          <div className="flex items-center text-xs font-medium text-green-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            {getRandomChange()}%
          </div>
        </div>
      </div>

      <div className="glass p-6 rounded-xl shadow-sm border border-neutral-200/50 hover:shadow-md transition-all duration-300">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wider">New Patients</h2>
          <span className="p-1.5 rounded-full bg-green-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </span>
        </div>
        <div className="flex items-end justify-between">
          <p className="text-3xl font-bold text-green-600 font-plus-jakarta">
            {doctorStats.reduce((sum, stat) => sum + stat.totalNewPatients, 0)}
          </p>
          <div className="flex items-center text-xs font-medium text-green-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            {getRandomChange()}%
          </div>
        </div>
      </div>

      <div className="glass p-6 rounded-xl shadow-sm border border-neutral-200/50 hover:shadow-md transition-all duration-300">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Total Revenue</h2>
          <span className="p-1.5 rounded-full bg-purple-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
        </div>
        <div className="flex items-end justify-between">
          <p className="text-3xl font-bold text-primary-600 font-plus-jakarta">
            {formatCurrency(doctorStats.reduce((sum, stat) => sum + stat.totalAmount, 0))}
          </p>
          <div className="flex items-center text-xs font-medium text-green-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            {getRandomChange()}%
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardMetricsCards;
