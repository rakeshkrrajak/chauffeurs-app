import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Vehicle, Chauffeur, User } from '../types';
import VehicleForm from '../components/VehicleForm';

interface VehicleOnboardingPageProps {
  addVehicle: (vehicleData: Omit<Vehicle, 'id' | 'imageUrl'>) => void;
  chauffeurs: Chauffeur[];
  users: User[];
  vehicles: Vehicle[];
}

const VehicleOnboardingPage: React.FC<VehicleOnboardingPageProps> = ({ addVehicle, chauffeurs, users, vehicles }) => {
  const navigate = useNavigate();

  const handleOnboardingSubmit = (vehicleData: Omit<Vehicle, 'id' | 'imageUrl'>, transferReason?: string) => {
    addVehicle(vehicleData);
    alert('Vehicle successfully onboarded!');
    navigate('/vehicles/directory');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-100">Vehicle Onboarding</h1>
      <p className="text-gray-400">
        Use this comprehensive form to add a new vehicle to the fleet with all its details.
      </p>
      <div className="bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-2xl">
        <VehicleForm
          onSubmit={handleOnboardingSubmit}
          onCancel={() => navigate('/vehicles/directory')}
          chauffeurs={chauffeurs}
          users={users}
          vehicles={vehicles}
          isOnboarding={true}
        />
      </div>
    </div>
  );
};

export default VehicleOnboardingPage;