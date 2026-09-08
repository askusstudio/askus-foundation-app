import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const UPSTASH_REDIS_REST_URL = Deno.env.get('UPSTASH_REDIS_REST_URL') ?? '';
const UPSTASH_REDIS_REST_TOKEN = Deno.env.get('UPSTASH_REDIS_REST_TOKEN') ?? '';
const ADMIN_SLACK_WEBHOOK_URL = Deno.env.get('ADMIN_SLACK_WEBHOOK_URL') ?? '';
const ADMIN_TELEGRAM_BOT_TOKEN = Deno.env.get('ADMIN_TELEGRAM_BOT_TOKEN') ?? '';
const ADMIN_TELEGRAM_CHAT_ID = Deno.env.get('ADMIN_TELEGRAM_CHAT_ID') ?? '';

async function callUpstash(command: string[]): Promise<any> {
  const res = await fetch(`${UPSTASH_REDIS_REST_URL}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  });
  const json = await res.json();
  return json.result;
}

async function dispatchAdminAlert(alert: {
  rule: string;
  ip: string;
  userId?: string;
  severity: string;
  actionTaken: string;
}) {
  const alertText = `🚨 *[SECURITY WATCHDOG ALERT]*\n` +
    `*Rule:* ${alert.rule}\n` +
    `*Severity:* ${alert.severity}\n` +
    `*IP:* \`${alert.ip}\`\n` +
    `*User ID:* \`${alert.userId ?? 'ANONYMOUS'}\`\n` +
    `*Action:* ${alert.actionTaken}\n` +
    `*Time:* ${new Date().toISOString()}`;

  // 1. Dispatch to Telegram if configured
  if (ADMIN_TELEGRAM_BOT_TOKEN && ADMIN_TELEGRAM_CHAT_ID) {
    try {
      await fetch(`https://api.telegram.org/bot${ADMIN_TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: ADMIN_TELEGRAM_CHAT_ID,
          text: alertText,
          parse_mode: 'Markdown',
        }),
      });
    } catch (e) {
      console.error('[Watchdog] Failed to dispatch Telegram alert:', e);
    }
  }

  // 2. Dispatch to Slack Webhook if configured
  if (ADMIN_SLACK_WEBHOOK_URL) {
    try {
      await fetch(ADMIN_SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: alertText }),
      });
    } catch (e) {
      console.error('[Watchdog] Failed to dispatch Slack alert:', e);
    }
  }
}

serve(async (req: Request) => {
  try {
    const { action, ip, identifier, userId } = await req.json();

    if (!action || !ip) {
      return new Response(JSON.stringify({ error: 'Missing action or ip' }), { status: 400 });
    }

    // Check if IP is currently banned
    const isBanned = await callUpstash(['GET', `ban:${ip}`]);
    if (isBanned) {
      return new Response(
        JSON.stringify({ error: 'IP is temporarily quarantined due to security violations' }),
        { status: 429 }
      );
    }

    if (action === 'OTP_REQUEST') {
      const key = `ratelimit:otp:${ip}:${identifier ?? ''}`;
      const count = await callUpstash(['INCR', key]);
      if (count === 1) {
        await callUpstash(['EXPIRE', key, '600']); // 10 minute sliding window
      }

      if (count > 5) {
        // Brute-force threshold breached -> 1-hour ban
        await callUpstash(['SETEX', `ban:${ip}`, '3600', 'BANNED_OTP_BRUTE_FORCE']);
        await dispatchAdminAlert({
          rule: 'AUTH_BRUTE_FORCE',
          ip,
          userId,
          severity: 'HIGH',
          actionTaken: '1-HOUR IP QUARANTINE',
        });
        return new Response(
          JSON.stringify({ error: 'Too many OTP requests. IP banned for 1 hour.' }),
          { status: 429 }
        );
      }
    } else if (action === 'DOCUMENT_UPLOAD') {
      const key = `ratelimit:upload:${userId ?? ip}`;
      const count = await callUpstash(['INCR', key]);
      if (count === 1) {
        await callUpstash(['EXPIRE', key, '300']); // 5 minute window
      }

      if (count > 3) {
        // Upload flooding threshold breached
        await dispatchAdminAlert({
          rule: 'UPLOAD_FLOODING',
          ip,
          userId,
          severity: 'HIGH',
          actionTaken: 'UPLOAD ROUTE FROZEN FOR 30 MIN',
        });
        return new Response(
          JSON.stringify({ error: 'Upload rate limit exceeded. Please wait 5 minutes.' }),
          { status: 429 }
        );
      }
    }

    return new Response(JSON.stringify({ allowed: true }), { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Watchdog Internal Error';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
});
