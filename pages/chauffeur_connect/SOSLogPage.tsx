import React from 'react';
import { BellAlertIcon } from '../../constants';

const SOSLogPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-red-500 flex items-center">
        <BellAlertIcon className="w-8 h-8 mr-3 animate-pulse" />
        SOS Alert Log
      </h1>
       <div className="bg-gray-800 border border-red-700 p-8 rounded-lg shadow-xl text-center">
        <p className="text-gray-300 text-lg">
          This page logs all critical SOS alerts from chauffeurs.
        </p>
        <p className="text-gray-400 mt-2">
          This page will contain a reverse-chronological list of all SOS alerts, including:
        </p>
        <ul className="list-disc list-inside text-left max-w-md mx-auto mt-4 text-gray-400">
            <li>Chauffeur Name and Contact</li>
            <li>Vehicle Details</li>
            <li>Time of Alert</li>
            <li>Last Known GPS Location on a map</li>
        </ul>
      </div>
    </div>
  );
};

export default SOSLogPage;
