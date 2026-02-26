import api from './axiosInstance'

export const hotelsApi = {
  // Shared
  getAll: () => api.get('/hotels'),
  getById: (id) => api.get(`/hotels/${id}`),

  // Merchant
  create: (data) => api.post('/hotels', data),
  update: (id, data) => api.put(`/hotels/${id}`, data),
  submit: (id) => api.post(`/hotels/${id}/submit`),

  // Admin
  approve: (id) => api.post(`/admin/hotels/${id}/approve`),
  reject: (id, reason) => api.post(`/admin/hotels/${id}/reject`, { reason }),
  offline: (id) => api.post(`/admin/hotels/${id}/offline`),
  online: (id) => api.post(`/admin/hotels/${id}/online`),
}
