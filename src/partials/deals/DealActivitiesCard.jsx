import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import EditMenu from '../../components/DropdownEditMenu';
import { dbAdapter } from '../../lib/database-adapter';
import { useAuth } from '@/hooks/useAuth';

function DealActivitiesCard() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // For now, we'll show an empty state since activities aren't implemented in the database
      // In a real implementation, this would fetch from a deal_activities table
      setActivities([]);
      setLoading(false);
    }
  }, [user]);

  const getActivityIcon = (type) => {
    switch (type) {
      case 'call':
        return (
          <svg className="fill-current text-blue-500" width="16" height="16" viewBox="0 0 16 16">
            <path d="M11.707 1.293A1 1 0 0010.293.293L8.5 2.086 6.707.293A1 1 0 005.293 1.707L7.086 3.5 1.293 9.293A1 1 0 002.707 10.707L8.5 4.914l1.793 1.793a1 1 0 001.414-1.414L10.914 3.5l1.793-1.793z" />
          </svg>
        );
      case 'email':
        return (
          <svg className="fill-current text-green-500" width="16" height="16" viewBox="0 0 16 16">
            <path d="M14 3H2a1 1 0 00-1 1v8a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1zM2 5l6 4 6-4v6H2V5z" />
          </svg>
        );
      case 'meeting':
        return (
          <svg className="fill-current text-violet-500" width="16" height="16" viewBox="0 0 16 16">
            <path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zM8 12c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm1-3H7V4h2v5z" />
          </svg>
        );
      case 'document':
        return (
          <svg className="fill-current text-yellow-500" width="16" height="16" viewBox="0 0 16 16">
            <path d="M14 0H2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V2a2 2 0 00-2-2zM3 14V2h10v12H3z" />
          </svg>
        );
      default:
        return (
          <svg className="fill-current text-gray-500" width="16" height="16" viewBox="0 0 16 16">
            <path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zM8 12c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm1-3H7V4h2v5z" />
          </svg>
        );
    }
  };

  return (
    <div className="col-span-full xl:col-span-4 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">Recent Activities</h2>
          <EditMenu align="right" className="relative inline-flex">
            <li>
              <Link className="font-medium text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200 flex py-1 px-3" to="/deals">
                View All Activities
              </Link>
            </li>
            <li>
              <Link className="font-medium text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200 flex py-1 px-3" to="#0">
                Add Activity
              </Link>
            </li>
          </EditMenu>
        </div>
      </header>
      <div className="p-3">
        <div className="space-y-3">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                  {activity.description}
                </p>
                <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                  <span>{activity.user}</span>
                  <span className="mx-1">•</span>
                  <span>{activity.time}</span>
                </div>
              </div>
              <div className="flex-shrink-0">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  activity.status === 'completed' 
                    ? 'text-green-600 bg-green-100 dark:bg-green-500/20'
                    : 'text-blue-600 bg-blue-100 dark:bg-blue-500/20'
                }`}>
                  {activity.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default DealActivitiesCard;