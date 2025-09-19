
import React from 'react';
import { DocumentReportIcon } from '../../constants';
import { Trip, Chauffeur, Vehicle, User } from '../../types';

interface TripLogPageProps {
  trips: Trip[];
  chauffeurs: Chauffeur[];
  vehicles: Vehicle[];
  users: User[];
}

const TripLogPage: React.FC<TripLogPageProps> = () => {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-100 flex items-center">
                <DocumentReportIcon className="w-8 h-8 mr-3 text-gray-500" />
                Trip Log
            </h1>
            <div className="bg-gray-800 p-8 rounded-lg shadow-xl text-center">
                <p className="text-gray-400 mt-2">
                    This feature has been reverted and is currently under construction.
                </p>
            </div>
        </div>
    );
};

export default TripLogPage;
