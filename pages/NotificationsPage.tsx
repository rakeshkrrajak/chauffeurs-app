import React, { useState, useMemo, useEffect } from 'react';
import { SystemNotification, NotificationType } from '../types';
import Modal from '../components/Modal';
import { EnvelopeIcon } from '../constants';

interface NotificationsPageProps {
  notifications: SystemNotification[];
  setAsRead: () => void;
}

const NotificationsPage: React.FC<NotificationsPageProps> = ({ notifications, setAsRead }) => {
  const [selectedNotification, setSelectedNotification] = useState<SystemNotification | null>(null);
  const [filterType, setFilterType] = useState<NotificationType | 'ALL'>('ALL');

  useEffect(() => {
    // Mark notifications as read when the component mounts
    setAsRead();
  }, [setAsRead]);

  const handleViewNotification = (notification: SystemNotification) => {
    setSelectedNotification(notification);
  };

  const closeModal = () => {
    setSelectedNotification(null);
  };

  const filteredNotifications = useMemo(() => {
    return notifications
      .filter(n => filterType === 'ALL' || n.type === filterType)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [notifications, filterType]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  };

  const getTypePillClass = (type: NotificationType) => {
    switch (type) {
        case NotificationType.TRIP_ACCEPTED: return 'bg-green-700 bg-opacity-30 text-green-300';
        case NotificationType.TRIP_REJECTED: return 'bg-red-700 bg-opacity-30 text-red-300';
        case NotificationType.TRIP_DISPATCH: return 'bg-yellow-700 bg-opacity-30 text-yellow-300';
        case NotificationType.CHAUFFEUR_ONBOARD: return 'bg-blue-700 bg-opacity-30 text-blue-300';
        case NotificationType.POLICY_BREACH: return 'bg-purple-700 bg-opacity-30 text-purple-300';
        default: return 'bg-gray-700 bg-opacity-30 text-gray-300';
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-100 flex items-center">
        <EnvelopeIcon className="w-8 h-8 mr-3 text-primary-400" />
        Notifications Log
      </h1>
      <p className="text-sm text-gray-400">History of all system-generated notifications.</p>

      <div>
        <label htmlFor="filterType" className="block text-sm font-medium text-gray-300 mb-1">Filter by Type</label>
        <select 
            id="filterType" 
            value={filterType} 
            onChange={e => setFilterType(e.target.value as any)}
            className="bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500 focus:ring-primary-500 focus:border-primary-500 block w-full md:w-1/3 shadow-sm sm:text-sm rounded-lg p-2.5"
        >
            <option value="ALL">All Notification Types</option>
            {Object.values(NotificationType).map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      
      <div className="bg-gray-800 shadow-xl rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-750">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Timestamp</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Subject</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {filteredNotifications.map(notification => (
              <tr key={notification.id} className={`hover:bg-gray-750 transition-colors ${!notification.isRead ? 'bg-gray-850' : ''}`}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{formatDate(notification.timestamp)}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypePillClass(notification.type)}`}>
                        {notification.type}
                    </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 truncate max-w-md" title={notification.subject}>{notification.subject}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {notification.isRead ? 
                        <span className="text-gray-400">Read</span> : 
                        <span className="text-primary-400 font-bold">Unread</span>
                    }
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button 
                    onClick={() => handleViewNotification(notification)}
                    className="text-primary-400 hover:text-primary-300 hover:underline"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
            {filteredNotifications.length === 0 && (
              <tr><td colSpan={5} className="text-center py-10 text-gray-500">No notifications found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedNotification && (
        <Modal isOpen={!!selectedNotification} onClose={closeModal} title="Notification Details" size="xl">
          <div className="space-y-3 text-sm">
            <p><strong className="text-gray-200">Timestamp:</strong> <span className="text-gray-300">{formatDate(selectedNotification.timestamp)}</span></p>
            <p><strong className="text-gray-200">Type:</strong> <span className="text-gray-300">{selectedNotification.type}</span></p>
            <p><strong className="text-gray-200">Subject:</strong> <span className="text-gray-300">{selectedNotification.subject}</span></p>
            
            <div className="mt-2 pt-2 border-t border-gray-700">
              <h4 className="font-semibold text-gray-200 mb-1">Details:</h4>
              <pre className="bg-gray-700 p-3 rounded-md text-gray-300 whitespace-pre-wrap text-xs overflow-x-auto max-h-60">
                {selectedNotification.details}
              </pre>
            </div>
            <div className="flex justify-end mt-4">
                <button onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-600 hover:bg-gray-500 rounded-lg">
                    Close
                </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default NotificationsPage;
