-- Add columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_daily_reward_at timestamptz,
  ADD COLUMN IF NOT EXISTS daily_reward_streak integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS xp_boost_until timestamptz,
  ADD COLUMN IF NOT EXISTS streak_freezes integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS equipped_avatar text,
  ADD COLUMN IF NOT EXISTS equipped_theme text;

-- ============ COIN TRANSACTIONS ============
CREATE TABLE IF NOT EXISTS public.coin_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount integer NOT NULL,
  reason text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users see own coin tx" ON public.coin_transactions FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'));
CREATE INDEX IF NOT EXISTS idx_coin_tx_user ON public.coin_transactions(user_id, created_at DESC);

-- ============ SHOP ITEMS ============
CREATE TABLE IF NOT EXISTS public.shop_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  category text NOT NULL,            -- avatar | theme | booster | freeze | badge
  price_coins integer NOT NULL,
  icon text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone reads shop" ON public.shop_items FOR SELECT TO authenticated USING (active = true);
CREATE POLICY "admins manage shop" ON public.shop_items FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- ============ INVENTORY ============
CREATE TABLE IF NOT EXISTS public.user_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  item_id uuid NOT NULL REFERENCES public.shop_items(id) ON DELETE CASCADE,
  acquired_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, item_id)
);
ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users see own inventory" ON public.user_inventory FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- ============ FRIENDSHIPS ============
CREATE TABLE IF NOT EXISTS public.friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending | accepted | rejected | blocked
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (sender_id, receiver_id),
  CHECK (sender_id <> receiver_id)
);
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users see own friendships" ON public.friendships FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "users send friend requests" ON public.friendships FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "users update own friendships" ON public.friendships FOR UPDATE TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "users delete own friendships" ON public.friendships FOR DELETE TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- ============ CHALLENGES ============
CREATE TABLE IF NOT EXISTS public.challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id uuid NOT NULL,
  opponent_id uuid NOT NULL,
  type text NOT NULL,                 -- vocab | speed_quiz | listening | speaking
  status text NOT NULL DEFAULT 'pending', -- pending | active | completed | declined
  challenger_score integer,
  opponent_score integer,
  winner_id uuid,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users see own challenges" ON public.challenges FOR SELECT TO authenticated
  USING (auth.uid() = challenger_id OR auth.uid() = opponent_id);
CREATE POLICY "users create challenges" ON public.challenges FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = challenger_id);
CREATE POLICY "participants update challenges" ON public.challenges FOR UPDATE TO authenticated
  USING (auth.uid() = challenger_id OR auth.uid() = opponent_id);

