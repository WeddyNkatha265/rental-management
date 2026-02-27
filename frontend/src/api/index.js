import axios from 'axios'

const api = axios.create({
  baseURL: 'https://rental-management-sumo.onrender.com/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Redirect to login on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('admin_name')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ─── Auth ─────────────────────────────────────────────────────────────
export const authAPI = {
  login: (username, password) => {
    const form = new URLSearchParams()
    form.append('username', username)
    form.append('password', password)
    return api.post('/auth/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
  },
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
}

// ─── Houses ───────────────────────────────────────────────────────────
export const housesAPI = {
  list: () => api.get('/houses/'),
  listWithTenants: () => api.get('/houses/with-tenants'),
  get: (id) => api.get(`/houses/${id}`),
  create: (data) => api.post('/houses/', data),
  update: (id, data) => api.put(`/houses/${id}`, data),
  delete: (id) => api.delete(`/houses/${id}`),
}

// ─── Tenants ──────────────────────────────────────────────────────────
export const tenantsAPI = {
  list: () => api.get('/tenants/'),
  get: (id) => api.get(`/tenants/${id}`),
  create: (data) => api.post('/tenants/', data),
  update: (id, data) => api.put(`/tenants/${id}`, data),
  remove: (id) => api.delete(`/tenants/${id}`),
  payments: (id) => api.get(`/tenants/${id}/payments`),
}

// ─── Payments ─────────────────────────────────────────────────────────
export const paymentsAPI = {
  dashboard: () => api.get('/payments/dashboard'),
  list: (params) => api.get('/payments/', { params }),
  get: (id) => api.get(`/payments/${id}`),
  create: (data) => api.post('/payments/', data),
  update: (id, data) => api.put(`/payments/${id}`, data),
  delete: (id) => api.delete(`/payments/${id}`),
  sendReminders: (month) => api.post('/payments/send-reminders', null, { params: { month } }),
}

export default api
