-- Video IA Studio — Film Bible schema
-- Dedicated instance: https://supabase.gafcore.com/video-ia-studio
-- PostgREST schema: video_ia_studio

create schema if not exists video_ia_studio;

create table if not exists video_ia_studio.projects (
  id bigserial primary key,
  title varchar(255) not null,
  genre varchar(100),
  description text,
  status varchar(50) not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table if not exists video_ia_studio.scenes (
  id bigserial primary key,
  project_id bigint not null references video_ia_studio.projects(id) on delete cascade,
  number integer not null,
  title varchar(255) not null,
  prompt text not null,
  status varchar(50) not null default 'pending',
  duration_sec integer not null default 5,
  video_url varchar(512),
  created_at timestamptz not null default now()
);

create index if not exists scenes_project_id_idx on video_ia_studio.scenes(project_id);

create table if not exists video_ia_studio.characters (
  id bigserial primary key,
  project_id bigint not null references video_ia_studio.projects(id) on delete cascade,
  name varchar(255) not null,
  role varchar(255),
  prompt text,
  created_at timestamptz not null default now()
);

create index if not exists characters_project_id_idx on video_ia_studio.characters(project_id);

create table if not exists video_ia_studio.render_jobs (
  id bigserial primary key,
  project_id bigint not null references video_ia_studio.projects(id) on delete cascade,
  scene_id bigint references video_ia_studio.scenes(id) on delete set null,
  status varchar(50) not null default 'pending',
  progress double precision not null default 0,
  result_url varchar(512),
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create index if not exists render_jobs_project_id_idx on video_ia_studio.render_jobs(project_id);

alter table video_ia_studio.projects enable row level security;
alter table video_ia_studio.scenes enable row level security;
alter table video_ia_studio.characters enable row level security;
alter table video_ia_studio.render_jobs enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'video_ia_studio' and tablename = 'projects' and policyname = 'projects_all_authenticated'
  ) then
    create policy projects_all_authenticated on video_ia_studio.projects
      for all to authenticated using (true) with check (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'video_ia_studio' and tablename = 'scenes' and policyname = 'scenes_all_authenticated'
  ) then
    create policy scenes_all_authenticated on video_ia_studio.scenes
      for all to authenticated using (true) with check (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'video_ia_studio' and tablename = 'characters' and policyname = 'characters_all_authenticated'
  ) then
    create policy characters_all_authenticated on video_ia_studio.characters
      for all to authenticated using (true) with check (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'video_ia_studio' and tablename = 'render_jobs' and policyname = 'render_jobs_all_authenticated'
  ) then
    create policy render_jobs_all_authenticated on video_ia_studio.render_jobs
      for all to authenticated using (true) with check (true);
  end if;
end $$;

grant usage on schema video_ia_studio to postgres, anon, authenticated, service_role, authenticator;
grant all on all tables in schema video_ia_studio to postgres, service_role;
grant select, insert, update, delete on all tables in schema video_ia_studio to authenticated;
grant select on all tables in schema video_ia_studio to anon;
grant usage, select on all sequences in schema video_ia_studio to anon, authenticated, service_role;

notify pgrst, 'reload schema';
