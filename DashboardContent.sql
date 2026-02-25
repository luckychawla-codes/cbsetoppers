-- SQL for Dashboard Content Table
CREATE TABLE dashboard_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('section', 'folder', 'file', 'photo', 'video', 'competitive_exam', 'stream')),
    content_link TEXT,
    parent_id UUID REFERENCES dashboard_content(id) ON DELETE CASCADE,
    order_index INT DEFAULT 0,
    class_target TEXT,
    stream_target TEXT,
    exam_target TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE dashboard_content ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public Read Access" ON dashboard_content FOR SELECT USING (true);
CREATE POLICY "Admin All Access" ON dashboard_content FOR ALL USING (auth.role() = 'service_role');
