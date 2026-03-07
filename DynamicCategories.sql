
-- Tables for dynamic categories

CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS streams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS competitive_exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Populate initial data if empty
INSERT INTO classes (name) VALUES ('Xth'), ('XIIth') ON CONFLICT DO NOTHING;
INSERT INTO streams (name) VALUES ('Science'), ('Commerce'), ('Arts') ON CONFLICT DO NOTHING;
INSERT INTO competitive_exams (name) VALUES ('JEE'), ('NEET'), ('CUET'), ('NDA') ON CONFLICT DO NOTHING;

-- Subjects Table
CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    stream_id UUID REFERENCES streams(id) ON DELETE CASCADE,
    class_name TEXT, -- For Xth etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Populating Subjects
INSERT INTO subjects (name, stream_id) 
SELECT 'Physics', id FROM streams WHERE name = 'Science';
INSERT INTO subjects (name, stream_id) 
SELECT 'Chemistry', id FROM streams WHERE name = 'Science';
INSERT INTO subjects (name, stream_id) 
SELECT 'Mathematics', id FROM streams WHERE name = 'Science';

INSERT INTO subjects (name, class_name) VALUES ('Mathematics', 'Xth'), ('Science', 'Xth'), ('Social Science', 'Xth'), ('English', 'Xth');
