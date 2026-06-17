// Vercel Serverless Function — приймає заявку та надсилає в Telegram
export default async function handler(req, res) {
  // CORS на випадок майбутніх змін домену
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const { name, phone, niche, budget, source } = req.body || {};

    if (!name || !phone) {
      return res.status(400).json({ ok: false, error: 'Missing required fields' });
    }

    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.error('Missing Telegram env vars');
      return res.status(500).json({ ok: false, error: 'Server misconfigured' });
    }

    const lines = [
      '🔥 *Нова заявка з сайту Prosto*',
      '',
      `👤 *Ім'я:* ${escapeMd(name)}`,
      `📞 *Контакт:* ${escapeMd(phone)}`,
    ];
    if (niche) lines.push(`🏷 *Ніша:* ${escapeMd(niche)}`);
    if (budget) lines.push(`💰 *Бюджет:* ${escapeMd(budget)}`);
    lines.push('');
    lines.push(`📍 *Джерело:* ${escapeMd(source || 'Лендінг Prosto')}`);
    lines.push(`🕓 ${new Date().toLocaleString('uk-UA', { timeZone: 'Europe/Kyiv' })}`);

    const text = lines.join('\n');

    const tgResp = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text,
          parse_mode: 'Markdown',
        }),
      }
    );

    const tgData = await tgResp.json();

    if (!tgData.ok) {
      console.error('Telegram error:', tgData);
      return res.status(502).json({ ok: false, error: 'Telegram delivery failed' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Lead handler error:', err);
    return res.status(500).json({ ok: false, error: 'Internal error' });
  }
}

function escapeMd(str) {
  return String(str).replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}
