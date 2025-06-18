// Database type definitions based on your schema
export interface Database {
  public: {
    Tables: {
      documents: {
        Row: {
          id: string
          user_id: string
          title: string
          content: string
          status: 'draft' | 'active' | 'archived'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          content?: string
          status?: 'draft' | 'active' | 'archived'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          content?: string
          status?: 'draft' | 'active' | 'archived'
          updated_at?: string
        }
      }
      suggestions: {
        Row: {
          id: string
          document_id: string
          start_index: number
          end_index: number
          issue_type: 'grammar' | 'spelling' | 'style' | 'clarity'
          original_text: string
          suggested_text: string
          explanation: string
          accepted: boolean
          created_at: string
        }
        Insert: {
          id?: string
          document_id: string
          start_index: number
          end_index: number
          issue_type: 'grammar' | 'spelling' | 'style' | 'clarity'
          original_text: string
          suggested_text: string
          explanation: string
          accepted?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          start_index?: number
          end_index?: number
          issue_type?: 'grammar' | 'spelling' | 'style' | 'clarity'
          original_text?: string
          suggested_text?: string
          explanation?: string
          accepted?: boolean
        }
      }
      readability_scores: {
        Row: {
          id: string
          document_id: string
          score_type: 'flesch_reading_ease' | 'flesch_kincaid_grade' | 'automated_readability'
          score_value: number
          analysis_text_length: number
          generated_at: string
        }
        Insert: {
          id?: string
          document_id: string
          score_type: 'flesch_reading_ease' | 'flesch_kincaid_grade' | 'automated_readability'
          score_value: number
          analysis_text_length: number
          generated_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          score_type?: 'flesch_reading_ease' | 'flesch_kincaid_grade' | 'automated_readability'
          score_value?: number
          analysis_text_length?: number
        }
      }
      tone_feedback: {
        Row: {
          id: string
          document_id: string
          tone_detected: 'formal' | 'casual' | 'confident' | 'friendly' | 'professional'
          confidence: number
          summary: string
          generated_at: string
        }
        Insert: {
          id?: string
          document_id: string
          tone_detected: 'formal' | 'casual' | 'confident' | 'friendly' | 'professional'
          confidence: number
          summary: string
          generated_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          tone_detected?: 'formal' | 'casual' | 'confident' | 'friendly' | 'professional'
          confidence?: number
          summary?: string
        }
      }
      user_settings: {
        Row: {
          user_id: string
          enabled_platforms: string[]
          preferred_tone: 'formal' | 'casual' | 'confident' | 'friendly' | 'professional'
          goal: 'academic' | 'business' | 'creative' | 'general'
          real_time_enabled: boolean
          auto_save_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          enabled_platforms?: string[]
          preferred_tone?: 'formal' | 'casual' | 'confident' | 'friendly' | 'professional'
          goal?: 'academic' | 'business' | 'creative' | 'general'
          real_time_enabled?: boolean
          auto_save_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          enabled_platforms?: string[]
          preferred_tone?: 'formal' | 'casual' | 'confident' | 'friendly' | 'professional'
          goal?: 'academic' | 'business' | 'creative' | 'general'
          real_time_enabled?: boolean
          auto_save_enabled?: boolean
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Additional types for the application
export type DocumentStatus = 'draft' | 'active' | 'archived'
export type IssueType = 'grammar' | 'spelling' | 'style' | 'clarity'
export type ToneType = 'formal' | 'casual' | 'confident' | 'friendly' | 'professional'
export type GoalType = 'academic' | 'business' | 'creative' | 'general'
export type ScoreType = 'flesch_reading_ease' | 'flesch_kincaid_grade' | 'automated_readability'

export interface User {
  id: string
  email?: string
  created_at: string
}

export interface Document {
  id: string
  user_id: string
  title: string
  content: string
  status: DocumentStatus
  created_at: string
  updated_at: string
}

export interface Suggestion {
  id: string
  document_id: string
  start_index: number
  end_index: number
  issue_type: IssueType
  original_text: string
  suggested_text: string
  explanation: string
  accepted: boolean
  created_at: string
} 