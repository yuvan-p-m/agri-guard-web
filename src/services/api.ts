// API service for backend integration using native fetch
import type { UserProfile } from '../types';

/**
 * Dynamically resolves the active API base endpoint:
 * 1. Runtime override via localStorage ('api_endpoint_override')
 * 2. Environment variable VITE_API_BASE_URL
 * 3. Same-origin /api/v1 fallback for deployments that proxy the API
 */
export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const runtimeOverride = localStorage.getItem('api_endpoint_override');
    if (runtimeOverride && runtimeOverride.trim()) {
      return runtimeOverride.trim().replace(/\/+$/, '');
    }
  }

  const envUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();
  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }

  return '/api/v1';
}

export function setCustomApiEndpoint(url: string): void {
  if (typeof window !== 'undefined') {
    if (!url || !url.trim()) {
      localStorage.removeItem('api_endpoint_override');
    } else {
      localStorage.setItem('api_endpoint_override', url.trim().replace(/\/+$/, ''));
    }
  }
}

export const API_BASE_URL = getApiBaseUrl();

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: UserProfile;
}

export interface RegisterPayload {
  full_name: string;
  email: string;
  phone?: string;
  password: string;
  confirm_password: string;
  crop_type?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  role?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('access_token');
  const currentLang = (typeof window !== 'undefined' && (localStorage.getItem('agriguard_language') || localStorage.getItem('i18nextLng'))) || 'en';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Language': currentLang,
    ...((options.headers as Record<string, string>) || {}),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const primaryBaseUrl = getApiBaseUrl();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch(`${primaryBaseUrl}${cleanEndpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const error: any = new Error(data?.detail || `HTTP Error ${response.status}`);
      error.response = { status: response.status, data };
      throw error;
    }

    return data as T;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err?.response?.status) {
      throw err;
    }
    const customError: any = new Error(
      `Unable to connect to backend server (${primaryBaseUrl}). Configure VITE_API_BASE_URL or use the server endpoint override.`
    );
    customError.original = err;
    throw customError;
  }
}

// Auth APIs
export const authAPI = {
  register: async (data: RegisterPayload): Promise<AuthResponse> => {
    const resData = await request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (resData?.access_token) {
      localStorage.setItem('access_token', resData.access_token);
    }
    return resData;
  },
  login: async (data: LoginPayload): Promise<AuthResponse> => {
    const resData = await request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (resData?.access_token) {
      localStorage.setItem('access_token', resData.access_token);
    }
    return resData;
  },
  getMe: async (): Promise<UserProfile> => {
    return request<UserProfile>('/auth/me');
  }
};

// Disease Detection APIs
export const diseaseAPI = {
  predict: async (file: File, lang?: string) => {
    // Guard: reject static sample/placeholder images — only allow real uploaded files
    if (file.name === 'sample_leaf.jpg' || file.size < 2048) {
      throw new Error('Please upload a real photo of a crop leaf, not a sample image.');
    }

    const currentLang = lang || (typeof window !== 'undefined' && (localStorage.getItem('agriguard_language') || localStorage.getItem('i18nextLng'))) || 'en';
    const token = localStorage.getItem('access_token');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('language', currentLang);
    const headers: Record<string, string> = {
      'X-Language': currentLang,
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const targetBase = getApiBaseUrl();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const res = await fetch(`${targetBase}/disease/predict?language=${encodeURIComponent(currentLang)}`, {
        method: 'POST',
        headers,
        body: formData,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.detail || `Server error ${res.status}`);
      }

      return await res.json();
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      if (err instanceof Error && !isNetworkError(err)) {
        throw err;
      }
      throw new Error(
        `Unable to connect to AI model server at ${targetBase}. ` +
        (err instanceof Error ? err.message : String(err))
      );
    }
  },
  history: () => request('/disease/history'),
};

/** Returns true if the error is a network/connectivity issue (not an HTTP-level error) */
function isNetworkError(err: Error): boolean {
  return (
    err.name === 'AbortError' ||
    err.name === 'TypeError' ||
    err.message.includes('Failed to fetch') ||
    err.message.includes('Network request failed') ||
    err.message.includes('abort')
  );
}

// AI Model Status API
export const modelAPI = {
  /** Checks if the backend is reachable and if the AI model is loaded */
  getStatus: async (): Promise<{ model_loaded: boolean; model_id: string; status: string; api_reachable: boolean }> => {
    const base = getApiBaseUrl();
    for (const path of ['/model/status', '/health']) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(`${base}${path}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!res.ok) continue;
        const data = await res.json();
        return {
          model_loaded: data.model_loaded ?? false,
          model_id: data.model_id ?? 'unknown',
          status: data.status ?? (data.model_loaded ? 'ready' : 'loading'),
          api_reachable: true,
        };
      } catch {
        // Try the health endpoint when model status is unavailable.
      }
    }

    return { model_loaded: false, model_id: 'unreachable', status: 'offline', api_reachable: false };
  },
};

