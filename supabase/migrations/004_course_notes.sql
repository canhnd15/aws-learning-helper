-- Course Notes: separate from exam-question notes

create table course_sections (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz default now()
);

create table course_notes (
  id uuid primary key default gen_random_uuid(),
  section_id uuid references course_sections(id) on delete set null,
  title text not null default '',
  content text not null default '',
  image_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_course_notes_section on course_notes(section_id);

insert into course_sections (name) values
  ('Networking & VPC'),
  ('Compute'),
  ('Storage'),
  ('Databases'),
  ('Security & IAM'),
  ('Monitoring & Logging');

alter table course_sections enable row level security;
alter table course_notes enable row level security;

create policy "Allow all on course_sections" on course_sections for all using (true) with check (true);
create policy "Allow all on course_notes" on course_notes for all using (true) with check (true);
