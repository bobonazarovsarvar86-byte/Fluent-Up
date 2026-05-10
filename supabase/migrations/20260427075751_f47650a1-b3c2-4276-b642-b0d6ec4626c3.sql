-- Update handle_new_user to auto-assign admin role for the designated admin email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  assigned_role public.app_role;
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );

  if new.email = 'bobonazarovsarvar13@gmail.com' then
    assigned_role := 'admin';
  else
    assigned_role := 'user';
  end if;

  insert into public.user_roles (user_id, role)
  values (new.id, assigned_role);

  return new;
end;
$function$;

-- Ensure the trigger exists on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- If the admin user already exists (now or later), backfill the admin role
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::public.app_role
FROM auth.users u
WHERE u.email = 'bobonazarovsarvar13@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;