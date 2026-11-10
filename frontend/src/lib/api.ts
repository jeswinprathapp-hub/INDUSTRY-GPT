export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  // If endpoint starts with /api or http, adjust accordingly
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = cleanEndpoint.startsWith('/api') 
    ? cleanEndpoint 
    : `${API_BASE_URL}${cleanEndpoint}`;

  return fetch(url, options);
}
