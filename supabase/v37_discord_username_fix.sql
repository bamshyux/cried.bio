-- Fix placeholder Discord usernames saved as "Discord #1234"
update public.profile_settings
set discord_username = ''
where discord_username ~* '^Discord #\d{4}$';
