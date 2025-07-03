import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';

interface DealNotesProps {
  deal: any;
  onEdit: (updates: any) => void;
}

function DealNotes({ deal, onEdit }: DealNotesProps) {
  const [notes, setNotes] = useState(deal?.notes || '');
  const [originalNotes, setOriginalNotes] = useState(deal?.notes || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (deal?.notes !== undefined) {
      setNotes(deal.notes || '');
      setOriginalNotes(deal.notes || '');
    }
  }, [deal?.notes]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onEdit({ notes });
      setOriginalNotes(notes);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save notes:', error);
      alert('Failed to save notes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setNotes(originalNotes);
    setIsEditing(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Notes</h3>
        {!isEditing ? (
          <button 
            onClick={() => setIsEditing(true)}
            className="btn bg-indigo-600 text-white hover:bg-indigo-700"
          >
            Edit Notes
          </button>
        ) : (
          <div className="flex space-x-2">
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="btn bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button 
              onClick={handleCancel}
              className="btn bg-gray-300 text-gray-700 hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
      
      {isEditing ? (
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full h-96 p-4 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
          placeholder="Add your notes about this deal..."
        />
      ) : (
        <div className="min-h-96 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
          {notes ? (
            <div className="whitespace-pre-wrap text-gray-900 dark:text-gray-100">
              {notes}
            </div>
          ) : (
            <div className="text-gray-500 dark:text-gray-400 italic">
              No notes added yet. Click "Edit Notes" to add some.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default DealNotes;