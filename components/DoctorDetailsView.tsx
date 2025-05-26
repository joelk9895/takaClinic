import React from 'react';
import { UserData, DailyRecord } from '../lib/firebaseService'; // Assuming DailyRecord is exported
import { DoctorStats, formatDate, formatCurrency } from '../lib/utils';
import { Line, Bar } from 'react-chartjs-2';
import AddExpenseForm from './AddExpenseForm';


// Register ChartJS components if not already registered globally
// ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement);

interface DoctorDetailsViewProps {
  selectedDoctorStats: DoctorStats;
  selectedDoctor: UserData;
  showAddExpense: boolean;
  setShowAddExpense: (show: boolean) => void;
  onExpenseAdded: () => void; // Callback to refresh data
  onBackToList: () => void;
}

const DoctorDetailsView: React.FC<DoctorDetailsViewProps> = ({
  selectedDoctorStats: stat,
  selectedDoctor,
  showAddExpense,
  setShowAddExpense,
  onExpenseAdded,
  onBackToList
}) => {
  if (!stat || !selectedDoctor) {
    return <p>No doctor selected or data available.</p>;
  }

  return (
    <div className="bg-white shadow-xl rounded-lg overflow-hidden mt-6">
      <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold leading-6 text-gray-900">{selectedDoctor.name}</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">{selectedDoctor.email}</p>
        </div>
        <div>
            <button 
                onClick={onBackToList}
                className="mr-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-300"
            >
                Back to List
            </button>
            <button 
                onClick={() => setShowAddExpense(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 flex items-center"
                disabled={showAddExpense} // Disable if form is already shown
            >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Expense
            </button>
        </div>
      </div>

      {/* Add Expense Form */} 
      {showAddExpense && (
        <div className="p-4 sm:p-6 border-b border-gray-200 bg-blue-50">
          <AddExpenseForm
            doctorId={selectedDoctor.uid}
            doctorName={selectedDoctor.name}
            onSuccess={() => {
              setShowAddExpense(false);
              onExpenseAdded(); // Call the refresh callback
            }}
            onCancel={() => setShowAddExpense(false)}
          />
        </div>
      )}

      {/* Doctor's trend charts */} 
      <div className="border-t border-gray-200 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 py-2">
          {/* Patient Trends */} 
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="text-md font-medium text-gray-700 mb-2">Patient Trends</h4>
            <div className="h-48">
              {stat.dailyTrends.dates.length > 0 ? (
                <Line
                  data={{
                    labels: stat.dailyTrends.dates,
                    datasets: [
                      {
                        label: 'Old Patients',
                        data: stat.dailyTrends.oldPatients,
                        borderColor: '#4F46E5',
                        backgroundColor: 'rgba(79, 70, 229, 0.1)',
                        fill: true,
                      },
                      {
                        label: 'New Patients',
                        data: stat.dailyTrends.newPatients,
                        borderColor: '#10B981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        fill: true,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top',
                        align: 'end',
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">No trend data available</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Revenue Trends */} 
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="text-md font-medium text-gray-700 mb-2">Revenue Trends</h4>
            <div className="h-48">
              {stat.dailyTrends.dates.length > 0 ? (
                <Bar
                  data={{
                    labels: stat.dailyTrends.dates,
                    datasets: [
                      {
                        label: 'Old Patient Revenue',
                        data: stat.dailyTrends.oldRevenue,
                        backgroundColor: '#4F46E5',
                      },
                      {
                        label: 'New Patient Revenue',
                        data: stat.dailyTrends.newRevenue,
                        backgroundColor: '#10B981',
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top',
                        align: 'end',
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">No trend data available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Doctor's detailed stats */} 
      <div className="border-t border-gray-200">
        <dl>
          <div className="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Total Records</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{stat.totalRecords}</dd>
          </div>
          <div className="bg-white px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Old Patients</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {stat.totalOldPatients} 
              <span className="text-gray-500 ml-2">(avg. {stat.averages.oldPatientsPerDay.toFixed(1)}/day)</span>
            </dd>
          </div>
          <div className="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">New Patients</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {stat.totalNewPatients}
              <span className="text-gray-500 ml-2">(avg. {stat.averages.newPatientsPerDay.toFixed(1)}/day)</span>
            </dd>
          </div>
          <div className="bg-white px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Old Patient Revenue</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {formatCurrency(stat.totalOldPatientAmount)}
              <span className="text-gray-500 ml-2">(avg. {formatCurrency(stat.averages.oldRevenuePerDay)}/day)</span>
            </dd>
          </div>
          <div className="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">New Patient Revenue</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {formatCurrency(stat.totalNewPatientAmount)}
              <span className="text-gray-500 ml-2">(avg. {formatCurrency(stat.averages.newRevenuePerDay)}/day)</span>
            </dd>
          </div>
          <div className="bg-white px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Total Daily Revenue</dt>
            <dd className="mt-1 text-sm font-medium text-gray-900 sm:mt-0 sm:col-span-2">
              {formatCurrency(stat.averages.totalRevenuePerDay)}/day
            </dd>
          </div>
          <div className="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Projected Monthly Revenue</dt>
            <dd className="mt-1 text-sm font-medium text-blue-600 sm:mt-0 sm:col-span-2">
              {formatCurrency(stat.averages.totalRevenuePerDay * 30)}
            </dd>
          </div>
        </dl>
      </div>
      
      {stat.recentRecords.length > 0 && (
        <div className="px-4 py-5 sm:px-6 border-t border-gray-200">
          <h4 className="text-md font-medium text-gray-900 mb-3">Recent Records</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Old Patients</th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">New Patients</th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Old Revenue</th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">New Revenue</th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(stat.recentRecords as unknown as DailyRecord[]).map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap text-xs">
                      {formatDate(record.date)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs">
                      {record.oldPatientCount}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs">
                      {record.newPatientCount}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs">
                      {formatCurrency(record.oldPatientAmount)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs">
                      {formatCurrency(record.newPatientAmount)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                      {formatCurrency(record.totalAmount || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDetailsView;
