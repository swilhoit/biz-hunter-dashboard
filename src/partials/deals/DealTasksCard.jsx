import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import EditMenu from '../../components/DropdownEditMenu';
import { dbAdapter } from '../../lib/database-adapter';
import { useAuth } from '@/hooks/useAuth';

function DealTasksCard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // For now, we'll show an empty state since tasks aren't implemented in the database
      // In a real implementation, this would fetch from a deal_tasks table
      setTasks([]);
      setLoading(false);
    }
  }, [user]);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-100 dark:bg-red-500/20';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-500/20';
      case 'low':
        return 'text-green-600 bg-green-100 dark:bg-green-500/20';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-500/20';
    }
  };

  return (
    <div className="col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">Deal Tasks</h2>
          <EditMenu align="right" className="relative inline-flex">
            <li>
              <Link className="font-medium text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200 flex py-1 px-3" to="#0">
                View All Tasks
              </Link>
            </li>
            <li>
              <Link className="font-medium text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200 flex py-1 px-3" to="#0">
                Add Task
              </Link>
            </li>
          </EditMenu>
        </div>
      </header>
      <div className="p-3">
        <div className="space-y-3">
          {tasks.map((task) => (
            <div key={task.id} className={`p-3 rounded-lg border ${
              task.completed 
                ? 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700/60'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700/60'
            }`}>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  <input 
                    type="checkbox" 
                    defaultChecked={task.completed}
                    className="form-checkbox text-violet-500"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${
                    task.completed 
                      ? 'text-gray-500 dark:text-gray-400 line-through'
                      : 'text-gray-800 dark:text-gray-100'
                  }`}>
                    {task.title}
                  </p>
                  <div className="flex items-center mt-2 space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Due: {task.dueDate}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      • {task.assignee}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default DealTasksCard;