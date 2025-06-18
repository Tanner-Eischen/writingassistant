-- Function to automatically create user settings when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_settings (user_id, enabled_platforms, preferred_tone, goal, real_time_enabled, auto_save_enabled)
  VALUES (
    NEW.id,
    ARRAY['web'],
    'professional',
    'general', 
    true,
    true
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger that calls the function every time a user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 