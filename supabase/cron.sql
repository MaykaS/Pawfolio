-- Free-first reminder delivery schedule for Supabase Cron.
-- Replace YOUR_PROJECT_URL and YOUR_CRON_SECRET before running.
-- Requires pg_cron and pg_net, which Supabase can enable for scheduled HTTP calls.

create extension if not exists pg_cron;
create extension if not exists pg_net;

select
  cron.schedule(
    'pawfolio-send-due-reminders',
    '*/5 * * * *',
    $$
    select
      net.http_post(
        url := 'https://YOUR_PROJECT_URL/api/send-due-push',
        headers := jsonb_build_object(
          'Authorization', 'Bearer YOUR_CRON_SECRET',
          'Content-Type', 'application/json'
        ),
        body := '{}'::jsonb
      );
    $$
  );
