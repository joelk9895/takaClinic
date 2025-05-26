import React from 'react';
import { Line } from 'react-chartjs-2';

interface DailyTrends {
  dates: string[];
  oldPatients: number[];
  newPatients: number[];
  oldRevenue: number[];
  newRevenue: number[];
}

interface RevenueChartsProps {
  clinicDailyTrends: DailyTrends;
  overallClinicRevenue: number;
}

const RevenueCharts: React.FC<RevenueChartsProps> = ({ 
  clinicDailyTrends,
  overallClinicRevenue
}) => {
  // Create data for the line chart
  const revenueData = {
    labels: clinicDailyTrends.dates,
    datasets: [
      {
        label: 'New Patient Revenue',
        data: clinicDailyTrends.newRevenue,
        backgroundColor: 'rgba(79, 70, 229, 0.2)',
        borderColor: 'rgba(79, 70, 229, 1)',
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 1,
        pointHoverRadius: 4
      },
      {
        label: 'Returning Patient Revenue',
        data: clinicDailyTrends.oldRevenue,
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 1,
        pointHoverRadius: 4
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            Revenue Analytics
          </h4>
          <span className="text-xs font-medium text-slate-500 bg-slate-100 py-1 px-2 rounded-full">Daily Revenue</span>
        </div>
        
        <div className="h-64">
          {overallClinicRevenue > 0 ? (
            <Line
              data={revenueData}
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
                        if (typeof tickValue === 'number') {
                          return new Intl.NumberFormat('en-IN', {
                            style: 'currency',
                            currency: 'INR',
                            notation: 'compact',
                            compactDisplay: 'short'
                          }).format(tickValue);
                        }
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
                <p className="text-slate-500">No revenue data available</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RevenueCharts;
