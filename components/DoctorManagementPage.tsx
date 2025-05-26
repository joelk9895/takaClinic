import React, { useState, useEffect } from 'react';
import { UserData, getDoctors, deleteUser } from '../lib/firebaseService';
import AddDoctorForm from './AddDoctorForm';
import EditDoctorProfileForm from './EditDoctorProfileForm';
import Image from 'next/image';

interface DoctorManagementPageProps {
  onDoctorAdded?: () => void;
}

const DoctorManagementPage: React.FC<DoctorManagementPageProps> = ({ onDoctorAdded }) => {
  const [doctors, setDoctors] = useState<UserData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [showAddDoctor, setShowAddDoctor] = useState<boolean>(false);
  const [selectedDoctor, setSelectedDoctor] = useState<UserData | null>(null);
  const [showEditProfile, setShowEditProfile] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [doctorToDelete, setDoctorToDelete] = useState<{id: string, name: string} | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  
  // Fetch all doctors
  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const doctorsData = await getDoctors();
      setDoctors(doctorsData);
      setError('');
    } catch (err) {
      console.error('Error fetching doctors:', err);
      setError('Failed to load doctors. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleDoctorAdded = () => {
    setShowAddDoctor(false);
    fetchDoctors();
    if (onDoctorAdded) onDoctorAdded();
  };



  const handleEditProfile = (doctor: UserData) => {
    setSelectedDoctor(doctor);
    setShowEditProfile(true);
  };
  
  const handleProfileUpdated = () => {
    setShowEditProfile(false);
    setSelectedDoctor(null);
    fetchDoctors(); // Refresh the doctor list after update
  };

  const handleRemoveDoctor = async (doctorId: string, doctorName: string) => {
    setDoctorToDelete({ id: doctorId, name: doctorName });
    setShowDeleteConfirm(true);
  };

  const confirmDeleteDoctor = async () => {
    if (!doctorToDelete) return;
    
    try {
      setIsDeleting(true);
      setError('');
      
      await deleteUser(doctorToDelete.id);
      
      // Close dialog and refresh list
      setShowDeleteConfirm(false);
      setDoctorToDelete(null);
      fetchDoctors();
      
      // Notify parent component if needed
      if (onDoctorAdded) onDoctorAdded();
    } catch (err) {
      console.error('Error deleting doctor:', err);
      setError(`Failed to delete doctor: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDeleteDoctor = () => {
    setShowDeleteConfirm(false);
    setDoctorToDelete(null);
  };

  const handleResetPassword = async () => {
    // This would need to be implemented in firebaseService.ts
    // For now, show a notification that this feature is coming soon
    alert('Password reset functionality will be available soon.');
  };

  return (
    <div className="max-w-7xl min-w-5xl mx-auto">
      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && doctorToDelete && (
        <div className="fixed inset-0 backdrop-blur-lg bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full p-6 animate-fade-in">
            <div className="flex items-center mb-4">
              <div className="rounded-full bg-red-100 p-2 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Confirm Doctor Removal</h3>
            </div>
            
            <p className="mb-6 text-gray-600">
              Are you sure you want to remove <span className="font-semibold">Dr. {doctorToDelete.name}</span>? This action will delete all patient records and expenses associated with this doctor and cannot be undone.
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelDeleteDoctor}
                disabled={isDeleting}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteDoctor}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 flex items-center"
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : 'Delete Doctor'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-blue-600">Doctor Management</h2>
        <button
          onClick={() => setShowAddDoctor(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 text-sm font-medium flex items-center transition-colors duration-200 shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add New Doctor
        </button>
      </div>
      
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-primary-50 rounded-xl p-6 mb-8 border border-blue-100 shadow-sm backdrop-blur-md">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white bg-opacity-80 rounded-lg shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-lg text-neutral-800">Doctor Directory</h3>
            <p className="text-sm text-neutral-600 mt-2">
              Manage your clinic&apos;s doctors, create new accounts, and update their profiles. Select any doctor card below to edit their details.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg shadow-sm mb-6" role="alert">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
          <button
            className="absolute top-3 right-3 text-red-400 hover:text-red-600 transition-colors duration-200"
            onClick={() => setError('')}
          >
            <span className="sr-only">Dismiss</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {showAddDoctor && (
        <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-neutral-200">
          <h3 className="text-lg font-medium text-neutral-800 mb-4">Add New Doctor</h3>
          <AddDoctorForm 
            onSuccess={handleDoctorAdded}
            onCancel={() => setShowAddDoctor(false)}
          />
        </div>
      )}
      
      {showEditProfile && selectedDoctor && (
        <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-neutral-200">
          <h3 className="text-lg font-medium text-neutral-800 mb-4">Edit Doctor Profile</h3>
          <EditDoctorProfileForm
            doctor={selectedDoctor}
            onSuccess={handleProfileUpdated}
            onCancel={() => setShowEditProfile(false)}
          />
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <svg className="animate-spin h-8 w-8 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : doctors.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-8 text-center">
          <div className="flex flex-col items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-primary-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-neutral-600 text-lg mb-2">No doctors found</p>
            <p className="text-neutral-500">Add your first doctor using the button above</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {doctors.map((doctor) => (
            <div key={doctor.uid} className="group bg-white backdrop-blur-sm rounded-xl shadow-sm border border-neutral-200 hover:shadow-lg hover:border-primary-200 transition-all duration-300 overflow-hidden cursor-pointer">
              <div className="relative p-6">
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 bg-primary-50 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                
                <div className="flex items-center gap-4 mb-5">
                  {doctor.photoURL ? (
                    <div className="flex-shrink-0 h-14 w-14 rounded-full overflow-hidden shadow-sm">
                      <div className="relative h-full w-full">
                        <Image
                          src={doctor.photoURL}
                          alt={`${doctor.name}'s profile photo`}
                          fill
                          style={{ objectFit: 'cover' }}
                          className="rounded-full"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex-shrink-0 h-14 w-14 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center shadow-sm">
                      <span className="text-primary-700 font-semibold text-lg">{doctor.name.substring(0, 2).toUpperCase()}</span>
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="text-lg font-semibold text-neutral-800 truncate">Dr. {doctor.name}</h4>
                    <p className="text-xs text-neutral-500 mt-1">
                      {doctor.role} • {doctor.email}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex justify-between items-center">
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleEditProfile(doctor)}
                      className="px-3 py-1.5 text-xs font-medium text-primary-700 bg-primary-50 border border-primary-100 rounded-md hover:bg-primary-100 transition-colors duration-200 focus:outline-none"
                    >
                      Edit Profile
                    </button>
                    <button
                      onClick={() => handleResetPassword()}
                      className="px-3 py-1.5 text-xs font-medium text-primary-700 bg-primary-50 border border-primary-100 rounded-md hover:bg-primary-100 transition-colors duration-200 focus:outline-none"
                    >
                      Reset Password
                    </button>
                  </div>
                  
                  <button
                    onClick={() => handleRemoveDoctor(doctor.uid, doctor.name)}
                    className="px-3 py-1.5 text-xs font-medium text-red-600 bg-white border border-red-100 rounded-md hover:bg-red-50 transition-colors duration-200 focus:outline-none"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctorManagementPage;
