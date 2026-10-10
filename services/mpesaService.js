// services/mpesaService.js
require('dotenv').config();

const MPESA_ENV = process.env.MPESA_ENVIRONMENT || 'sandbox';
const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY || '';
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET || '';
const PASSKEY = process.env.MPESA_PASSKEY || '';
const SHORTCODE = process.env.MPESA_SHORTCODE || '174379';
const CALLBACK_URL = process.env.MPESA_CALLBACK_URL || '';
const CALLBACK_SECRET = process.env.MPESA_CALLBACK_SECRET || '';
// Dev-only: skips Safaricom entirely. Never allowed in production.
const SIMULATE = process.env.MPESA_SIMULATE === 'true' && process.env.NODE_ENV !== 'production';

const BASE_URL = MPESA_ENV === 'production'
  ? 'https://api.safaricom.co.ke'
  : 'https://sandbox.safaricom.co.ke';

const REQUEST_TIMEOUT_MS = 20000;
const SIM_PREFIX = 'ws_CO_SIM_';

let cachedToken = null;
let cachedTokenExpiry = 0;

/**
 * Normalise a Kenyan number to 2547XXXXXXXX / 2541XXXXXXXX.
 * Returns null when the number is not a valid Safaricom-style MSISDN.
 */
function formatPhoneNumber(phone) {
  if (!phone) return null;
  const cleaned = String(phone).trim().replace(/[\s\-()]/g, '');
  let m = cleaned.match(/^0([71]\d{8})$/) ||
          cleaned.match(/^\+?254([71]\d{8})$/) ||
          cleaned.match(/^([71]\d{8})$/);
  return m ? `254${m[1]}` : null;
}

function isSimulationMode() {
  return SIMULATE;
}

function isSimulatedCheckoutId(id) {
  return SIMULATE && typeof id === 'string' && id.startsWith(SIM_PREFIX);
}

/** Verifies the shared secret appended to the callback URL (?secret=...). */
function isValidCallbackSecret(provided) {
  if (!CALLBACK_SECRET) return true;
  const a = Buffer.from(String(provided || ''));
  const b = Buffer.from(CALLBACK_SECRET);
  return a.length === b.length && require('crypto').timingSafeEqual(a, b);
}

function getTimestamp() {
  // Daraja expects Nairobi time (UTC+3), formatted YYYYMMDDHHmmss
  const eat = new Date(Date.now() + 3 * 60 * 60 * 1000);
  return eat.toISOString().replace(/[-:T]/g, '').slice(0, 14);
}

function buildPassword(timestamp) {
  return Buffer.from(`${SHORTCODE}${PASSKEY}${timestamp}`).toString('base64');
}

