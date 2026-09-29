// ── API Types — matches backend Pydantic schemas exactly ──────────────────────

export interface Indicator {
  type: string;
  severity: 'high' | 'medium' | 'low';
  evidence: string;
  description?: string;
}

export interface ProcessingInfo {
  mode: 'local' | 'cloud' | 'mock';
  model: string;
  latency_ms: number;
  model_latency_ms?: number;
  ocr_latency_ms?: number;
  qr_latency_ms?: number;
}

export interface AnalysisResponse {
  success: boolean;
  analysis_id: string;
  input_type: 'message' | 'url' | 'image' | 'qr' | 'screenshot' | 'unknown';
  risk_score: number;
  risk_level: 'LOW' | 'SUSPICIOUS' | 'HIGH';
  indicators: Indicator[];
  explanation: string;
  recommendation: string;
  processing: ProcessingInfo;
  highlighted_phrases?: string[];
  domain_info?: Record<string, unknown>;
  extracted_text?: string;
  extracted_url?: string;
  error?: string;
}

export interface HistoryItem {
  id: string;
  timestamp: string;
  input_type: string;
  risk_score: number;
  risk_level: 'LOW' | 'SUSPICIOUS' | 'HIGH';
  indicators: Indicator[];
  explanation: string;
  recommendation: string;
  processing_mode: string;
  model_name: string;
  latency_ms: number;
  content_preview: string;
}

export interface HistoryResponse {
  success: boolean;
  total: number;
  items: HistoryItem[];
}

export interface PerformanceSummary {
  success: boolean;
  total_analyses: number;
  local_analyses: number;
  cloud_analyses: number;
  local_percentage: number;
  avg_latency_ms: number;
  avg_model_latency_ms: number;
  breakdown_by_type: Record<string, number>;
  is_demo_data: boolean;
  note: string;
}

export interface HealthResponse {
  status: string;
  version: string;
  model_provider: string;
  processing_mode: string;
  database: string;
  offline_capable: boolean;
  snapdragon_ready: boolean;
  uptime_seconds?: number;
}

// ── UI Types ───────────────────────────────────────────────────────────────────

export type RiskLevel = 'LOW' | 'SUSPICIOUS' | 'HIGH';
export type InputType = 'message' | 'url' | 'image' | 'qr';

export type Page =
  | 'dashboard'
  | 'message'
  | 'url'
  | 'screenshot'
  | 'qr'
  | 'history'
  | 'privacy'
  | 'performance';

export interface DemoExample {
  id: string;
  label: string;
  type: InputType;
  content: string;
  description: string;
  expectedRisk: RiskLevel;
}
