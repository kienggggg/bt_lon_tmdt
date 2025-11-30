import axios from 'axios';
import { Event } from '../types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- INTERCEPTOR ---
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      // 👇 SỬA LỖI 1: Đổi 'token' thành 'access_token' cho khớp với AuthContext
      const token = localStorage.getItem('access_token'); 
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const eventApi = {
  getAll: () => api.get<Event[]>('/events'),
  getBySlug: (slug: string) => api.get<Event>(`/events/${slug}`),
  
  // 👇 SỬA LỖI 2: Thêm hàm này để trang web không bị Crash
  // Tạm thời lấy danh sách ngẫu nhiên hoặc tất cả
  getRelated: (id: string, limit?: number) => api.get<Event[]>('/events'),
};

export const bookingApi = {
  create: (ticketTypeId: string, quantity: number, requestVat: boolean) => 
    api.post('/booking/create', { ticketTypeId, quantity, request_vat: requestVat }),
  
  getMyBookings: () => api.get('/booking/me'),

  sendEmail: (bookingId: string) => api.post(`/booking/send-email/${bookingId}`),
};

export const authApi = {
  login: (credentials: any) => api.post('/auth/login', credentials),
  register: (data: any) => api.post('/auth/register', data),
};

export default api;