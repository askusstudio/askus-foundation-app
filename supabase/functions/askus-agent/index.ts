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
    const { query } = await req.json();
    if (!query) {
      return new Response(JSON.stringify({ error: "Missing query parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. Generate Query Embedding via OpenAI
    const openAiKey = Deno.env.get("OPENAI_API_KEY");
    const embeddingRes = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: query,
        model: "text-embedding-3-small",
      }),
    });

    const embeddingJson = await embeddingRes.json();
    const queryEmbedding = embeddingJson.data[0].embedding;

    // 2. Perform Vector Cosine Similarity Search in Postgres
    const { data: matchedDocs, error: matchError } = await supabase.rpc(
      "match_foundation_docs",
      {
        query_embedding: queryEmbedding,
        match_threshold: 0.72,
        match_count: 3,
      }
    );

    if (matchError) throw matchError;

    // 3. Fallback boundary if no match is found
    if (!matchedDocs || matchedDocs.length === 0) {
      return new Response(
        JSON.stringify({
          answer: "I can only assist with questions regarding AskUs Foundation initiatives, drives, centres, and policies.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Synthesize Answer with Grounded Context
    const contextText = matchedDocs.map((doc: any) => `${doc.title}: ${doc.content}`).join("\n\n");
    const completionRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are the official AskUs Foundation Assistant. Answer the user's question using ONLY the provided foundation context. If the answer is not in the context, state that you do not have that operational record.\n\nContext:\n${contextText}`,
          },
          { role: "user", content: query },
        ],
        temperature: 0.1,
      }),
    });

    const completionJson = await completionRes.json();
    const answer = completionJson.choices[0].message.content;

    return new Response(JSON.stringify({ answer }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
