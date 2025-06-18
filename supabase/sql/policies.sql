-- Enable Row Level Security on all tables
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE readability_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE tone_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Documents policies
CREATE POLICY "Users can view their own documents" ON documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents" ON documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents" ON documents
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents" ON documents
  FOR DELETE USING (auth.uid() = user_id);

-- Suggestions policies
CREATE POLICY "Users can view suggestions for their documents" ON suggestions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM documents 
      WHERE documents.id = suggestions.document_id 
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert suggestions for their documents" ON suggestions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents 
      WHERE documents.id = suggestions.document_id 
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update suggestions for their documents" ON suggestions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM documents 
      WHERE documents.id = suggestions.document_id 
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete suggestions for their documents" ON suggestions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM documents 
      WHERE documents.id = suggestions.document_id 
      AND documents.user_id = auth.uid()
    )
  );

-- Readability scores policies
CREATE POLICY "Users can view readability scores for their documents" ON readability_scores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM documents 
      WHERE documents.id = readability_scores.document_id 
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert readability scores for their documents" ON readability_scores
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents 
      WHERE documents.id = readability_scores.document_id 
      AND documents.user_id = auth.uid()
    )
  );

-- Tone feedback policies
CREATE POLICY "Users can view tone feedback for their documents" ON tone_feedback
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM documents 
      WHERE documents.id = tone_feedback.document_id 
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert tone feedback for their documents" ON tone_feedback
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents 
      WHERE documents.id = tone_feedback.document_id 
      AND documents.user_id = auth.uid()
    )
  );

-- User settings policies
CREATE POLICY "Users can view their own settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings" ON user_settings
  FOR DELETE USING (auth.uid() = user_id); 