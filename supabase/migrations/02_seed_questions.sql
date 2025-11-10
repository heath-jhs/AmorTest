-- supabase/migrations/02_seed_questions.sql
begin;

insert into questions (text, type, construct1, construct2, weight) values
('I noticed pleasant smells more than usual today.', 'likert', 'sensory', null, 1.2),
('Sounds felt richer or more layered today.', 'likert', 'sensory', 'transcendence', 1.1),
('My skin felt more sensitive to textures.', 'likert', 'sensory', 'embodiment', 1.3),
('Time felt like it slowed down at some point.', 'likert', 'temporal', null, 1.3),
('I felt like being silly or playful.', 'likert', 'playfulness', null, 1.4),
('A memory of us made me smile involuntarily.', 'likert', 'nostalgia', null, 1.4),
('What scent stood out today?', 'freetext', 'sensory', null, 1.2);

commit;
