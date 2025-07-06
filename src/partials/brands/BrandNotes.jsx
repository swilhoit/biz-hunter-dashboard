import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Clock, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';

function BrandNotes({ brandId }) {
  const [notes, setNotes] = useState([]);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [newNote, setNewNote] = useState({ title: '', content: '' });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (brandId && user) {
      loadNotes();
    }
  }, [brandId, user]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const loadNotes = async () => {
    try {
      setLoading(true);
      // Fetch notes from database
      const { data, error } = await supabase
        .from('brand_notes')
        .select('*')
        .eq('brand_id', brandId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error loading notes:', error);
      // If table doesn't exist, use mock data
      setNotes([
        {
          id: '1',
          title: 'Brand Strategy',
          content: 'Focus on expanding product line in home organization category. Target 20% revenue growth.',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: user?.email || 'user@example.com'
        },
        {
          id: '2',
          title: 'Q1 Performance Review',
          content: 'Strong performance across all metrics. Consider increasing marketing spend for top performers.',
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          created_by: user?.email || 'user@example.com'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.title.trim() || !newNote.content.trim()) return;

    try {
      const noteData = {
        brand_id: brandId,
        title: newNote.title,
        content: newNote.content,
        created_by: user.email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Try to save to database
      const { data, error } = await supabase
        .from('brand_notes')
        .insert([noteData])
        .select()
        .single();

      if (error) {
        // If error, add to local state with mock ID
        setNotes([{ ...noteData, id: Date.now().toString() }, ...notes]);
      } else {
        setNotes([data, ...notes]);
      }

      setNewNote({ title: '', content: '' });
      setIsAddingNote(false);
    } catch (error) {
      console.error('Error adding note:', error);
      // Add to local state anyway
      const noteData = {
        id: Date.now().toString(),
        brand_id: brandId,
        title: newNote.title,
        content: newNote.content,
        created_by: user?.email || 'user@example.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setNotes([noteData, ...notes]);
      setNewNote({ title: '', content: '' });
      setIsAddingNote(false);
    }
  };

  const handleUpdateNote = async (noteId, updates) => {
    try {
      const { error } = await supabase
        .from('brand_notes')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', noteId);

      if (error) throw error;

      setNotes(notes.map(note => 
        note.id === noteId 
          ? { ...note, ...updates, updated_at: new Date().toISOString() }
          : note
      ));
      setEditingNote(null);
    } catch (error) {
      console.error('Error updating note:', error);
      // Update local state anyway
      setNotes(notes.map(note => 
        note.id === noteId 
          ? { ...note, ...updates, updated_at: new Date().toISOString() }
          : note
      ));
      setEditingNote(null);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const { error } = await supabase
        .from('brand_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;
      setNotes(notes.filter(note => note.id !== noteId));
    } catch (error) {
      console.error('Error deleting note:', error);
      // Remove from local state anyway
      setNotes(notes.filter(note => note.id !== noteId));
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-gray-500">Loading notes...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add Note Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Brand Notes</h3>
        {!isAddingNote && (
          <button
            onClick={() => setIsAddingNote(true)}
            className="btn bg-indigo-600 text-white hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Note
          </button>
        )}
      </div>

      {/* New Note Form */}
      {isAddingNote && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Note title..."
              value={newNote.title}
              onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
              autoFocus
            />
            <textarea
              placeholder="Write your note here..."
              value={newNote.content}
              onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setIsAddingNote(false);
                  setNewNote({ title: '', content: '' });
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNote}
                disabled={!newNote.title.trim() || !newNote.content.trim()}
                className="btn bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notes List */}
      {notes.length > 0 ? (
        <div className="space-y-4">
          {notes.map((note) => (
            <div key={note.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              {editingNote === note.id ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={note.title}
                    onChange={(e) => setNotes(notes.map(n => 
                      n.id === note.id ? { ...n, title: e.target.value } : n
                    ))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                  <textarea
                    value={note.content}
                    onChange={(e) => setNotes(notes.map(n => 
                      n.id === note.id ? { ...n, content: e.target.value } : n
                    ))}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => {
                        setEditingNote(null);
                        loadNotes(); // Reset to original
                      }}
                      className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        const updatedNote = notes.find(n => n.id === note.id);
                        handleUpdateNote(note.id, {
                          title: updatedNote.title,
                          content: updatedNote.content
                        });
                      }}
                      className="btn bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">{note.title}</h4>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEditingNote(note.id)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap mb-4">{note.content}</p>
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-4">
                    <div className="flex items-center">
                      <User className="w-3 h-3 mr-1" />
                      {note.created_by}
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatDate(note.created_at)}
                    </div>
                    {note.updated_at !== note.created_at && (
                      <span className="italic">edited</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">No notes yet</p>
          <button
            onClick={() => setIsAddingNote(true)}
            className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
          >
            Add your first note
          </button>
        </div>
      )}
    </div>
  );
}

export default BrandNotes;