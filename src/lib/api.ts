import { jwtDecode } from 'jwt-decode';

// Placeholder API module - replace with actual backend calls when backend is connected
const api = {
  get: async (_url: string) => ({ data: [] as any }),
  post: async (_url: string, _data?: any) => ({ data: {} as any }),
  put: async (_url: string, _data?: any) => ({ data: {} as any }),
  delete: async (_url: string) => ({ data: {} as any }),
};

export function decodeToken<T = any>(token: string) {
  try {
    return jwtDecode<T>(token);
  } catch (e) {
    return null as any;
  }
}

export default api;