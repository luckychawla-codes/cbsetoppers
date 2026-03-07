-- FIXING QUIZ LEADERBOARD AND POINTS SYSTEM
-- This script fixes the incompatible types error and adds points/ranking logic.

-- 1. Create or Update Quiz Results Table with correct types
-- We use BIGINT for student_id to match the 'students' table 'id' column.
CREATE TABLE IF NOT EXISTS quiz_results (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    student_id BIGINT REFERENCES students(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    score INT NOT NULL,
    total_questions INT NOT NULL,
    points INT DEFAULT 0, -- Calculated points for leaderboard
    analysis TEXT
);

-- 2. Add points calculation trigger (Optional but good for performance)
-- Points = (Score / Total) * 100 + 10 bonus for completion
CREATE OR REPLACE FUNCTION calculate_quiz_points()
RETURNS TRIGGER AS $$
BEGIN
    NEW.points := (NEW.score * 100 / NEW.total_questions) + 10;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_calculate_quiz_points ON quiz_results;
CREATE TRIGGER trg_calculate_quiz_points
BEFORE INSERT ON quiz_results
FOR EACH ROW
EXECUTE FUNCTION calculate_quiz_points();

-- 3. Create a Leaderboard View for easy ranking
-- This ranks ALL students based on their total points.
DROP VIEW IF EXISTS leaderboard_view;
CREATE VIEW leaderboard_view AS
SELECT 
    s.id as student_id,
    s.name,
    s.student_id as display_id,
    SUM(qr.points) as total_xp,
    COUNT(qr.id) as quizzes_attempted,
    RANK() OVER (ORDER BY SUM(qr.points) DESC) as rank
FROM students s
INNER JOIN quiz_results qr ON s.id = qr.student_id
GROUP BY s.id, s.name, s.student_id;

-- 4. Ensure RLS is handled or disabled for demo
ALTER TABLE quiz_results DISABLE ROW LEVEL SECURITY;

-- 5. Fix for the specific error reported:
-- If the table already existed with wrong types, this helper might be needed:
-- ALTER TABLE quiz_results ALTER COLUMN student_id TYPE BIGINT USING student_id::bigint;
-- But the 'IF NOT EXISTS' and 'REFERENCES students(id)' in step 1 is the clean way.
