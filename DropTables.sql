
-- Add PCBM stream
INSERT INTO streams (name) VALUES ('PCBM') ON CONFLICT DO NOTHING;

-- Map PCBM to class xith, xiith, and xiith+
-- Assuming target_classes array or relational table. The user said 'only for class xith, xiith & xiith+'.
-- I need to check the streams table schema first.

