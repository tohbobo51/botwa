/**
 * Midtrans QRIS Auto-Payment Handler
 * Ganti MIDTRANS_SERVER_KEY di settings.js atau langsung di sini
 */

import axios from 'axios';

// ── Buat order QRIS baru via Midtrans ──────────────────────────────────────
export async function createQrisOrder({ orderId, amount, customerName, serverKey }) {
  const auth = Buffer.from(serverKey + ':').toString('base64');
  const payload = {
    payment_type: 'qris',
    transaction_details: {
      order_id: orderId,
      gross_amount: amount
    },
    customer_details: {
      first_name: customerName
    },
    qris: { acquirer: 'gopay' }
  };
  const res = await axios.post(
    'https://api.midtrans.com/v2/charge',
    payload,
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`
      }
    }
  );
  return res.data;
}

// ── Cek status order ────────────────────────────────────────────────────────
export async function checkOrderStatus(orderId, serverKey) {
  const auth = Buffer.from(serverKey + ':').toString('base64');
  const res = await axios.get(
    `https://api.midtrans.com/v2/${orderId}/status`,
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`
      }
    }
  );
  return res.data; // transaction_status: 'settlement'|'pending'|'expire'|'cancel'
}

// ── Verifikasi signature webhook dari Midtrans ──────────────────────────────
import crypto from 'crypto';
export function verifyMidtransSignature({ orderId, statusCode, grossAmount, serverKey, signatureKey }) {
  const hash = crypto.createHash('sha512')
    .update(orderId + statusCode + grossAmount + serverKey)
    .digest('hex');
  return hash === signatureKey;
}
