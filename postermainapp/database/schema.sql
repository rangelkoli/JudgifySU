
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('organizer', 'judge');

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) UNIQUE,
    password VARCHAR(255),
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    code VARCHAR(6) UNIQUE,
    role user_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create papers table
CREATE TABLE papers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    abstract TEXT,
    qr_code VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create scores table
CREATE TABLE scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    paper_id UUID NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL CHECK (score >= 1 AND score <= 10),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_paper_user UNIQUE (paper_id, user_id)
);

-- Create indexes
CREATE INDEX idx_users_code ON users(code);
CREATE INDEX idx_papers_qr_code ON papers(qr_code);
CREATE INDEX idx_scores_paper_id ON scores(paper_id);
CREATE INDEX idx_scores_user_id ON scores(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updating updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_papers_updated_at
    BEFORE UPDATE ON papers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scores_updated_at
    BEFORE UPDATE ON scores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add sample data
INSERT INTO users (username, password, first_name, last_name, role) 
VALUES ('admin', 'admin123', 'Admin', 'User', 'organizer');

-- Create a view for score statistics
CREATE VIEW paper_statistics AS
SELECT 
    p.id as paper_id,
    p.title,
    COUNT(s.id) as total_scores,
    ROUND(AVG(s.score)::numeric, 2) as average_score,
    MIN(s.score) as min_score,
    MAX(s.score) as max_score
FROM papers p
LEFT JOIN scores s ON p.id = s.paper_id
GROUP BY p.id, p.title;

-- Create function to get paper rankings
CREATE OR REPLACE FUNCTION get_paper_rankings()
RETURNS TABLE (
    rank BIGINT,
    paper_id UUID,
    title VARCHAR(255),
    average_score NUMERIC,
    total_scores BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ROW_NUMBER() OVER (ORDER BY AVG(s.score) DESC) as rank,
        p.id,
        p.title,
        ROUND(AVG(s.score)::numeric, 2) as average_score,
        COUNT(s.id) as total_scores
    FROM papers p
    LEFT JOIN scores s ON p.id = s.paper_id
    GROUP BY p.id, p.title
    ORDER BY average_score DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to get judge scoring statistics
CREATE OR REPLACE FUNCTION get_judge_statistics(judge_id UUID)
RETURNS TABLE (
    total_scores BIGINT,
    average_score NUMERIC,
    papers_scored BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(s.id) as total_scores,
        ROUND(AVG(s.score)::numeric, 2) as average_score,
        COUNT(DISTINCT s.paper_id) as papers_scored
    FROM scores s
    WHERE s.user_id = judge_id;
END;
$$ LANGUAGE plpgsql;

-- Add Row Level Security (RLS)
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Judges can only see their own scores"
    ON scores
    FOR SELECT
    USING (user_id = auth.uid() OR 
           EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'organizer'));

CREATE POLICY "Judges can only update their own scores"
    ON scores
    FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Judges can only insert their own scores"
    ON scores
    FOR INSERT
    WITH CHECK (user_id = auth.uid());
