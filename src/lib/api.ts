import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  config.headers = config.headers || {};
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function decodeToken<T = any>(token: string) {
  try {
    return jwtDecode<T>(token);
  } catch (e) {
    return null as any;
  }
}

export default api;