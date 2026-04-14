-- Quick notes (standalone notes not tied to any test or section)
create table quick_notes (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  content text not null default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Junction table for quick_notes <-> topics (many-to-many)
create table quick_note_topics (
  quick_note_id uuid references quick_notes(id) on delete cascade,
  topic_id uuid references topics(id) on delete cascade,
  primary key (quick_note_id, topic_id)
);

create index idx_quick_note_topics_note on quick_note_topics(quick_note_id);
create index idx_quick_note_topics_topic on quick_note_topics(topic_id);

-- RLS
alter table quick_notes enable row level security;
alter table quick_note_topics enable row level security;

create policy "Allow all on quick_notes" on quick_notes for all using (true) with check (true);
create policy "Allow all on quick_note_topics" on quick_note_topics for all using (true) with check (true);
