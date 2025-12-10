-- Create profiles table
create table profiles (
  id uuid references auth.users not null primary key,
  nickname text unique not null,
  full_name text,
  upline text,
  points integer default 0,
  streak integer default 0,
  join_date timestamp with time zone default timezone('utc'::text, now()),
  avatar_url text,
  constraint nickname_length check (char_length(nickname) >= 3)
);

-- Set up Row Level Security (RLS) for profiles
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Create activities table
create table activities (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) not null,
  type text not null,
  data jsonb default '{}'::jsonb,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  date_string text not null
);

-- Set up RLS for activities
alter table activities enable row level security;

create policy "Activities are viewable by everyone."
  on activities for select
  using ( true );

create policy "Users can insert their own activities."
  on activities for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own activities."
  on activities for update
  using ( auth.uid() = user_id );

-- Create a bucket for activity images
insert into storage.buckets (id, name)
values ('activity-images', 'activity-images');

create policy "Anyone can upload activity images"
  on storage.objects for insert
  with check ( bucket_id = 'activity-images' );

create policy "Anyone can view activity images"
  on storage.objects for select
  using ( bucket_id = 'activity-images' );
