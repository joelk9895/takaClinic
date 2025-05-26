'use client';

import React from 'react';
import DoctorManagementPage from './DoctorManagementPage';

// This is a wrapper component that simply re-exports DoctorManagementPage
// to maintain backward compatibility with existing imports
const DoctorsPage: React.FC<{
  onDoctorAdded?: () => void;
}> = ({ onDoctorAdded }) => {
  return <DoctorManagementPage onDoctorAdded={onDoctorAdded} />;
};

export default DoctorsPage;
