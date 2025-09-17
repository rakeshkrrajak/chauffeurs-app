import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Chauffeur, Vehicle, User } from '../types';
import ChauffeurForm from '../components/ChauffeurForm';
import { UserGroupIcon } from '../constants';

interface ChauffeurOnboardingPageProps {
  addChauffeur: (chauffeurData: Omit<Chauffeur, 'id' | 'imageUrl' | 'onboardingStatus'>) => void;
  vehicles: Vehicle[];
  users: User[];
}

const ChauffeurOnboardingPage: React.FC<ChauffeurOnboardingPageProps> = ({ addChauffeur, vehicles, users }) => {
  const navigate = useNavigate();

  const handleOnboardingSubmit = (chauffeurData: Omit<Chauffeur, 'id' | 'imageUrl' | 'onboardingStatus'>) => {
    addChauffeur(chauffeurData);
    alert('Chauffeur successfully onboarded!');
    navigate('/chauffeurs/directory');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-100 flex items-center">
        <UserGroupIcon className="w-8 h-8 mr-3 text-primary-400" />
        Chauffeur Onboarding
      </h1>
      <p className="text-gray-400">
        Use this form to add a new chauffeur to the fleet.
      </p>
      <div className="bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-2xl">
        <ChauffeurForm
          onSubmit={handleOnboardingSubmit}
          onCancel={() => navigate('/chauffeurs/directory')}
          vehicles={vehicles}
          users={users}
        />
      </div>
    </div>
  );
};

export default ChauffeurOnboardingPage;
