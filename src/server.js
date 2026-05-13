import express from 'express';
import { createServer } from 'http';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const packageInfo = require('../package.json');

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || process.env.SERVER_PORT || 3000;

app.all('/', (req, res) => {
	if (process.send) {
		process.send('uptime');
		process.once('message', (uptime) => {
			res.json({
				bot_name: packageInfo.name,
				version: packageInfo.version,
				author: packageInfo.author,
				description: packageInfo.description,
				uptime: `${Math.floor(uptime)} seconds`
			});
		});
	} else res.json({ error: 'Process not running with IPC' });
});

app.all('/process', (req, res) => {
	const { send } = req.query;
	if (!send) return res.status(400).json({ error: 'Missing send query' });
	if (process.send) {
		process.send(send)
		res.json({ status: 'Send', data: send });
	} else res.json({ error: 'Process not running with IPC' });
});

app.all('/chat', (req, res) => {
	const { message, to } = req.query;
	if (!message || !to) return res.status(400).json({ error: 'Missing message or to query' });
	res.json({ status: 200, mess: 'does not start' })
});


// ── Midtrans Webhook Endpoint ──────────────────────────────────────────────
app.use('/midtrans/webhook', express.json());
app.post('/midtrans/webhook', async (req, res) => {
  try {
    const notif = req.body;
    const { order_id, transaction_status, fraud_status, gross_amount, signature_key, status_code } = notif;
    // Forward ke handler global yang di-set oleh bot
    if (typeof global.midtransWebhookHandler === 'function') {
      await global.midtransWebhookHandler({ orderId: order_id, status: transaction_status, fraudStatus: fraud_status, grossAmount: gross_amount, signatureKey: signature_key, statusCode: status_code });
    }
    res.status(200).json({ status: 'OK' });
  } catch (err) {
    console.error('[Midtrans Webhook Error]', err.message);
    res.status(500).json({ status: 'ERROR', message: err.message });
  }
});

export { app, server, PORT };