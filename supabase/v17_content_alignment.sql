-- Text alignment within the profile card (left | center | right)
ALTER TABLE profile_settings
  ADD COLUMN IF NOT EXISTS content_alignment text NOT NULL DEFAULT 'left';

ALTER TABLE profile_settings
  DROP CONSTRAINT IF EXISTS profile_settings_content_alignment_check;

ALTER TABLE profile_settings
  ADD CONSTRAINT profile_settings_content_alignment_check
  CHECK (content_alignment IN ('left', 'center', 'right'));
