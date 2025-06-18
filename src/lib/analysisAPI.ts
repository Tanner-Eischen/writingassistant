import { supabase } from './supabase'
import type { Database } from './types'

type ToneFeedback = Database['public']['Tables']['tone_feedback']['Row']
type ReadabilityScore = Database['public']['Tables']['readability_scores']['Row']

export class AnalysisAPI {
  // Tone Analysis
  static async analyzeTone(text: string, documentId: string): Promise<ToneFeedback> {
    console.log('🎯 Calling analyze-tone Edge Function...')
    
    const { data, error } = await supabase.functions.invoke('analyze-tone', {
      body: { text, documentId }
    })

    if (error) {
      console.error('Tone analysis error:', error)
      throw new Error(`Tone analysis failed: ${error.message}`)
    }

    console.log('✅ Tone analysis response:', data)
    return data.tone_analysis
  }

  // Readability Analysis
  static async analyzeReadability(text: string, documentId: string): Promise<{
    readability_scores: ReadabilityScore[]
    summary: string
  }> {
    console.log('📊 Calling analyze-readability Edge Function...')
    
    const { data, error } = await supabase.functions.invoke('analyze-readability', {
      body: { text, documentId }
    })

    if (error) {
      console.error('Readability analysis error:', error)
      throw new Error(`Readability analysis failed: ${error.message}`)
    }

    console.log('✅ Readability analysis response:', data)
    return data
  }
} 