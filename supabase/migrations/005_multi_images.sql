-- Support multiple images per note

alter table notes add column image_urls text[] not null default '{}';
alter table course_notes add column image_urls text[] not null default '{}';

update notes
  set image_urls = array[image_url]
  where image_url is not null and image_url <> '';

update course_notes
  set image_urls = array[image_url]
  where image_url is not null and image_url <> '';

alter table notes drop column image_url;
alter table course_notes drop column image_url;
