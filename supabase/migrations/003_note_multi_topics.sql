-- Junction table for notes <-> topics (many-to-many)
create table note_topics (
  note_id uuid references notes(id) on delete cascade,
  topic_id uuid references topics(id) on delete cascade,
  primary key (note_id, topic_id)
);

create index idx_note_topics_note on note_topics(note_id);
create index idx_note_topics_topic on note_topics(topic_id);

-- Migrate existing topic_id data into junction table
insert into note_topics (note_id, topic_id)
select id, topic_id from notes where topic_id is not null;

-- Drop old column
alter table notes drop column topic_id;

-- RLS for junction table
alter table note_topics enable row level security;
create policy "Allow all on note_topics" on note_topics for all using (true) with check (true);
