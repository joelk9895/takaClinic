'use client';

import React, { useState } from 'react';
import { Expense, addExpense, updateExpense } from '../lib/firebaseService';
import { Timestamp } from 'firebase/firestore';

type ExpenseFormProps = {
  doctorId: string;
  doctorName: string;
  existingExpense?: Expense;
  onSuccess?: () => void;
  onCancel?: () => void;
};

const EXPENSE_CATEGORIES = [
  'Salary',
  'Equipment',
  'Utilities',
  'Rent',
  'Supplies',
  'Marketing',
  'Insurance',
  'Training',
  'Miscellaneous'
];

const ExpenseForm: React.FC<ExpenseFormProps> = ({
  doctorId,
  doctorName,
  existingExpense,
  onSuccess,
  onCancel
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    date: existingExpense?.date instanceof Date
      ? existingExpense.date.toISOString().split('T')[0]
      : existingExpense?.date
        ? new Date((existingExpense.date as Timestamp).toDate()).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
    amount: existingExpense?.amount || 0,
    description: existingExpense?.description || '',
    category: existingExpense?.category || EXPENSE_CATEGORIES[0],
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? (parseFloat(value) || 0) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const expenseData = {
        ...formData,
        amount: formData.amount,
        date: Timestamp.fromDate(new Date(formData.date)),
        doctorId,
        doctorName,
      };

      if (existingExpense?.id) {
        await updateExpense(existingExpense.id, expenseData);
      } else {
        await addExpense(expenseData);
      }

      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Error saving expense:', err);
      setError('Failed to save expense. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">
        {existingExpense ? 'Edit Expense' : 'Add New Expense'}
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">{error}</div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Doctor</label>
          <input
            type="text"
            value={doctorName}
            disabled
            className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            >
              {EXPENSE_CATEGORIES.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            min="0"
            step="0.01"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div className="flex justify-end space-x-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : existingExpense ? 'Update Expense' : 'Add Expense'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ExpenseForm;
