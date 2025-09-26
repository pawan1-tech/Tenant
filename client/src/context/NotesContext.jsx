import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notesService } from '../services/notesService';
import { useAuth } from './AuthContext';

const NotesContext = createContext();

export const useNotes = () => {
  const context = useContext(NotesContext);
  if (!context) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  return context;
};

export const NotesProvider = ({ children }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  // Memoize fetchNotes to prevent unnecessary re-renders
  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await notesService.getNotes();
      setNotes(response.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch notes');
      console.error('Error fetching notes:', err);
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array since it doesn't depend on any props/state

  // Fetch notes when user changes (but not on every user object change)
  useEffect(() => {
    if (user?.id) { // Only fetch if user exists and has an ID
      fetchNotes();
    } else {
      setNotes([]);
    }
  }, [user?.id, fetchNotes]); // Only depend on user ID, not the entire user object

  const createNote = async (noteData) => {
    try {
      setError(null);
      const response = await notesService.createNote(noteData);
      setNotes(prev => [response.data, ...prev]);
      return response;
    } catch (err) {
      setError(err.message || 'Failed to create note');
      throw err;
    }
  };

  const updateNote = async (id, noteData) => {
    try {
      setError(null);
      const response = await notesService.updateNote(id, noteData);
      setNotes(prev => 
        prev.map(note => 
          note._id === id ? response.data : note
        )
      );
      return response;
    } catch (err) {
      setError(err.message || 'Failed to update note');
      throw err;
    }
  };

  const deleteNote = async (id) => {
    try {
      setError(null);
      await notesService.deleteNote(id);
      setNotes(prev => prev.filter(note => note._id !== id));
    } catch (err) {
      setError(err.message || 'Failed to delete note');
      throw err;
    }
  };

  const getNoteById = (id) => {
    return notes.find(note => note._id === id);
  };

  const value = {
    notes,
    loading,
    error,
    fetchNotes,
    createNote,
    updateNote,
    deleteNote,
    getNoteById
  };

  return (
    <NotesContext.Provider value={value}>
      {children}
    </NotesContext.Provider>
  );
};
