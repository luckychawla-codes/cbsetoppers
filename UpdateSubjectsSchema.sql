-- SQL Update to support multiple classes, streams, and competitive exams for subjects
ALTER TABLE subjects 
ADD COLUMN IF NOT EXISTS target_classes TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS target_streams TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS target_exams TEXT[] DEFAULT '{}';

-- Migrate existing single-selection data to the new array columns
UPDATE subjects 
SET target_classes = ARRAY[target_class]::TEXT[] 
WHERE target_class IS NOT NULL 
AND (target_classes IS NULL OR array_length(target_classes, 1) = 0);

UPDATE subjects 
SET target_streams = ARRAY[target_stream]::TEXT[] 
WHERE target_stream IS NOT NULL 
AND target_stream != ''
AND (target_streams IS NULL OR array_length(target_streams, 1) = 0);

-- Note: Class X subjects should have 'Science' as default stream
UPDATE subjects
SET target_streams = array_append(target_streams, 'Science')
WHERE 'X' = ANY(target_classes)
AND NOT ('Science' = ANY(target_streams));
