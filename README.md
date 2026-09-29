# ScamShield AI

**Privacy-first, explainable AI scam detection — built for the Snapdragon AI Lab Build & Present Challenge.**

---

## Overview

ScamShield AI helps users identify suspicious messages, URLs, screenshots, and QR codes using privacy-first local AI. All analysis runs on-device by default — your data is never sent to external servers.

---

## Problem

Phishing, social engineering, OTP scams, fake job offers, and delivery scams cause significant financial and emotional harm. Victims often cannot identify these attacks in time because:

- Scam messages are designed to appear urgent and legitimate.
- Average users lack the tools to verify suspicious content quickly.
- Existing tools often require cloud processing, raising privacy concerns.

---

## Solution

ScamShield AI provides:

- **Local AI inference** — analysis happens on your device.
- **Explainable results** — every risk indicator is described in plain language.
- **Structured risk scoring** — transparent, weighted scoring (0–100).
- **Privacy Center** — shows exactly what data is processed and stored.
- **Demo mode** — synthetic examples for presentations.

---

## Features

| Feature | Status |
|---------|--------|
| Message Analysis | ✅ Phase 1 |
| URL Analysis | ✅ Phase 1 |
| Screenshot OCR | 🔄 Phase 4 |
| QR Code Scanner | 🔄 Phase 5 |
| LangGraph Orchestration | 🔄 Phase 6 |
| Local AI Model | 🔄 Phase 7 |
| FAISS Knowledge Base | 🔄 Phase 8 |
| ONNX / QNN Inference | 🔄 Phase 9 |
| Performance Dashboard | ✅ Phase 1 |
| Privacy Center | ✅ Phase 1 |
| Analysis History | ✅ Phase 1 |
| Demo Mode | ✅ Phase 1 |
| Automated Tests | ✅ Phase 1 |

---

## Architecture

```
React UI (Vite + TypeScript + Tailwind)
         ↓
FastAPI (Python) — REST API
         ↓
Analyzer Layer (Message, URL, OCR, QR)
         ↓
AI Model Abstraction Layer
    ├── MockModelProvider   ← Current (rule-based, dev/demo)
    ├── LocalModelProvider  ← Phase 7 (GGUF/llama.cpp)
    └── SnapdragonModelProvider ← Phase 9 (ONNX + QNN)
         ↓
SQLite (local history + metrics)
```

---

## Technology Stack

### Frontend
- React 19 + TypeScript
- Vite 6
- Tailwind CSS v4
- Lucide React icons
- Recharts (performance charts)
- Axios

### Backend
- Python 3.11+
- FastAPI
- Pydantic v2
- SQLAlchemy + SQLite
- Uvicorn

### AI (current phase)
- **MockModelProvider** — rule-based heuristics, no ML dependency
- Interface ready for: LangChain, LangGraph, ONNX Runtime, QNN

---

## AI Architecture

### Model Provider Interface

```python
class AIModelProvider(ABC):
    provider_name: str
    is_local: bool
    def analyze_text(text, context) -> dict: ...
    def is_available() -> bool: ...
```

### Implementations

| Provider | Status | Description |
|----------|--------|-------------|
| `MockModelProvider` | ✅ Active | Rule-based heuristics. Used in Phase 1. |
| `LocalModelProvider` | 🔄 Stub | For GGUF/quantized models via llama.cpp |
| `SnapdragonModelProvider` | 🔄 Stub | ONNX Runtime + QNN Execution Provider |

Switch providers via `.env`:
```
MODEL_PROVIDER=mock        # default
MODEL_PROVIDER=local       # requires MODEL_PATH=path/to/model.gguf
MODEL_PROVIDER=snapdragon  # requires MODEL_PATH + onnxruntime-qnn + Snapdragon HW
```

---

## Snapdragon Optimization Strategy

> ⚠️ The application is currently running with MockModelProvider. Snapdragon NPU acceleration has NOT been verified and will NOT be claimed until tested on real hardware.

### Integration Path

1. **Model Selection**: Choose a small, quantized model suitable for edge inference.
   - Recommended: Phi-3-mini (3.8B), Mistral-7B-Instruct-Q4, or a Qualcomm AI Hub model.

2. **Export to ONNX**:
   ```bash
   optimum-cli export onnx --model microsoft/phi-3-mini-4k-instruct ./phi3_onnx/
   ```

3. **Configure ONNX Runtime**:
   ```python
   import onnxruntime as ort
   providers = ["QNNExecutionProvider", "CPUExecutionProvider"]
   session = ort.InferenceSession("model.onnx", providers=providers)
   ```

4. **Enable QNN** in `.env`:
   ```
   MODEL_PROVIDER=snapdragon
   MODEL_PATH=./models/phi3.onnx
   USE_QNN=true
   ```

5. **Verify active provider**:
   ```python
   session.get_providers()  # Should show QNNExecutionProvider first
   ```

6. **Benchmark**:
   ```bash
   # Compare CPU vs NPU latency
   python benchmark.py --provider cpu
   python benchmark.py --provider qnn
   ```

