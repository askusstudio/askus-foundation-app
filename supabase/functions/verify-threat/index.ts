import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const ADMIN_SLACK_WEBHOOK_URL = Deno.env.get('ADMIN_SLACK_WEBHOOK_URL') ?? '';
const ADMIN_TELEGRAM_BOT_TOKEN = Deno.env.get('ADMIN_TELEGRAM_BOT_TOKEN') ?? '';
const ADMIN_TELEGRAM_CHAT_ID = Deno.env.get('ADMIN_TELEGRAM_CHAT_ID') ?? '';

async function sendAlert(message: string) {
  // Telegram Webhook
  if (ADMIN_TELEGRAM_BOT_TOKEN && ADMIN_TELEGRAM_CHAT_ID) {
    try {
      await fetch(`https://api.telegram.org/bot${ADMIN_TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: ADMIN_TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: 'Markdown',
        }),
      });
    } catch (e) {
      console.error('[Watchdog] Failed Telegram dispatch:', e);
    }
  }

  // Slack Webhook
  if (ADMIN_SLACK_WEBHOOK_URL) {
    try {
      await fetch(ADMIN_SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message }),
      });
    } catch (e) {
      console.error('[Watchdog] Failed Slack dispatch:', e);
    }
  }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const { ip, endpoint, threatType, severity, metadata } = await req.json();

    if (!ip || !endpoint || !threatType) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: ip, endpoint, threatType' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const normalizedSeverity = ['low', 'medium', 'high', 'critical'].includes(severity)
      ? severity
      : 'medium';

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Insert into public.threat_logs
    const { data: insertedLog, error: dbError } = await supabaseAdmin
      .from('threat_logs')
      .insert({
        ip_address: ip,
        endpoint,
        threat_type: threatType,
        severity: normalizedSeverity,
        metadata: metadata ?? {},
      })
      .select('id')
      .single();

    if (dbError) {
      console.error('[Threat Watchdog] Failed inserting threat log:', dbError);
      throw dbError;
    }

    let alertDispatched = false;

    // 2. Automated Telegram/Slack alert if severity is 'high' or 'critical'
    if (normalizedSeverity === 'high' || normalizedSeverity === 'critical') {
      const alertMessage = 
        `🚨 *[ASKUS SECURITY WATCHDOG ALERT]*\n` +
        `*Incident ID:* \`${insertedLog?.id}\`\n` +
        `*Threat Type:* \`${threatType}\`\n` +
        `*Severity:* *${normalizedSeverity.toUpperCase()}*\n` +
        `*Endpoint:* \`${endpoint}\`\n` +
        `*IP Address:* \`${ip}\`\n` +
        `*Timestamp:* ${new Date().toISOString()}\n` +
        `*Metadata:* \`${JSON.stringify(metadata ?? {})}\``;

      await sendAlert(alertMessage);
      alertDispatched = true;
    }

    return new Response(
      JSON.stringify({
        incident_id: insertedLog?.id,
        logged: true,
        alert_dispatched: alertDispatched,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Watchdog processing failure';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
