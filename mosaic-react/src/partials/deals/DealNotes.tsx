import React from 'react';
import { Plus, StickyNote } from 'lucide-react';

interface DealNotesProps {
  dealId: string;
}

function DealNotes({ dealId }: DealNotesProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Notes</h3>
        <button className="btn bg-indigo-600 text-white hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Note
        </button>
      </div>
      
      <div className="text-center py-12">
        <StickyNote className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Notes feature coming soon</p>
      </div>
    </div>
  );
}

export default DealNotes;