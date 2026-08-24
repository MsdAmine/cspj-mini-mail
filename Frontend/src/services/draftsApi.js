import api from './api';

export const draftsApi = {
  // GET /api/drafts
  getDrafts: async () => {
    const res = await api.get('/drafts');
    return res.data;
  },

  // GET /api/drafts/{id}
  getDraftById: async (id) => {
    const res = await api.get(`/drafts/${id}`);
    return res.data;
  },

  // POST /api/drafts
  createDraft: async (data) => {
    const res = await api.post('/drafts', {
      recipientIds: data.recipientIds || [],
      subject: data.subject || '',
      body: data.body || '',
    });
    return res.data;
  },

  // PUT /api/drafts/{id}
  updateDraft: async (id, data) => {
    const res = await api.put(`/drafts/${id}`, {
      recipientIds: data.recipientIds || [],
      subject: data.subject || '',
      body: data.body || '',
    });
    return res.data;
  },

  // DELETE /api/drafts/{id}
  deleteDraft: async (id) => {
    const res = await api.delete(`/drafts/${id}`);
    return res.data;
  },
};

export default draftsApi;