-- ============ RPC: claim_daily_reward ============
CREATE OR REPLACE FUNCTION public.claim_daily_reward(_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _last timestamptz;
  _streak integer;
  _reward integer;
  _new_streak integer;
BEGIN
  IF auth.uid() <> _user_id THEN RAISE EXCEPTION 'not authorized'; END IF;
  SELECT last_daily_reward_at, daily_reward_streak INTO _last, _streak
    FROM public.profiles WHERE id = _user_id FOR UPDATE;

  IF _last IS NOT NULL AND _last::date = CURRENT_DATE THEN
    RETURN jsonb_build_object('claimed', false, 'reason', 'already_claimed');
  END IF;

  IF _last IS NOT NULL AND _last::date = CURRENT_DATE - INTERVAL '1 day' THEN
    _new_streak := COALESCE(_streak,0) + 1;
  ELSE
    _new_streak := 1;
  END IF;

  -- Reward grows with streak: 10, 15, 20, 25, 30, 40, 50 cap
  _reward := LEAST(10 + (_new_streak - 1) * 5, 50);

  UPDATE public.profiles
    SET coins = coins + _reward,
        last_daily_reward_at = now(),
        daily_reward_streak = _new_streak
    WHERE id = _user_id;

  INSERT INTO public.coin_transactions(user_id, amount, reason, metadata)
    VALUES (_user_id, _reward, 'daily_reward', jsonb_build_object('streak', _new_streak));

  RETURN jsonb_build_object('claimed', true, 'reward', _reward, 'streak', _new_streak);
END; $$;

-- ============ RPC: award_coins ============
CREATE OR REPLACE FUNCTION public.award_coins(_user_id uuid, _amount integer, _reason text, _metadata jsonb DEFAULT '{}'::jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() <> _user_id AND NOT has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  IF _amount <= 0 THEN RAISE EXCEPTION 'amount must be positive'; END IF;
  UPDATE public.profiles SET coins = coins + _amount WHERE id = _user_id;
  INSERT INTO public.coin_transactions(user_id, amount, reason, metadata)
    VALUES (_user_id, _amount, _reason, _metadata);
END; $$;

-- ============ RPC: purchase_shop_item ============
CREATE OR REPLACE FUNCTION public.purchase_shop_item(_user_id uuid, _item_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _price integer;
  _category text;
  _slug text;
  _balance integer;
  _exists boolean;
BEGIN
  IF auth.uid() <> _user_id THEN RAISE EXCEPTION 'not authorized'; END IF;
  SELECT price_coins, category, slug INTO _price, _category, _slug
    FROM public.shop_items WHERE id = _item_id AND active = true;
  IF _price IS NULL THEN RAISE EXCEPTION 'item not found'; END IF;

  SELECT coins INTO _balance FROM public.profiles WHERE id = _user_id FOR UPDATE;
  IF _balance < _price THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_enough_coins');
  END IF;

  -- Boosters/freezes are consumable; others go to inventory
  IF _category IN ('booster','freeze') THEN
    IF _category = 'booster' THEN
      UPDATE public.profiles SET xp_boost_until = GREATEST(COALESCE(xp_boost_until, now()), now()) + interval '24 hours' WHERE id = _user_id;
    ELSE
      UPDATE public.profiles SET streak_freezes = streak_freezes + 1 WHERE id = _user_id;
    END IF;
  ELSE
    SELECT EXISTS(SELECT 1 FROM public.user_inventory WHERE user_id = _user_id AND item_id = _item_id) INTO _exists;
    IF _exists THEN
      RETURN jsonb_build_object('success', false, 'reason', 'already_owned');
    END IF;
    INSERT INTO public.user_inventory(user_id, item_id) VALUES (_user_id, _item_id);
  END IF;

  UPDATE public.profiles SET coins = coins - _price WHERE id = _user_id;
  INSERT INTO public.coin_transactions(user_id, amount, reason, metadata)
    VALUES (_user_id, -_price, 'purchase', jsonb_build_object('item_id', _item_id, 'slug', _slug));

  RETURN jsonb_build_object('success', true, 'category', _category);
END; $$;

-- ============ RPC: equip_item ============
CREATE OR REPLACE FUNCTION public.equip_item(_user_id uuid, _item_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _category text; _slug text;
BEGIN
  IF auth.uid() <> _user_id THEN RAISE EXCEPTION 'not authorized'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.user_inventory WHERE user_id = _user_id AND item_id = _item_id) THEN
    RAISE EXCEPTION 'not owned';
  END IF;
  SELECT category, slug INTO _category, _slug FROM public.shop_items WHERE id = _item_id;
  IF _category = 'avatar' THEN
    UPDATE public.profiles SET equipped_avatar = _slug WHERE id = _user_id;
  ELSIF _category = 'theme' THEN
    UPDATE public.profiles SET equipped_theme = _slug WHERE id = _user_id;
  END IF;
END; $$;

-- ============ RPC: respond_friend_request ============
CREATE OR REPLACE FUNCTION public.respond_friend_request(_request_id uuid, _accept boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.friendships
    SET status = CASE WHEN _accept THEN 'accepted' ELSE 'rejected' END,
        updated_at = now()
    WHERE id = _request_id AND receiver_id = auth.uid() AND status = 'pending';
END; $$;

-- ============ RPC: complete_challenge ============
CREATE OR REPLACE FUNCTION public.complete_challenge(_challenge_id uuid, _my_score integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _c public.challenges%rowtype;
  _is_challenger boolean;
  _winner uuid;
  _coin_reward integer := 30;
  _xp_reward integer := 50;
BEGIN
  SELECT * INTO _c FROM public.challenges WHERE id = _challenge_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'not found'; END IF;
  IF auth.uid() NOT IN (_c.challenger_id, _c.opponent_id) THEN RAISE EXCEPTION 'not authorized'; END IF;

  _is_challenger := auth.uid() = _c.challenger_id;
  IF _is_challenger THEN
    UPDATE public.challenges SET challenger_score = _my_score WHERE id = _challenge_id;
  ELSE
    UPDATE public.challenges SET opponent_score = _my_score WHERE id = _challenge_id;
  END IF;

  SELECT * INTO _c FROM public.challenges WHERE id = _challenge_id;
  IF _c.challenger_score IS NOT NULL AND _c.opponent_score IS NOT NULL THEN
    IF _c.challenger_score > _c.opponent_score THEN _winner := _c.challenger_id;
    ELSIF _c.opponent_score > _c.challenger_score THEN _winner := _c.opponent_id;
    END IF;
    UPDATE public.challenges SET winner_id = _winner, status = 'completed', completed_at = now()
      WHERE id = _challenge_id;
    IF _winner IS NOT NULL THEN
      UPDATE public.profiles SET coins = coins + _coin_reward, xp = xp + _xp_reward WHERE id = _winner;
      INSERT INTO public.coin_transactions(user_id, amount, reason, metadata)
        VALUES (_winner, _coin_reward, 'challenge_win', jsonb_build_object('challenge_id', _challenge_id));
    END IF;
  END IF;

  RETURN jsonb_build_object('done', _c.challenger_score IS NOT NULL AND _c.opponent_score IS NOT NULL,
                            'winner', _winner);
END; $$;

-- ============ Seed shop items ============
INSERT INTO public.shop_items (slug, name, description, category, price_coins, icon) VALUES
  ('avatar_fox','Fox Avatar','Cunning fox avatar','avatar',150,'🦊'),
  ('avatar_owl','Owl Avatar','Wise owl avatar','avatar',150,'🦉'),
  ('avatar_dragon','Dragon Avatar','Legendary dragon','avatar',500,'🐉'),
  ('avatar_unicorn','Unicorn Avatar','Magical unicorn','avatar',500,'🦄'),
  ('theme_neon','Neon Theme','Vibrant neon palette','theme',300,'🌈'),
  ('theme_sunset','Sunset Theme','Warm sunset palette','theme',300,'🌅'),
  ('theme_ocean','Ocean Theme','Cool ocean palette','theme',300,'🌊'),
  ('booster_xp_24h','XP Booster 24h','Double XP for 24 hours','booster',200,'⚡'),
  ('freeze_streak','Streak Freeze','Protect your streak for 1 day','freeze',100,'🧊'),
  ('badge_scholar','Scholar Badge','Show off your dedication','badge',400,'🎓')
ON CONFLICT (slug) DO NOTHING;