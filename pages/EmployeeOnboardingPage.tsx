import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Vehicle, Chauffeur } from '../types';
import EmployeeOnboardingForm from '../components/EmployeeOnboardingForm';
import { UsersIcon } from '../constants';

interface EmployeeOnboardingPageProps {
  addEmployeeAndAssign: (userData: Omit<User, 'id' | 'createdAt' | 'status' | 'role'>, vehicleId: string | null, chauffeurId: string | null) => void;
  availableVehicles: Vehicle[];
  availableChauffeurs: Chauffeur[];
}

const EmployeeOnboardingPage: React.FC<EmployeeOnboardingPageProps> = ({ addEmployeeAndAssign, availableVehicles, availableChauffeurs }) => {
  const navigate = useNavigate();

  const handleOnboardingSubmit = (userData: Omit<User, 'id' | 'createdAt' | 'status' | 'role'>, vehicleId: string | null, chauffeurId: string | null) => {
    addEmployeeAndAssign(userData, vehicleId, chauffeurId);
    alert('Employee successfully onboarded!');
    navigate('/employees/directory');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-100 flex items-center">
        <UsersIcon className="w-8 h-8 mr-3 text-primary-400"/>
        Employee Onboarding
      </h1>
      <p className="text-gray-400">
        Use this form to add a new employee to the system and assign them a vehicle and chauffeur if needed.
      </p>
      <div className="bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-2xl">
         <EmployeeOnboardingForm
            onSubmit={handleOnboardingSubmit}
            onCancel={() => navigate('/employees/directory')}
            availableVehicles={availableVehicles}
            availableChauffeurs={availableChauffeurs}
        />
      </div>
    </div>
  );
};

export default EmployeeOnboardingPage;