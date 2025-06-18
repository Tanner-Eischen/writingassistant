-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table is handled by Supabase Auth

-- Documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Suggestions table
CREATE TABLE suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
  start_index INTEGER NOT NULL,
  end_index INTEGER NOT NULL,
  issue_type TEXT NOT NULL CHECK (issue_type IN ('grammar', 'spelling', 'style', 'clarity')),
  original_text TEXT NOT NULL,
  suggested_text TEXT NOT NULL,
  explanation TEXT NOT NULL,
  accepted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Readability scores table
CREATE TABLE readability_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
  score_type TEXT NOT NULL CHECK (score_type IN ('flesch_reading_ease', 'flesch_kincaid_grade', 'automated_readability')),
  score_value DECIMAL NOT NULL,
  analysis_text_length INTEGER NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Tone feedback table
CREATE TABLE tone_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
  tone_detected TEXT NOT NULL CHECK (tone_detected IN ('formal', 'casual', 'confident', 'friendly', 'professional')),
  confidence DECIMAL NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  summary TEXT NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- User settings table
CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled_platforms TEXT[] DEFAULT ARRAY['web'],
  preferred_tone TEXT DEFAULT 'professional' CHECK (preferred_tone IN ('formal', 'casual', 'confident', 'friendly', 'professional')),
  goal TEXT DEFAULT 'general' CHECK (goal IN ('academic', 'business', 'creative', 'general')),
  real_time_enabled BOOLEAN DEFAULT TRUE,
  auto_save_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_updated_at ON documents(updated_at);
CREATE INDEX idx_suggestions_document_id ON suggestions(document_id);
CREATE INDEX idx_suggestions_accepted ON suggestions(accepted);
CREATE INDEX idx_readability_scores_document_id ON readability_scores(document_id);
CREATE INDEX idx_tone_feedback_document_id ON tone_feedback(document_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 