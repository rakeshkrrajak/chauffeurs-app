import React from 'react';
import { CalendarDaysIcon } from '../../constants';

const LeaveRequestsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-100 flex items-center">
        <CalendarDaysIcon className="w-8 h-8 mr-3 text-primary-400" />
        Chauffeur Leave Requests
      </h1>
       <div className="bg-gray-800 p-8 rounded-lg shadow-xl text-center">
        <p className="text-gray-300 text-lg">
          This section is for managing all chauffeur leave requests.
        </p>
        <p className="text-gray-400 mt-2">
          Features to be implemented here include:
        </p>
        <ul className="list-disc list-inside text-left max-w-md mx-auto mt-4 text-gray-400">
            <li>A list of pending leave requests with chauffeur details and dates.</li>
            <li>"Approve" and "Deny" buttons for each request.</li>
            <li>An archive of past leave requests (approved/denied).</li>
            <li>Integration with the main Attendance module.</li>
        </ul>
      </div>
    </div>
  );
};

export default LeaveRequestsPage;