async function darajaFetch(path, options) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(`${BASE_URL}${path}`, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Get (and cache) a Daraja OAuth access token. Throws on failure.
 */
async function getOAuthToken() {
  if (cachedToken && Date.now() < cachedTokenExpiry) return cachedToken;

  if (!CONSUMER_KEY || !CONSUMER_SECRET) {
    throw new Error('M-Pesa is not configured: set MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET.');
  }

  const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
  const res = await darajaFetch('/oauth/v1/generate?grant_type=client_credentials', {
    method: 'GET',
    headers: { Authorization: `Basic ${auth}` }
  });

  if (!res.ok) {
    console.error('Daraja OAuth error:', res.status, await res.text());
    throw new Error('Could not authenticate with Safaricom Daraja. Check your consumer key/secret.');
  }

  const data = await res.json();
  cachedToken = data.access_token;
  cachedTokenExpiry = Date.now() + Math.max(0, (Number(data.expires_in) || 3599) - 60) * 1000;
  return cachedToken;
}

function assertConfigured() {
  if (!PASSKEY) throw new Error('M-Pesa is not configured: set MPESA_PASSKEY.');
  let url;
  try {
    url = new URL(CALLBACK_URL);
  } catch (e) {
    throw new Error('M-Pesa is not configured: MPESA_CALLBACK_URL must be a valid public HTTPS URL.');
  }
  const isLocal = ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
  if (url.protocol !== 'https:' || isLocal) {
    throw new Error(
      'MPESA_CALLBACK_URL must be a public HTTPS URL (e.g. an ngrok tunnel to /user/mpesa/callback) ' +
      'so Safaricom can deliver payment confirmations.'
    );
  }
}

/**
 * Initiate an STK Push to the given phone number.
 * Resolves { success: false, error } when Safaricom rejects the request;
 * throws on configuration/network problems.
 */
async function initiateSTKPush({ phone, amount, accountReference = 'EmmyyLaptops', transactionDesc = 'Laptop Order' }) {
  const formattedPhone = formatPhoneNumber(phone);
  if (!formattedPhone) {
    throw Object.assign(
      new Error('Invalid phone number. Use 07XXXXXXXX, 01XXXXXXXX or 2547XXXXXXXX format.'),
      { status: 400 }
    );
  }

  const numericAmount = Math.max(1, Math.round(Number(amount)));
  if (!Number.isFinite(numericAmount)) {
    throw Object.assign(new Error('Invalid payment amount'), { status: 400 });
  }

  if (SIMULATE) {
    const id = `${SIM_PREFIX}${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
    return {
      success: true,
      mode: 'simulation',
      merchantRequestId: `M_SIM_${Date.now()}`,
      checkoutRequestId: id,
      customerMessage: `[SIMULATION] STK Push prompt sent to ${formattedPhone}.`,
      phone: formattedPhone,
      amount: numericAmount
    };
  }

  assertConfigured();
  const token = await getOAuthToken();
  const timestamp = getTimestamp();

  const payload = {
    BusinessShortCode: SHORTCODE,
    Password: buildPassword(timestamp),
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: numericAmount,
    PartyA: Number(formattedPhone),
    PartyB: SHORTCODE,
    PhoneNumber: Number(formattedPhone),
    CallBackURL: CALLBACK_URL,
    AccountReference: String(accountReference).substring(0, 12),
    TransactionDesc: String(transactionDesc).substring(0, 13)
  };

  const res = await darajaFetch('/mpesa/stkpush/v1/processrequest', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  let data = {};
  try { data = await res.json(); } catch (e) { /* non-JSON error body */ }

  if (!res.ok || String(data.ResponseCode) !== '0') {
    console.warn('Daraja STK push rejected:', res.status, data);
    return {
      success: false,
      error: data.errorMessage || data.ResponseDescription || 'Safaricom rejected the STK Push request'
    };
  }

  return {
    success: true,
    mode: 'daraja',
    merchantRequestId: data.MerchantRequestID,
    checkoutRequestId: data.CheckoutRequestID,
    customerMessage: data.CustomerMessage || `STK Push sent to ${formattedPhone}. Enter your M-Pesa PIN.`,
    phone: formattedPhone,
    amount: numericAmount
  };
}

/**
 * Ask Safaricom for the outcome of an STK Push (fallback when the callback is lost).
 * Returns { state: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'FAILED', resultCode, resultDesc }.
 */
async function queryStkStatus(checkoutRequestId) {
  const token = await getOAuthToken();
  const timestamp = getTimestamp();

  const res = await darajaFetch('/mpesa/stkpushquery/v1/query', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      BusinessShortCode: SHORTCODE,
      Password: buildPassword(timestamp),
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId
    })
  });

  let data = {};
  try { data = await res.json(); } catch (e) { /* ignore */ }

  // Daraja answers with an error while the customer has not yet responded
  if (data.ResultCode === undefined || data.ResultCode === null) {
    return { state: 'PENDING', resultCode: null, resultDesc: data.errorMessage || 'Awaiting customer' };
  }

  const resultCode = Number(data.ResultCode);
  const resultDesc = data.ResultDesc || '';
  if (resultCode === 0) return { state: 'COMPLETED', resultCode, resultDesc };
  if (resultCode === 1032) return { state: 'CANCELLED', resultCode, resultDesc };
  return { state: 'FAILED', resultCode, resultDesc };
}

module.exports = {
  formatPhoneNumber,
  initiateSTKPush,
  queryStkStatus,
  getOAuthToken,
  isSimulationMode,
  isSimulatedCheckoutId,
  isValidCallbackSecret
};
