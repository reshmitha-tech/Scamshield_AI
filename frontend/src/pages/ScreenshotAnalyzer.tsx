// Screenshot Analyzer page — OCR text extraction & threat analysis
import { useState, useRef } from 'react';
import { Image as ImageIcon, Upload, Loader2, RotateCcw, AlertTriangle, FileText, Link2 } from 'lucide-react';
import { analyzeImage } from '../services/api';
import AnalysisResultCard from '../components/shared/AnalysisResultCard';
import type { AnalysisResponse } from '../types';

export default function ScreenshotAnalyzer() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/')) {
      setError('Please select a valid PNG, JPG, or JPEG image file.');
      return;
    }
    setFile(selectedFile);
    setError(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    try {
      const res = await analyzeImage(file);
      if (!res.success && res.error) {
        // Graceful backend error (e.g. Tesseract not installed)
        setError(res.error);
      } else {
        setResult(res);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Analysis failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
  };

  return (
    <div style={{ padding: '32px 36px', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'rgba(236,72,153,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ImageIcon size={22} color="#ec4899" />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Screenshot Analyzer</h1>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>
            Extract text from screenshots using local OCR and detect scam indicators &amp; phishing links
          </p>
        </div>
      </div>

      {/* Upload Box */}
      {!previewUrl && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="glass-card"
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            cursor: 'pointer',
            border: '2px dashed var(--color-border-bright)',
            borderRadius: 16,
            marginBottom: 24,
            transition: 'all 0.2s ease',
          }}
        >
          <input
            type="file"
            ref={fileInputRef}
            accept="image/png, image/jpeg, image/jpg"
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelect(e.target.files[0]);
              }
            }}
          />
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: 'rgba(236,72,153,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <Upload size={26} color="#ec4899" />
          </div>
          <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700 }}>
            Click or drop screenshot here
          </h3>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>
            Supports PNG, JPG, JPEG (Max 10MB) • All OCR processing happens locally
          </p>
        </div>
      )}

      {/* Preview & Analyze Button */}
      {previewUrl && (
        <div className="glass-card" style={{ padding: 24, marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              Selected Screenshot: <strong style={{ color: 'var(--color-text-primary)' }}>{file?.name}</strong>
            </span>
            <button className="btn-secondary" onClick={handleReset} style={{ padding: '6px 12px', fontSize: 12 }}>
              <RotateCcw size={13} />
              Change Image
            </button>
          </div>

          <div
            style={{
              maxHeight: 260,
              overflow: 'hidden',
              borderRadius: 12,
              background: '#000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
              border: '1px solid var(--color-border)',
            }}
          >
            <img
              src={previewUrl}
              alt="Screenshot preview"
              style={{ maxHeight: 260, maxWidth: '100%', objectFit: 'contain' }}
            />
          </div>

          <button
            className="btn-primary"
            onClick={handleAnalyze}
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 15 }}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                Extracting Text with Local OCR...
              </>
            ) : (
              <>
                <ImageIcon size={18} />
                Analyze Screenshot
              </>
            )}
          </button>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div
          style={{
            padding: '16px 20px',
            borderRadius: 12,
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            color: '#ef4444',
            fontSize: 14,
            marginBottom: 24,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
          }}
        >
          <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <strong>Analysis Warning:</strong> {error}
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Extracted Details Card */}
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={16} color="#ec4899" />
              OCR Extracted Text
            </h3>
            <div
              style={{
                padding: 14,
                borderRadius: 8,
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                fontFamily: 'Inter, sans-serif',
                fontSize: 14,
                lineHeight: 1.6,
                color: 'var(--color-text-primary)',
                whiteSpace: 'pre-wrap',
                marginBottom: 16,
              }}
            >
              {result.extracted_text || 'No text extracted.'}
            </div>

            {result.extracted_url && (
              <div>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: 6 }}>
                  Detected URL in Screenshot:
                </span>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: 'rgba(59,130,246,0.08)',
                    border: '1px solid rgba(59,130,246,0.2)',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 13,
                    color: '#60a5fa',
                  }}
                >
                  <Link2 size={14} />
                  {result.extracted_url}
                </div>
              </div>
            )}
          </div>

          {/* Full Analysis Result Card */}
          <AnalysisResultCard result={result} />
        </div>
      )}
    </div>
  );
}
