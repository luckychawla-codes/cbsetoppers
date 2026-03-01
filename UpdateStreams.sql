UPDATE streams SET name = 'PCM' WHERE name ILIKE '%pcm%';
UPDATE streams SET name = 'PCB' WHERE name ILIKE '%pcb%';
UPDATE streams SET name = 'Commerce' WHERE name ILIKE '%commerce%';
UPDATE streams SET name = 'Humanities' WHERE name ILIKE '%humanities%';

-- Or to delete all existing and insert new:
-- TRUNCATE TABLE streams;
-- INSERT INTO streams (name) VALUES ('PCM'), ('PCB'), ('Commerce'), ('Humanities');
