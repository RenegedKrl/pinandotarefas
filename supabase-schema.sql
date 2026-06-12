-- Create a table for user profiles to store gamification stats
create table public.profiles (
  id uuid references auth.users not null primary key,
  level integer default 1 not null,
  xp integer default 0 not null,
  hp integer default 100 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS) for profiles
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Create a table for tasks
create table public.tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  description text,
  difficulty text check (difficulty in ('easy', 'medium', 'hard')) default 'medium' not null,
  completed boolean default false not null,
  due_date timestamp with time zone,
  list_id text default 'inbox' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up RLS for tasks
alter table public.tasks enable row level security;

create policy "Users can view their own tasks."
  on tasks for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own tasks."
  on tasks for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own tasks."
  on tasks for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own tasks."
  on tasks for delete
  using ( auth.uid() = user_id );

-- Function to automatically create a profile when a new user signs up
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, level, xp, hp)
  values (new.id, 1, 0, 100);
  return new;
end;
$$;

-- Trigger to call the function on signup
-- drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- IMPORTANTE: Se você já rodou o script antigo, apenas rode as quatro linhas abaixo:
-- alter table public.tasks add column due_date timestamp with time zone;
-- alter table public.tasks add column list_id text default 'inbox' not null;
-- alter table public.tasks add column description text;
-- alter table public.tasks add column extras jsonb default '{}'::jsonb;
