// Demo examples — clearly synthetic, for presentation use only
import type { DemoExample } from '../types';

export const DEMO_EXAMPLES: DemoExample[] = [
  {
    id: 'demo-banking',
    label: '🏦 Fake Banking Scam',
    type: 'message',
    content:
      'ALERT: Your SBI account has been blocked due to suspicious activity. To restore access immediately, click http://sbi-secure-verify.xyz/login and enter your OTP and debit card details within 2 hours or your account will be permanently suspended.',
    description: 'Classic banking phishing combining urgency, account threat, OTP request, and a lookalike domain.',
    expectedRisk: 'HIGH',
  },
  {
    id: 'demo-delivery',
    label: '📦 Fake Delivery Scam',
    type: 'message',
    content:
      'Your FedEx package #FX8821943 could not be delivered. A small customs fee of ₹99 is required. Pay now at bit.ly/fedex-india-pay to avoid return to sender.',
    description: 'Delivery scam using a URL shortener and small payment to harvest credit card details.',
    expectedRisk: 'HIGH',
  },
  {
    id: 'demo-job',
    label: '💼 Fake Job Scam',
    type: 'message',
    content:
      'Congratulations! You have been selected for a work-from-home data entry job paying ₹50,000/month. No experience needed. Send your Aadhaar number, bank account details and pay a ₹500 registration fee to start immediately.',
    description: 'Job scam requesting Aadhaar, bank details, and an upfront payment.',
    expectedRisk: 'HIGH',
  },
  {
    id: 'demo-prize',
    label: '🎁 Fake Prize Scam',
    type: 'message',
    content:
      'You have won a Sony LED TV worth ₹45,000 in the Amazon Diwali Lucky Draw! To claim your prize, click http://amazon-prize-winner.top/claim and provide your address and a processing fee of ₹250.',
    description: 'Prize scam impersonating Amazon with a lookalike domain and payment request.',
    expectedRisk: 'HIGH',
  },
  {
    id: 'demo-safe',
    label: '✅ Safe Legitimate Message',
    type: 'message',
    content:
      'Hi, your appointment with Dr. Sharma is confirmed for tomorrow at 10:00 AM at City Clinic, MG Road. Please arrive 10 minutes early. Reply CANCEL to reschedule.',
    description: 'Normal appointment reminder with no suspicious indicators.',
    expectedRisk: 'LOW',
  },
];

export const DEMO_URLS = [
  {
    id: 'demo-url-phish',
    label: '🔴 Phishing URL',
    url: 'http://sbi.banking-secure-login.xyz/verify?token=abc123&redirect=http://evil.com',
  },
  {
    id: 'demo-url-short',
    label: '🟡 Shortened URL',
    url: 'https://bit.ly/amazon-diwali-offer-2024',
  },
  {
    id: 'demo-url-safe',
    label: '🟢 Safe URL',
    url: 'https://www.sbi.co.in/web/personal-banking',
  },
];
