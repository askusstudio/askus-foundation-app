import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { ip, userId, endpoint, threatType, severity, metadata } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. Log incident to database
    await supabase.from("threat_logs").insert({
      ip_address: ip,
      user_id: userId || null,
      endpoint,
      threat_type: threatType,
      severity,
      metadata: metadata || {},
    });

    // 2. Dispatch automated alert to Telegram if High or Critical
    if (severity === "high" || severity === "critical") {
      const telegramBotToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
      const telegramChatId = Deno.env.get("TELEGRAM_ADMIN_CHAT_ID");

      if (telegramBotToken && telegramChatId) {
        const text = `🚨 *SECURITY ALERT - AskUs App*\n\n*Severity:* ${severity.toUpperCase()}\n*Threat:* ${threatType}\n*Endpoint:* ${endpoint}\n*IP:* \`${ip}\`\n*Timestamp:* ${new Date().toISOString()}`;

        await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: telegramChatId,
            text,
            parse_mode: "Markdown",
          }),
        });
      }
    }

    return new Response(JSON.stringify({ status: "recorded" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
