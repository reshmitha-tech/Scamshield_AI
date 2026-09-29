// API service — communicates with FastAPI backend
import axios from 'axios';
import type {
  AnalysisResponse,
  HistoryResponse,
  PerformanceSummary,
  HealthResponse,
} from '../types';

const api = axios.create({
  baseURL: '/api',   // proxied to http://localhost:8000 via Vite
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Interceptors ───────────────────────────────────────────────────────────────

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const msg =
      error.response?.data?.detail ||
      error.response?.data?.error ||
      error.message ||
      'An unexpected error occurred.';
    return Promise.reject(new Error(msg));
  }
);

// ── Analysis ───────────────────────────────────────────────────────────────────

export const analyzeMessage = (content: string): Promise<AnalysisResponse> =>
  api.post<AnalysisResponse>('/analyze/message', { content }).then((r) => r.data);

export const analyzeUrl = (url: string): Promise<AnalysisResponse> =>
  api.post<AnalysisResponse>('/analyze/url', { url }).then((r) => r.data);

export const analyzeImage = (file: File): Promise<AnalysisResponse> => {
  const form = new FormData();
  form.append('file', file);
  return api
    .post<AnalysisResponse>('/analyze/image', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);
};

export const analyzeQR = (file: File): Promise<AnalysisResponse> => {
  const form = new FormData();
  form.append('file', file);
  return api
    .post<AnalysisResponse>('/analyze/qr', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);
};

export const analyzeQRContent = (content: string): Promise<AnalysisResponse> =>
  api.post<AnalysisResponse>('/analyze/qr-content', { content }).then((r) => r.data);

// ── History ────────────────────────────────────────────────────────────────────

export const getHistory = (
  limit = 50,
  offset = 0,
  inputType?: string
): Promise<HistoryResponse> =>
  api
    .get<HistoryResponse>('/history', {
      params: { limit, offset, input_type: inputType },
    })
    .then((r) => r.data);

export const deleteHistoryRecord = (id: string): Promise<void> =>
  api.delete(`/history/${id}`).then(() => undefined);

export const clearHistory = (): Promise<void> =>
  api.delete('/history').then(() => undefined);

// ── System ─────────────────────────────────────────────────────────────────────

export const getHealth = (): Promise<HealthResponse> =>
  api.get<HealthResponse>('/health').then((r) => r.data);

export const getPerformance = (): Promise<PerformanceSummary> =>
  api.get<PerformanceSummary>('/performance').then((r) => r.data);
