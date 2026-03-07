-- Create Settings table for maintenance mode and other global configs
CREATE TABLE IF NOT EXISTS settings (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    maintenance_enabled BOOLEAN DEFAULT FALSE,
    maintenance_message TEXT DEFAULT 'Our site is currently under maintenance. We will be back soon!',
    maintenance_opening_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert a default configuration record
INSERT INTO settings (maintenance_enabled, maintenance_message)
SELECT FALSE, 'Our site is currently under maintenance. We will be back soon!'
WHERE NOT EXISTS (SELECT 1 FROM settings LIMIT 1);

-- Enable Row Level Security (RLS)
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read settings
CREATE POLICY "Allow public read access" ON settings
    FOR SELECT USING (true);

-- Only authenticated admins should be able to update (you might need to adjust this depending on your admin roles)
-- For now, let's keep it simple or restricted to service role/manual updates.
