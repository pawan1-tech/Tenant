import api from './api';

export const notesService = {
  // Get all notes for current tenant
  getNotes: async () => {
    try {
      const response = await api.get('/api/notes');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch notes' };
    }
  },

  // Get single note by ID
  getNote: async (id) => {
    try {
      const response = await api.get(`/api/notes/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch note' };
    }
  },

  // Create new note
  createNote: async (noteData) => {
    try {
      const response = await api.post('/api/notes', noteData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create note' };
    }
  },

  // Update existing note
  updateNote: async (id, noteData) => {
    try {
      const response = await api.put(`/api/notes/${id}`, noteData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update note' };
    }
  },

  // Delete note
  deleteNote: async (id) => {
    try {
      const response = await api.delete(`/api/notes/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete note' };
    }
  }
};