7. **Qualcomm AI Hub**: Optimized models can be downloaded from [aihub.qualcomm.com](https://aihub.qualcomm.com) and loaded directly into the SnapdragonModelProvider.

---

## Installation

### Prerequisites

- Python 3.11+
- Node.js 18+
- npm 9+

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate (Windows)
.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment config
copy .env.example .env

# Start backend
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

---

## Running Locally

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |
| Health | http://localhost:8000/api/health |

---

## API Documentation

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Backend health and provider status |
| `POST` | `/api/analyze/message` | Analyze a text message |
| `POST` | `/api/analyze/url` | Analyze a URL |
| `POST` | `/api/analyze/image` | Screenshot OCR analysis (Phase 4) |
| `POST` | `/api/analyze/qr` | QR code decode + analysis (Phase 5) |
| `GET` | `/api/history` | List analysis history |
| `DELETE` | `/api/history/{id}` | Delete a history record |
| `DELETE` | `/api/history` | Clear all history |
| `GET` | `/api/performance` | Performance metrics |

### Response Schema

```json
{
  "success": true,
  "analysis_id": "uuid",
  "input_type": "message",
  "risk_score": 85,
  "risk_level": "HIGH",
  "indicators": [
    {
      "type": "urgency",
      "severity": "high",
      "evidence": "blocked today",
      "description": "Message uses urgent language..."
    }
  ],
  "explanation": "...",
  "recommendation": "...",
  "processing": {
    "mode": "local",
    "model": "MockModelProvider",
    "latency_ms": 12.5
  }
}
```

---

## Testing

```bash
cd backend
.venv\Scripts\activate

# Install test dependency
pip install pytest httpx

# Run all tests
pytest ../tests/test_phase1.py -v
```

### Test Coverage (Phase 1)

- ✅ Safe message → LOW risk
- ✅ Suspicious message → SUSPICIOUS/HIGH risk
- ✅ Banking scam → HIGH risk
- ✅ Risk score bounded to 100
- ✅ Empty inputs handled gracefully
- ✅ URL: IP address detection
- ✅ URL: shortener detection
- ✅ URL: HTTP flagging
- ✅ URL: domain info extraction
- ✅ API: health endpoint
- ✅ API: message analysis endpoint
- ✅ API: URL analysis endpoint
- ✅ API: history endpoint
- ✅ API: Phase 4/5 stubs return 501

---

## Security

- No user content is sent to external APIs (default).
- No uploaded files are executed.
- Suspicious URLs are never visited.
- Only a short preview (80 chars) of inputs is stored — never the full content.
- No API keys are exposed in frontend code.
- All configuration via environment variables.
- Upload size limited (configurable, default 10 MB).
- CORS restricted to localhost in development.
- No Python stack traces exposed to clients.

---

## Privacy

All analysis happens locally on the device.

| Data | Stored? | Where? |
|------|---------|--------|
| Full message content | ❌ No | Never |
| Message preview (80 chars) | ✅ Yes | Local SQLite |
| Analysis result | ✅ Yes | Local SQLite |
| Uploaded screenshots | ❌ No | Deleted after analysis |
| API keys | ❌ No | Not required |

---

## Performance Measurement

Once a real local model is integrated (Phase 7+), the Performance Dashboard will display:
- Total analysis latency (ms)
- Model inference time (ms)
- OCR time (ms, Phase 4)
- QR decode time (ms, Phase 5)
- Local vs cloud breakdown

> ⚠️ All current performance figures marked **Demo** are illustrative. No benchmark results have been fabricated.

---

## Demo Instructions

1. Start both servers (see Installation above).
2. Open http://localhost:5173.
3. On the Dashboard, click any **Demo Example** button to load a synthetic scam message.
4. Click **Analyze Message** to see the full risk analysis with indicators and recommendations.
5. Navigate to **Check URL** and try the phishing URL demo.
6. Explore **Privacy Center** and **Performance Dashboard**.

---

## Project Structure

```
snap/
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── layout/Sidebar.tsx
│       │   └── shared/
│       │       ├── AnalysisResultCard.tsx
│       │       ├── IndicatorList.tsx
│       │       ├── RiskBadge.tsx
│       │       └── ScoreRing.tsx
│       ├── pages/
│       │   ├── Dashboard.tsx
│       │   ├── MessageAnalyzer.tsx
│       │   ├── URLAnalyzer.tsx
│       │   ├── ScreenshotAnalyzer.tsx  (Phase 4 stub)
│       │   ├── QRScanner.tsx           (Phase 5 stub)
│       │   ├── HistoryPage.tsx
│       │   ├── PrivacyCenter.tsx
│       │   └── PerformancePage.tsx
│       ├── services/api.ts
│       ├── types/index.ts
│       └── utils/demoData.ts
├── backend/
│   └── app/
│       ├── api/       (analyze, history, system routers)
│       ├── analyzers/ (message, url analyzers)
│       ├── database/  (SQLAlchemy models, connection)
│       ├── models/    (AI provider abstraction)
│       ├── schemas/   (Pydantic schemas)
│       ├── services/  (history service)
│       └── main.py
├── tests/
│   └── test_phase1.py
├── .env.example
├── .gitignore
└── README.md
```

---

## Future Improvements

- Phase 4: Screenshot OCR (Tesseract / EasyOCR)
- Phase 5: QR code decoding (pyzbar)
- Phase 6: LangChain + LangGraph workflow orchestration
- Phase 7: Local AI model (Phi-3, Mistral, or similar)
- Phase 8: FAISS local knowledge base (phishing patterns)
- Phase 9: ONNX Runtime + Snapdragon QNN acceleration
- Phase 10: Snapdragon NPU benchmark vs CPU comparison
- Phase 11: Email header analysis
- Phase 12: Browser extension integration
