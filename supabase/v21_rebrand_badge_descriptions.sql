-- cried.bio v21: Update badge descriptions after rebrand from BioForge

UPDATE badges SET description = replace(description, 'BioForge', 'cried.bio') WHERE description ILIKE '%BioForge%';
UPDATE badges SET description = replace(description, 'bioforge.blog', 'cried.bio') WHERE description ILIKE '%bioforge%';

-- Ensure founder badge copy is correct
UPDATE badges SET description = 'Founder of cried.bio' WHERE slug = 'founder';
