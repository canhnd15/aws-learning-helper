-- Review questions: log exam questions you got wrong, why you chose your
-- answer, the correct answer, why you were wrong, and the key takeaway.
create table review_questions (
  id uuid primary key default gen_random_uuid(),
  test_number int not null default 1 check (test_number between 1 and 6),
  question text not null default '',
  why_chose text not null default '',
  options text not null default '',
  correct_answer text not null default '',
  wrong_reasons text[] not null default '{}',
  knowledge text not null default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_review_questions_test on review_questions(test_number);

-- RLS
alter table review_questions enable row level security;

create policy "Allow all on review_questions" on review_questions for all using (true) with check (true);
