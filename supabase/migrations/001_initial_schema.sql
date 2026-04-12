-- AWS SAA-C03 Exam Helper Schema

-- Sections (knowledge pool by exam domain)
create table sections (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz default now()
);

-- Topics (knowledge pool by AWS service/topic)
create table topics (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz default now()
);

-- Tests (exam attempts)
create table tests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

-- Notes (individual question notes)
create table notes (
  id uuid primary key default gen_random_uuid(),
  test_id uuid references tests(id) on delete cascade,
  section_id uuid references sections(id) on delete set null,
  topic_id uuid references topics(id) on delete set null,
  title text not null default '',
  content text not null default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes for pool lookups
create index idx_notes_section on notes(section_id);
create index idx_notes_topic on notes(topic_id);
create index idx_notes_test on notes(test_id);

-- Seed default sections
insert into sections (name) values
  ('Design Secure Architectures'),
  ('Design Resilient Architectures'),
  ('Design High-Performing Architectures'),
  ('Design Cost-Optimized Architectures');

-- Seed common topics
insert into topics (name) values
  ('S3'), ('EC2'), ('ALB'), ('RDS'),
  ('IAM'), ('VPC'), ('CloudFront'), ('Lambda'),
  ('DynamoDB'), ('ECS'), ('EKS'), ('Route 53'),
  ('SNS'), ('SQS'), ('CloudWatch'), ('Auto Scaling'),
  ('EBS'), ('EFS'), ('ElastiCache'), ('Kinesis'),
  ('API Gateway'), ('CloudFormation'), ('Secrets Manager'), ('KMS');

-- Enable Row Level Security (optional, can be configured per-user later)
alter table sections enable row level security;
alter table topics enable row level security;
alter table tests enable row level security;
alter table notes enable row level security;

-- Allow all operations for now (no auth required)
create policy "Allow all on sections" on sections for all using (true) with check (true);
create policy "Allow all on topics" on topics for all using (true) with check (true);
create policy "Allow all on tests" on tests for all using (true) with check (true);
create policy "Allow all on notes" on notes for all using (true) with check (true);
