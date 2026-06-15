-- cried.bio v22: Black & white accent — update legacy teal defaults

UPDATE profile_settings SET accent_color = '#fafafa' WHERE accent_color IN ('#00e5cc', '#00c9b4');
UPDATE badges SET color = '#fafafa' WHERE slug = 'developer' AND color IN ('#00e5cc', '#00c9b4');

ALTER TABLE profile_settings ALTER COLUMN accent_color SET DEFAULT '#fafafa';
