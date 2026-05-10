import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const body = await req.json();
    const { text, exercise_type = "sentence", level = "intermediate", prompt = "" } = body ?? {};
    if (!text || typeof text !== "string" || text.trim().length < 3) {
      return new Response(JSON.stringify({ error: "Text too short" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (text.length > 8000) {
      return new Response(JSON.stringify({ error: "Text too long (max 8000 chars)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Quota
    const { data: quota } = await supabase.rpc("can_submit_writing", { _user_id: userId });
    if (quota && quota.allowed === false) {
      return new Response(JSON.stringify({ error: "daily_limit", quota }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const sys = `You are an expert English writing teacher. Evaluate the user's writing and respond ONLY by calling the provided tool.
- Be encouraging but accurate.
- Score 0-10 for grammar, vocabulary, fluency. Overall is the average rounded to integer.
- ielts_band: 0-9 in 0.5 steps, only for IELTS exercise types, otherwise null.
- mistakes: array of {original, correction, explanation} (max 8).
- suggestions: array of short strings with vocabulary upgrades or natural alternatives (max 6).
- corrected_text: full corrected version of the user's writing.
- feedback: 2-4 sentences in friendly tone, mentioning strengths + how to improve. Use simple English.`;

    const userMsg = `Exercise type: ${exercise_type}
Target level: ${level}
${prompt ? `Prompt: ${prompt}\n` : ""}
Student writing:
"""
${text}
"""`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: userMsg },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "submit_writing_evaluation",
              description: "Return the structured writing evaluation",
              parameters: {
                type: "object",
                properties: {
                  grammar_score: { type: "integer", minimum: 0, maximum: 10 },
                  vocabulary_score: { type: "integer", minimum: 0, maximum: 10 },
                  fluency_score: { type: "integer", minimum: 0, maximum: 10 },
                  overall_score: { type: "integer", minimum: 0, maximum: 10 },
                  ielts_band: { type: ["number", "null"] },
                  corrected_text: { type: "string" },
                  feedback: { type: "string" },
                  mistakes: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        original: { type: "string" },
                        correction: { type: "string" },
                        explanation: { type: "string" },
                      },
                      required: ["original", "correction", "explanation"],
                      additionalProperties: false,
                    },
                  },
                  suggestions: { type: "array", items: { type: "string" } },
                },
                required: [
                  "grammar_score",
                  "vocabulary_score",
                  "fluency_score",
                  "overall_score",
                  "corrected_text",
                  "feedback",
                  "mistakes",
                  "suggestions",
                ],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "submit_writing_evaluation" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "AI rate limit, try again shortly" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiResp.text();
      console.error("AI gateway error", aiResp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiResp.json();
    const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error("No tool call", JSON.stringify(aiJson));
      return new Response(JSON.stringify({ error: "AI did not return evaluation" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const evalResult = JSON.parse(toolCall.function.arguments);

    const wordCount = text.trim().split(/\s+/).length;
    const xpEarned = Math.max(5, Math.round((evalResult.overall_score ?? 5) * 3));

    const { data: inserted, error: insertErr } = await supabase
      .from("writing_submissions")
      .insert({
        user_id: userId,
        exercise_type,
        level,
        prompt,
        text,
        corrected_text: evalResult.corrected_text,
        grammar_score: evalResult.grammar_score,
        vocabulary_score: evalResult.vocabulary_score,
        fluency_score: evalResult.fluency_score,
        overall_score: evalResult.overall_score,
        ielts_band: evalResult.ielts_band ?? null,
        mistakes: evalResult.mistakes ?? [],
        suggestions: evalResult.suggestions ?? [],
        feedback: evalResult.feedback,
        xp_earned: xpEarned,
        word_count: wordCount,
      })
      .select()
      .single();

    if (insertErr) {
      console.error("Insert error", insertErr);
      return new Response(JSON.stringify({ error: insertErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase.rpc("record_writing_submission", { _user_id: userId });

    // Award XP
    const { data: prof } = await supabase
      .from("profiles")
      .select("xp")
      .eq("id", userId)
      .single();
    if (prof) {
      await supabase
        .from("profiles")
        .update({ xp: (prof.xp ?? 0) + xpEarned })
        .eq("id", userId);
    }

    return new Response(JSON.stringify({ submission: inserted }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("check-writing error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
