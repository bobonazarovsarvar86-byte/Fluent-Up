import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/telegram';

async function notifyTelegram(payload: {
  fullName: string; phone: string; plan: string; period: string; amount: number;
  method: string; note?: string; screenshotUrl?: string; userEmail?: string; requestId: string;
}) {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  const TELEGRAM_API_KEY = Deno.env.get('TELEGRAM_API_KEY');
  const CHAT_ID = Deno.env.get('TELEGRAM_ADMIN_CHAT_ID');
  if (!LOVABLE_API_KEY || !TELEGRAM_API_KEY || !CHAT_ID) {
    console.warn('Telegram not configured');
    return;
  }

  const text =
    `🆕 <b>Yangi to'lov so'rovi</b>\n\n` +
    `👤 <b>Ism:</b> ${payload.fullName}\n` +
    `📞 <b>Telefon:</b> ${payload.phone}\n` +
    `📧 <b>Email:</b> ${payload.userEmail ?? '-'}\n` +
    `💳 <b>Reja:</b> ${payload.plan.toUpperCase()} (${payload.period})\n` +
    `💰 <b>Summa:</b> ${payload.amount.toLocaleString('uz-UZ')} so'm\n` +
    `🏦 <b>Usul:</b> ${payload.method}\n` +
    (payload.note ? `📝 <b>Izoh:</b> ${payload.note}\n` : '') +
    `\n🆔 <code>${payload.requestId}</code>`;

  try {
    if (payload.screenshotUrl) {
      await fetch(`${GATEWAY_URL}/sendPhoto`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'X-Connection-Api-Key': TELEGRAM_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          photo: payload.screenshotUrl,
          caption: text,
          parse_mode: 'HTML',
        }),
      });
    } else {
      await fetch(`${GATEWAY_URL}/sendMessage`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'X-Connection-Api-Key': TELEGRAM_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: 'HTML' }),
      });
    }
  } catch (e) {
    console.error('Telegram send failed', e);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const auth = req.headers.get('Authorization');
    if (!auth) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: auth } } }
    );
    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes?.user;
    if (!user) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const body = await req.json();
    const { plan, period, amount, fullName, phone, method, note, screenshotUrl } = body ?? {};
    if (!plan || !fullName || !phone) {
      return new Response(JSON.stringify({ error: 'missing fields' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: inserted, error } = await admin
      .from('subscription_requests')
      .insert({
        user_id: user.id,
        plan,
        period: period ?? 'monthly',
        amount_uzs: amount ?? 0,
        full_name: fullName,
        phone,
        method: method ?? 'payme',
        note: note ?? null,
        screenshot_url: screenshotUrl ?? null,
      })
      .select()
      .single();
    if (error) throw error;

    await notifyTelegram({
      fullName, phone, plan, period: period ?? 'monthly',
      amount: amount ?? 0, method: method ?? 'payme', note,
      screenshotUrl, userEmail: user.email ?? undefined, requestId: inserted.id,
    });

    return new Response(JSON.stringify({ ok: true, request: inserted }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
