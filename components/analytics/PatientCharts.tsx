import React from 'react';
import { Bar } from 'react-chartjs-2';
import { DailyTrends } from '../types/analytics';

interface PatientChartsProps {
  clinicDailyTrends: DailyTrends;
  overallClinicPatients: number;
}

const PatientCharts: React.FC<PatientChartsProps> = ({ 
  clinicDailyTrends,
  overallClinicPatients
}) => {
  // Create data for the bar chart
  const patientCountData = {
    labels: clinicDailyTrends.dates,
    datasets: [
      {
        label: 'New Patients',
        data: clinicDailyTrends.newPatients,
        backgroundColor: 'rgba(79, 70, 229, 0.7)',
        borderColor: 'rgba(79, 70, 229, 1)',
        borderWidth: 1,
        borderRadius: 4,
        barThickness: 'flex' as const,
      },
      {
        label: 'Returning Patients',
        data: clinicDailyTrends.oldPatients,
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
        borderRadius: 4,
        barThickness: 'flex' as const,
      }
    ]
  };
  
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300 group relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-full opacity-60 group-hover:scale-110 transition-transform duration-500"></div>
      <div className="absolute -left-6 -bottom-6 w-20 h-20 bg-gradient-to-tr from-indigo-100 to-blue-50 rounded-full opacity-60 group-hover:scale-110 transition-transform duration-500"></div>
      
      <div className="relative">
        <div className="flex justify-between items-center mb-5">
          <h4 className="text-lg font-semibold text-slate-800 flex items-center">
            <span className="p-1.5 rounded-full bg-blue-100 mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </span>
            Patient Analytics
          </h4>
          <span className="text-xs font-medium text-slate-500 bg-slate-100 py-1 px-2 rounded-full">Patient Count</span>
        </div>
        
        <div className="h-64">
          {overallClinicPatients > 0 ? (
            <Bar
              data={patientCountData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      usePointStyle: true,
                      padding: 15,
                      font: {
                        size: 12
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
                      callback: function(tickValue) {
                        return tickValue;
                      }
                    }
                  }
                }
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-slate-500">No patient data available</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientCharts;
