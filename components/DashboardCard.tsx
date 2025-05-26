import React from 'react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  percentChange?: number;
  helpText?: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  icon,
  color = 'blue',
  percentChange,
  helpText,
}) => {


  const iconColorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        {icon && (
          <div className={`p-2 rounded-full ${iconColorClasses[color]}`}>
            {icon}
          </div>
        )}
      </div>
      <div className="flex items-baseline">
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
        {percentChange !== undefined && (
          <p
            className={`ml-2 text-sm font-medium ${
              percentChange >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {percentChange >= 0 ? '+' : ''}
            {percentChange}%
          </p>
        )}
      </div>
      {helpText && <p className="mt-1 text-xs text-gray-500">{helpText}</p>}
    </div>
  );
};

export default DashboardCard;
