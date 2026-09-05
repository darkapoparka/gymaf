-- CI ONLY: provider-shaped authentication tables/functions for vanilla PostgreSQL.
-- This simulates JWT context; it does NOT test real Supabase Auth, tokens, MFA or cookies.
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create schema auth;
create schema extensions;
create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);
create table auth.sessions(id uuid primary key,user_id uuid not null references auth.users(id));
create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),'')::jsonb,'{}'::jsonb) $$;
create function auth.uid() returns uuid language sql stable as $$ select (auth.jwt()->>'sub')::uuid $$;
create function auth.role() returns text language sql stable as $$ select auth.jwt()->>'role' $$;
grant usage on schema auth to anon,authenticated,service_role;
grant execute on function auth.jwt(),auth.uid(),auth.role() to anon,authenticated,service_role;
