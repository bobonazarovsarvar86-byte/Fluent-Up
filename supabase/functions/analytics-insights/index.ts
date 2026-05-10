import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } },
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const [{ data: profile }, { data: writings }, { data: lessons }] = await Promise.all([
      supabase.from("profiles").select("xp,level,streak_days,english_level,plan").eq("id", user.id).maybeSingle(),
      supabase.from("writing_submissions").select("grammar_score,vocabulary_score,fluency_score,overall_score,ielts_band,mistakes,exercise_type,word_count,created_at").order("created_at", { ascending: false }).limit(30),
      supabase.from("lesson_progress").select("score,xp_earned,completed_at").order("completed_at", { ascending: false }).limit(50),
    ]);

    const summary = {
      profile,
      writingCount: writings?.length ?? 0,
      avgGrammar: avg(writings?.map(w => w.grammar_score)),
      avgVocab: avg(writings?.map(w => w.vocabulary_score)),
      avgFluency: avg(writings?.map(w => w.fluency_score)),
      avgOverall: avg(writings?.map(w => w.overall_score)),
      avgBand: avg(writings?.map(w => Number(w.ielts_band)).filter(Boolean)),
      lessonsDone: lessons?.length ?? 0,
      avgLessonScore: avg(lessons?.map(l => l.score)),
      recentMistakes: (writings ?? []).slice(0, 8).flatMap(w => Array.isArray(w.mistakes) ? w.mistakes : []).slice(0, 30),
    };

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    let aiInsights: any = null;
    if (apiKey) {
      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: "You are an English learning coach. Reply ONLY by calling the provided function. Be specific, actionable, and concise. Use Uzbek for tips when natural." },
            { role: "user", content: `Analyze this learner's data and produce insights:\n${JSON.stringify(summary)}` },
          ],
          tools: [{
            type: "function",
            function: {
              name: "report",
              description: "Personalized learning insights",
              parameters: {
                type: "object",
                properties: {
                  weakest_skill: { type: "string", enum: ["grammar","vocabulary","fluency","listening","speaking","reading","writing"] },
                  strongest_skill: { type: "string" },
                  weak_grammar_topics: { type: "array", items: { type: "string" }, maxItems: 5 },
                  vocab_focus: { type: "array", items: { type: "string" }, maxItems: 6 },
                  next_actions: { type: "array", items: { type: "string" }, maxItems: 4 },
                  motivation: { type: "string" },
                  estimated_band: { type: "number" },
                },
                required: ["weakest_skill","strongest_skill","next_actions","motivation"],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "report" } },
        }),
      });
      if (resp.ok) {
        const j = await resp.json();
        const args = j.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
        if (args) try { aiInsights = JSON.parse(args); } catch {}
      } else if (resp.status === 429 || resp.status === 402) {
        aiInsights = { error: resp.status === 429 ? "rate_limited" : "payment_required" };
      }
    }

    return new Response(JSON.stringify({ summary, aiInsights }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

function avg(arr?: (number | null | undefined)[]) {
  const xs = (arr ?? []).filter((x): x is number => typeof x === "number" && !isNaN(x));
  if (!xs.length) return 0;
  return Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10;
}
