-- Ensure PCBM exists as a stream option
INSERT INTO streams (name)
SELECT 'PCBM'
WHERE NOT EXISTS (
    SELECT 1 FROM streams WHERE name = 'PCBM'
);

-- Also ensure it's mapped to relevant classes if you have a mapping table, 
-- but based on your schema.json, 'streams' is just a simple name table.
