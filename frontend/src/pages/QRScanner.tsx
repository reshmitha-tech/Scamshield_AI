// QR Scanner page — Image upload + Live Webcam Scanner using html5-qrcode
import { useState, useRef, useEffect } from 'react';
import { QrCode, Camera, Upload, Loader2, RotateCcw, AlertTriangle, ExternalLink, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { analyzeQR, analyzeQRContent } from '../services/api';
import AnalysisResultCard from '../components/shared/AnalysisResultCard';
import type { AnalysisResponse } from '../types';

type Mode = 'upload' | 'camera';

export default function QRScanner() {
  const [mode, setMode] = useState<Mode>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Camera state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);

  // Stop camera when unmounting or switching tabs
  const stopCamera = async () => {
    if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
      try {
        await html5QrcodeRef.current.stop();
        await html5QrcodeRef.current.clear();
      } catch (e) {
        console.warn('Error stopping camera QR scanner:', e);
      }
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/')) {
      setError('Please select a valid QR code image file (PNG, JPG, JPEG).');
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

  const handleAnalyzeImage = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    try {
      const res = await analyzeQR(file);
      if (!res.success && res.error) {
        setError(res.error);
      } else {
        setResult(res);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to decode QR image';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const startCamera = async () => {
    setError(null);
    setCameraError(null);
    setResult(null);

    try {
      const html5Qrcode = new Html5Qrcode('qr-reader');
      html5QrcodeRef.current = html5Qrcode;

      setCameraActive(true);

      await html5Qrcode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          // Success callback
          await stopCamera();
          handleAnalyzeDecodedText(decodedText);
        },
        () => {
          // Ignore frame decode errors while scanning
        }
      );
    } catch (err: unknown) {
      setCameraActive(false);
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.toLowerCase().includes('denied') || errMsg.toLowerCase().includes('notallowed')) {
        setCameraError('Camera access was denied. You can upload a QR image instead.');
      } else {
        setCameraError(`Camera error: ${errMsg}`);
      }
    }
  };

  const handleAnalyzeDecodedText = async (decodedText: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await analyzeQRContent(decodedText);
      if (!res.success && res.error) {
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

  const handleReset = async () => {
    await stopCamera();
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    setCameraError(null);
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
            background: 'rgba(20,184,166,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <QrCode size={22} color="#14b8a6" />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>QR Code Scanner</h1>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>
            Decode QR codes via image upload or live camera scan, then inspect security before visiting
          </p>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 24,
          background: 'var(--color-bg-secondary)',
          padding: 4,
          borderRadius: 12,
          border: '1px solid var(--color-border)',
        }}
      >
        <button
          onClick={async () => {
            await stopCamera();
            setMode('upload');
            setResult(null);
            setError(null);
          }}
          className={`btn-secondary ${mode === 'upload' ? 'active' : ''}`}
          style={{
            flex: 1,
            justifyContent: 'center',
            borderRadius: 8,
            background: mode === 'upload' ? 'var(--color-bg-elevated)' : 'transparent',
            borderColor: mode === 'upload' ? 'var(--color-border-bright)' : 'transparent',
            color: mode === 'upload' ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
          }}
        >
          <Upload size={16} />
          Upload Image
        </button>
        <button
          onClick={() => {
            setMode('camera');
            setResult(null);
            setError(null);
          }}
          className={`btn-secondary ${mode === 'camera' ? 'active' : ''}`}
          style={{
            flex: 1,
            justifyContent: 'center',
            borderRadius: 8,
            background: mode === 'camera' ? 'var(--color-bg-elevated)' : 'transparent',
            borderColor: mode === 'camera' ? 'var(--color-border-bright)' : 'transparent',
            color: mode === 'camera' ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
          }}
        >
          <Camera size={16} />
          Scan with Camera
        </button>
      </div>

      {/* Upload Mode View */}
      {mode === 'upload' && (
        <>
          {!previewUrl && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
              }}
              onClick={() => fileInputRef.current?.click()}
              className="glass-card"
              style={{
                padding: '48px 24px',
                textAlign: 'center',
                cursor: 'pointer',
                border: '2px dashed var(--color-border-bright)',
                borderRadius: 16,
                marginBottom: 24,
              }}
            >
              <input
                type="file"
                ref={fileInputRef}
                accept="image/png, image/jpeg, image/jpg"
                style={{ display: 'none' }}
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              />
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: 'rgba(20,184,166,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <Upload size={26} color="#14b8a6" />
              </div>
              <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700 }}>
                Upload QR Code Image
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>
                Drag &amp; drop or click to upload PNG, JPG, JPEG
              </p>
            </div>
          )}

          {previewUrl && (
            <div className="glass-card" style={{ padding: 24, marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                  Selected Image: <strong style={{ color: 'var(--color-text-primary)' }}>{file?.name}</strong>
                </span>
                <button className="btn-secondary" onClick={handleReset} style={{ padding: '6px 12px', fontSize: 12 }}>
                  <RotateCcw size={13} />
                  Reset
                </button>
              </div>

              <div
                style={{
                  maxHeight: 220,
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
                  alt="QR preview"
                  style={{ maxHeight: 220, maxWidth: '100%', objectFit: 'contain' }}
                />
              </div>

              <button
                className="btn-primary"
                onClick={handleAnalyzeImage}
                disabled={loading}
                style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 15 }}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                    Decoding QR Code...
                  </>
                ) : (
                  <>
                    <QrCode size={18} />
                    Decode &amp; Analyze QR Code
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}

      {/* Camera Mode View */}
      {mode === 'camera' && (
        <div className="glass-card" style={{ padding: 24, marginBottom: 28, textAlign: 'center' }}>
          {!cameraActive && !result && (
            <div>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 20,
                  background: 'rgba(20,184,166,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <Camera size={32} color="#14b8a6" />
              </div>
              <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700 }}>Webcam QR Scanner</h3>
              <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--color-text-muted)', maxWidth: 440, marginLeft: 'auto', marginRight: 'auto' }}>
                Click below to open your camera and point it at any QR code. Detection happens automatically.
              </p>
              <button
                className="btn-primary"
                onClick={startCamera}
                style={{ padding: '12px 28px', fontSize: 15 }}
              >
                <Camera size={18} />
                Start Camera
              </button>
            </div>
          )}

          {/* HTML5 QR Scanner Container */}
          <div
            id="qr-reader"
            style={{
              width: '100%',
              maxWidth: 400,
              margin: '0 auto',
              borderRadius: 12,
              overflow: 'hidden',
              display: cameraActive ? 'block' : 'none',
            }}
          />

          {cameraActive && (
            <button
              className="btn-secondary"
              onClick={stopCamera}
              style={{ marginTop: 16 }}
            >
              Stop Camera
            </button>
          )}

          {cameraError && (
            <div
              style={{
                marginTop: 16,
                padding: '14px 18px',
                borderRadius: 12,
                background: 'rgba(245,158,11,0.1)',
                border: '1px solid rgba(245,158,11,0.3)',
                color: '#f59e0b',
                fontSize: 13,
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <AlertTriangle size={18} style={{ flexShrink: 0 }} />
              <div>{cameraError}</div>
            </div>
          )}
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
          <div>
            <strong>Decoding Error:</strong> {error}
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Decoded Content Card & Safety Notice */}
          <div className="glass-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={18} color="#14b8a6" />
                Decoded QR Content
              </h3>
              <span className="demo-banner" style={{ color: '#10b981', borderColor: 'rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.1)' }}>
                QR Detected
              </span>
            </div>

            <div
              style={{
                padding: '14px 16px',
                borderRadius: 8,
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 14,
                color: 'var(--color-text-primary)',
                wordBreak: 'break-all',
                marginBottom: 16,
              }}
            >
              {result.extracted_url || result.explanation}
            </div>

            {/* Safety Warning — NEVER auto-open */}
            <div
              style={{
                padding: '14px 16px',
                borderRadius: 10,
                background: 'rgba(59,130,246,0.08)',
                border: '1px solid rgba(59,130,246,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ShieldCheck size={20} color="#3b82f6" />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    Decoded Destination: {typeof result.domain_info?.domain === 'string' ? result.domain_info.domain : 'Text / Payload'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                    URL was NOT opened automatically. Review safety analysis below.
                  </div>
                </div>
              </div>

              {result.extracted_url && (
                <button
                  className="btn-secondary"
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to visit:\n${result.extracted_url}\n\nRisk Level: ${result.risk_level}`)) {
                      window.open(result.extracted_url, '_blank', 'noopener,noreferrer');
                    }
                  }}
                  style={{ padding: '6px 14px', fontSize: 12, flexShrink: 0 }}
                >
                  Open Link <ExternalLink size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Security Result Card */}
          <AnalysisResultCard result={result} />
        </div>
      )}
    </div>
  );
}
