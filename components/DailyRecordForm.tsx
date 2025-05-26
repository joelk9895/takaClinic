import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/authContext';
import { addDailyRecord, DailyRecord, updateDailyRecord, getUserData } from '../lib/firebaseService';
import { Timestamp } from 'firebase/firestore';

type FormProps = {
  existingRecord?: DailyRecord;
  onSuccess?: () => void;
};

const DailyRecordForm: React.FC<FormProps> = ({ existingRecord, onSuccess }) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doctorName, setDoctorName] = useState('');

  useEffect(() => {
    // Get doctor name when component mounts
    if (user) {
      if (user.displayName) {
        setDoctorName(user.displayName);
      } else {
        // Fetch from Firestore if not in auth object
        getUserData(user.uid)
          .then(userData => {
            setDoctorName(userData.name);
          })
          .catch(err => {
            console.error('Error fetching user data:', err);
          });
      }
    }
  }, [user]);

  const [formData, setFormData] = useState({
    date: existingRecord?.date instanceof Date 
      ? existingRecord.date.toISOString().split('T')[0] 
      : existingRecord?.date 
        ? new Date((existingRecord.date as Timestamp).toDate()).toISOString().split('T')[0] 
        : new Date().toISOString().split('T')[0],
    oldPatientAmount: existingRecord?.oldPatientAmount || 0,
    newPatientAmount: existingRecord?.newPatientAmount || 0,
    oldPatientCount: existingRecord?.oldPatientCount || 0,
    newPatientCount: existingRecord?.newPatientCount || 0,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: name === 'date' ? value : parseFloat(value) || 0
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in to add records');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      
      const recordData = {
        ...formData,
        date: Timestamp.fromDate(new Date(formData.date)),
        doctorId: user.uid,
        doctorName: doctorName,
      };

      if (existingRecord?.id) {
        await updateDailyRecord(existingRecord.id, recordData);
      } else {
        await addDailyRecord(recordData);
      }
      
      setFormData({
        date: new Date().toISOString().split('T')[0],
        oldPatientAmount: 0,
        newPatientAmount: 0,
        oldPatientCount: 0,
        newPatientCount: 0,
      });
      
      if (onSuccess) onSuccess();
    } catch (err) {
      setError('Failed to save record. Please try again.');
      console.error('Error submitting form:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg">
      {/* Simplified header removed to focus on just the form */}
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">{error}</div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="flex justify-between items-center mb-4">
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>

        <div className="mb-4 bg-blue-50 p-4 rounded-md">
          <h3 className="text-md font-medium text-blue-900 mb-2">Daily Summary</h3>
          <p className="text-sm text-blue-700">Enter the four required data points below:</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Old Patient Amount</label>
            <input
              type="number"
              name="oldPatientAmount"
              value={formData.oldPatientAmount}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Patient Amount</label>
            <input
              type="number"
              name="newPatientAmount"
              value={formData.newPatientAmount}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Old Patient Count</label>
            <input
              type="number"
              name="oldPatientCount"
              value={formData.oldPatientCount}
              onChange={handleChange}
              min="0"
              step="1"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Patient Count</label>
            <input
              type="number"
              name="newPatientCount"
              value={formData.newPatientCount}
              onChange={handleChange}
              min="0"
              step="1"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>
        
        {/* Notes field removed as per requirement to focus on just the 4 data points */}
        
        <div className="flex justify-end mt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full md:w-auto bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-medium"
          >
            {isSubmitting ? 'Saving...' : 'Submit Daily Record'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DailyRecordForm;
