import React from 'react';
import { formatCurrency, DoctorStats } from '../lib/utils';



interface DoctorPerformanceTableProps {
  doctorStats: DoctorStats[];
}

const DoctorPerformanceTable: React.FC<DoctorPerformanceTableProps> = ({ doctorStats }) => {
  // Sort doctors by total revenue (highest first)
  const sortedStats = [...doctorStats].sort((a, b) => b.totalAmount - a.totalAmount);
  if (!doctorStats || doctorStats.length === 0) {
    return <p className="text-gray-500">No doctor performance data available.</p>;
  }

  return (
    <div className="glass p-6 rounded-xl shadow-sm border border-neutral-200/50">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-neutral-800">Doctor Performance</h2>
        <div className="flex space-x-2">
          <button className="text-xs bg-neutral-100 hover:bg-neutral-200 text-neutral-600 font-medium py-1.5 px-3 rounded-full transition-colors duration-200">
            Export CSV
          </button>
          <button className="text-xs bg-primary-50 hover:bg-primary-100 text-primary-600 font-medium py-1.5 px-3 rounded-full transition-colors duration-200">
            Print Report
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto -mx-6">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead>
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Doctor
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Total Patients
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                New Patients
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Old Patients
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                New Patient Revenue
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Old Patient Revenue
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Total Revenue
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {sortedStats.map((stat) => (
              <tr key={stat.doctor.id} className="hover:bg-neutral-50 transition-colors duration-150">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold">
                      {stat.doctor.name.charAt(0)}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-neutral-800">{stat.doctor.name}</div>
                      <div className="text-xs text-neutral-500">{stat.doctor.role || 'Doctor'}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-neutral-600 font-medium">{stat.totalPatients}</div>
                  {/* Progress bar */}
                  <div className="w-24 bg-neutral-200 rounded-full h-1.5 mt-1">
                    <div 
                      className="bg-primary-500 h-1.5 rounded-full" 
                      style={{ width: `${Math.min(100, (stat.totalPatients / Math.max(...doctorStats.map(s => s.totalPatients))) * 100)}%` }}
                    ></div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-green-600 font-medium">{stat.totalNewPatients}</div>
                  <div className="text-xs text-neutral-500">{((stat.totalNewPatients / stat.totalPatients) * 100).toFixed(1)}%</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-blue-600 font-medium">{stat.totalOldPatients}</div>
                  <div className="text-xs text-neutral-500">{((stat.totalOldPatients / stat.totalPatients) * 100).toFixed(1)}%</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-neutral-600">{formatCurrency(stat.totalNewPatientAmount)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-neutral-600">{formatCurrency(stat.totalOldPatientAmount)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="text-sm font-bold text-neutral-800">{formatCurrency(stat.totalAmount)}</div>
                  <div className="text-xs text-neutral-500">{((stat.totalAmount / doctorStats.reduce((sum, s) => sum + s.totalAmount, 0)) * 100).toFixed(1)}% of total</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      <div className="flex items-center justify-between border-t border-neutral-200 px-4 py-3 sm:px-6 mt-4">
        <div className="flex-1 flex justify-between sm:hidden">
          <button className="relative inline-flex items-center px-4 py-2 border border-neutral-300 text-sm font-medium rounded-md text-neutral-700 bg-white hover:bg-neutral-50">
            Previous
          </button>
          <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-neutral-300 text-sm font-medium rounded-md text-neutral-700 bg-white hover:bg-neutral-50">
            Next
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-neutral-500">
              Showing <span className="font-medium">1</span> to <span className="font-medium">{doctorStats.length}</span> of{' '}
              <span className="font-medium">{doctorStats.length}</span> results
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-neutral-300 bg-white text-sm font-medium text-neutral-500 hover:bg-neutral-50">
                <span className="sr-only">Previous</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              <button aria-current="page" className="z-10 bg-primary-50 border-primary-500 text-primary-600 relative inline-flex items-center px-4 py-2 border text-sm font-medium">
                1
              </button>
              <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-neutral-300 bg-white text-sm font-medium text-neutral-500 hover:bg-neutral-50">
                <span className="sr-only">Next</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorPerformanceTable;
