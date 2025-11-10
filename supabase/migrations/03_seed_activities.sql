-- supabase/migrations/03_seed_activities.sql
begin;

insert into activities (text, type, duration_minutes, requires_touch, tags) values
('Give each other a 5-minute shoulder massage.', 'intimate', 15, true, '{touch, evening}'),
('Slow dance in the kitchen.', 'intimate', 5, true, '{playful}'),
('Cook a new recipe together.', 'platonic', 45, false, '{food}'),
('Watch a comfort show.', 'neutral', 40, false, '{cozy}');

commit;
