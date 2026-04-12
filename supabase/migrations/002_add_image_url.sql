-- Add image_url column to notes
alter table notes add column image_url text;

-- Create storage bucket for note images
insert into storage.buckets (id, name, public)
values ('note-images', 'note-images', true)
on conflict (id) do nothing;

-- Allow public read access to note images
create policy "Public read access on note-images"
  on storage.objects for select
  using (bucket_id = 'note-images');

-- Allow uploads to note-images bucket
create policy "Allow uploads to note-images"
  on storage.objects for insert
  with check (bucket_id = 'note-images');

-- Allow deletes on note-images bucket
create policy "Allow deletes on note-images"
  on storage.objects for delete
  using (bucket_id = 'note-images');