// Crop Recommendation API
export const cropAPI = {
  getRecommendations: (location: string, lang?: string) => {
    const currentLang = lang || (typeof window !== 'undefined' && (localStorage.getItem('agriguard_language') || localStorage.getItem('i18nextLng'))) || 'en';
    return request(`/crop-recommendations?location=${encodeURIComponent(location)}&language=${encodeURIComponent(currentLang)}`);
  },
};

// Sensor APIs
export const sensorAPI = {
  addReading: (data: any) => request('/sensors/reading', { method: 'POST', body: JSON.stringify(data) }),
  getLatest: () => request('/sensors/latest'),
  getLive: () => request('/sensors/live'),
};

// Weather APIs
export const weatherAPI = {
  getWeatherByCoords: (lat: number, lon: number) => request(`/weather?lat=${lat}&lon=${lon}`),
  getWeatherByCity: (city: string) => request(`/weather?city=${encodeURIComponent(city)}`),
  getForecast: (city?: string, lat?: number, lon?: number) =>
    request(`/weather/forecast?${lat && lon ? `lat=${lat}&lon=${lon}` : `city=${encodeURIComponent(city || 'Nagpur')}`}`),
  getCurrent: (city?: string, lat?: number, lon?: number) =>
    request(`/weather/current?${lat && lon ? `lat=${lat}&lon=${lon}` : `city=${encodeURIComponent(city || 'Nagpur')}`}`),
};

// Alert APIs
export const alertsAPI = {
  subscribe: (data: { phone: string; crop?: string; alert_types?: string[] }) =>
    request('/alerts/subscribe', { method: 'POST', body: JSON.stringify(data) }),
  sendWeatherAlert: (phone: string, alertMessage: string) =>
    request('/alerts/send-weather-alert', { method: 'POST', body: JSON.stringify({ phone, alert_message: alertMessage }) }),
  sendTestSms: (data: { uid?: string; phone?: string; location?: string; name?: string }) =>
    request('/alerts/send-test-sms', { method: 'POST', body: JSON.stringify(data) }),
};

// Risk APIs
export const riskAPI = {
  earlyWarning: () => request('/risk/early-warning'),
};

// Feedback APIs
export const feedbackAPI = {
  submit: (data: any) => request('/feedback/submit', { method: 'POST', body: JSON.stringify(data) }),
  impact: () => request('/feedback/impact'),
};

// Marketplace & Mandi Price APIs
export const marketplaceAPI = {
  getMandiPrices: (crop: string, state: string) =>
    request('/mandi-prices', {
      method: 'POST',
      body: JSON.stringify({ crop, state }),
    }),
  getPriceForecast: (crop: string, state: string) =>
    request('/price-forecast', {
      method: 'POST',
      body: JSON.stringify({ crop, state }),
    }),
  getCropAlert: (crop: string) =>
    request(`/crop-alert?crop=${encodeURIComponent(crop)}`),
};

export default { request };

