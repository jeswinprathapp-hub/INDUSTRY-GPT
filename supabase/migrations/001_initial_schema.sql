-- Enable pgvector extension
create extension if not exists vector with schema public;

-- Profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text not null,
  full_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Documents table
create table public.documents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  filename text not null,
  file_path text not null,
  file_type text not null,
  file_size integer not null,
  status text not null default 'uploaded',
  page_count integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Document chunks table (with vector embedding)
create table public.document_chunks (
  id uuid default gen_random_uuid() primary key,
  document_id uuid references public.documents(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  chunk_index integer not null,
  content text not null,
  embedding vector(768), -- Gemini embedding size
  page_number integer,
  section text,
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Conversations table
create table public.conversations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Messages table
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  citations jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Update updated_at triggers
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger update_documents_updated_at
before update on documents
for each row
execute function update_updated_at_column();

create trigger update_conversations_updated_at
before update on conversations
for each row
execute function update_updated_at_column();

-- Function to handle new user signups
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Row Level Security (RLS) Policies
alter table public.profiles enable row level security;
alter table public.documents enable row level security;
alter table public.document_chunks enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- Profiles policies
create policy "Users can view own profile"
  on profiles for select
  using ( auth.uid() = id );

create policy "Users can update own profile"
  on profiles for update
  using ( auth.uid() = id );

-- Documents policies
create policy "Users can view own documents"
  on documents for select
  using ( auth.uid() = user_id );

create policy "Users can insert own documents"
  on documents for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own documents"
  on documents for update
  using ( auth.uid() = user_id );

create policy "Users can delete own documents"
  on documents for delete
  using ( auth.uid() = user_id );

-- Document chunks policies
create policy "Users can view own chunks"
  on document_chunks for select
  using ( auth.uid() = user_id );

create policy "Users can insert own chunks"
  on document_chunks for insert
  with check ( auth.uid() = user_id );

create policy "Users can delete own chunks"
  on document_chunks for delete
  using ( auth.uid() = user_id );

-- Conversations policies
create policy "Users can view own conversations"
  on conversations for select
  using ( auth.uid() = user_id );

create policy "Users can insert own conversations"
  on conversations for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own conversations"
  on conversations for update
  using ( auth.uid() = user_id );

create policy "Users can delete own conversations"
  on conversations for delete
  using ( auth.uid() = user_id );

-- Messages policies
create policy "Users can view own messages"
  on messages for select
  using ( auth.uid() = user_id );

create policy "Users can insert own messages"
  on messages for insert
  with check ( auth.uid() = user_id );
