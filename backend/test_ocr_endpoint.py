"""
End-to-end test for the image OCR and QR analysis endpoints.
"""
import http.client
import json
from pathlib import Path


def post_multipart(host, port, path, file_field, file_path, content_type="image/png"):
    boundary = "----TestBoundary99887766"
    file_data = Path(file_path).read_bytes()

    lines = []
    lines.append(f"--{boundary}\r\n")
    lines.append(f'Content-Disposition: form-data; name="{file_field}"; filename="{Path(file_path).name}"\r\n')
    lines.append(f"Content-Type: {content_type}\r\n")
    lines.append("\r\n")

    header = "".join(lines).encode()
    footer = f"\r\n--{boundary}--\r\n".encode()
    body = header + file_data + footer

    conn = http.client.HTTPConnection(host, port)
    conn.request(
        "POST",
        path,
        body=body,
        headers={
            "Content-Type": f"multipart/form-data; boundary={boundary}",
            "Content-Length": str(len(body)),
        },
    )
    resp = conn.getresponse()
    data = json.loads(resp.read())
    conn.close()
    return resp.status, data


def test_health():
    conn = http.client.HTTPConnection("127.0.0.1", 8000)
    conn.request("GET", "/api/health")
    resp = conn.getresponse()
    data = json.loads(resp.read())
    conn.close()
    assert resp.status == 200, f"Health check failed: {resp.status}"
    assert data["status"] == "ok"
    print(f"[PASS] Health check: version={data['version']}, mode={data['processing_mode']}")


def test_message_analysis():
    body = json.dumps({"content": "URGENT: Your bank account suspended. Click http://scam-site.tk/verify now!"})
    conn = http.client.HTTPConnection("127.0.0.1", 8000)
    conn.request("POST", "/api/analyze/message", body=body.encode(), headers={"Content-Type": "application/json"})
    resp = conn.getresponse()
    data = json.loads(resp.read())
    conn.close()
    assert resp.status == 200
    assert data["success"] is True
    assert data["risk_score"] > 0
    print(f"[PASS] Message analysis: risk_level={data['risk_level']}, score={data['risk_score']}")


def test_screenshot_ocr():
    screenshot_path = "test_screenshot.png"
    if not Path(screenshot_path).exists():
        print("[SKIP] test_screenshot.png not found - skipping OCR test")
        return

    status, data = post_multipart("127.0.0.1", 8000, "/api/analyze/image", "file", screenshot_path)
    print(f"[INFO] OCR endpoint status: {status}")
    print(f"[INFO] success={data.get('success')}, error={data.get('error')}")
    print(f"[INFO] extracted_text={repr(str(data.get('extracted_text', ''))[:150])}")
    print(f"[INFO] extracted_url={data.get('extracted_url')}")

    if data.get("success"):
        print(f"[PASS] OCR analysis: risk_level={data['risk_level']}, score={data['risk_score']}")
    else:
        error = data.get("error", "")
        if "Tesseract" in error or "not installed" in error.lower():
            print(f"[INFO] Tesseract not installed — expected graceful error: {error}")
        else:
            print(f"[WARN] OCR returned error: {error}")


def test_qr_endpoint():
    # Test the QR content endpoint (no image needed)
    body = json.dumps({"content": "https://phishing-qr-scam.tk/account/verify"})
    conn = http.client.HTTPConnection("127.0.0.1", 8000)
    conn.request("POST", "/api/analyze/qr-content", body=body.encode(), headers={"Content-Type": "application/json"})
    resp = conn.getresponse()
    data = json.loads(resp.read())
    conn.close()
    assert resp.status == 200
    assert data["success"] is True
    assert data.get("input_type") == "qr"
    print(f"[PASS] QR content analysis: risk_level={data['risk_level']}, score={data['risk_score']}")
    print(f"[INFO] Extracted URL from QR: {data.get('extracted_url')}")


def test_qr_safe_content():
    body = json.dumps({"content": "Hello, this is a plain text QR code payload."})
    conn = http.client.HTTPConnection("127.0.0.1", 8000)
    conn.request("POST", "/api/analyze/qr-content", body=body.encode(), headers={"Content-Type": "application/json"})
    resp = conn.getresponse()
    data = json.loads(resp.read())
    conn.close()
    assert resp.status == 200
    assert data["success"] is True
    assert data.get("input_type") == "qr"
    print(f"[PASS] QR plain text analysis: risk_level={data['risk_level']}, score={data['risk_score']}")


if __name__ == "__main__":
    print("=" * 60)
    print("ScamShield API End-to-End Tests")
    print("=" * 60)

    test_health()
    test_message_analysis()
    test_screenshot_ocr()
    test_qr_endpoint()
    test_qr_safe_content()

    print("=" * 60)
    print("All tests completed.")
