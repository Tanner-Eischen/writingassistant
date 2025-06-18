import type { Suggestion } from './types'
import { supabase } from './supabase'

// Simple grammar rules
const grammarRules = [
  {
    pattern: /\bi\s+am\s+going\s+to\s+went/gi,
    suggestion: 'I am going to go',
    explanation: 'Incorrect verb tense'
  },
  {
    pattern: /\byour\s+welcome\b/gi,
    suggestion: "you're welcome",
    explanation: "Use 'you're' (contraction) not 'your' (possessive)"
  },
  {
    pattern: /\bits\s+raining\b/gi,
    suggestion: "it's raining",
    explanation: "Use 'it's' (it is) not 'its' (possessive)"
  }
]

export class SuggestionEngine {
  private static debounceTimeout: NodeJS.Timeout | null = null
  
  // Debounced version for real-time checking
  static async analyzeTextDebounced(
    content: string, 
    documentId: string, 
    callback: (suggestions: Suggestion[]) => void,
    delay: number = 1500
  ): Promise<void> {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout)
    }
    
    this.debounceTimeout = setTimeout(async () => {
      try {
        // Try Edge Function first, fallback to basic if it fails
        let suggestions: Suggestion[] = []
        
        try {
          suggestions = await this.analyzeTextWithEdgeFunction(content, documentId)
          console.log('✅ Edge Function succeeded:', suggestions.length, 'suggestions')
        } catch (edgeFunctionError) {
          console.log('⚠️ Edge Function failed, using fallback:', edgeFunctionError)
          suggestions = this.basicSpellCheck(content, documentId)
        }
        
        callback(suggestions)
      } catch (error) {
        console.error('Error in suggestion analysis:', error)
        // Final fallback to basic spell check
        const basicSuggestions = this.basicSpellCheck(content, documentId)
        callback(basicSuggestions)
      }
    }, delay)
  }
  
  // Edge Function implementation
  private static async analyzeTextWithEdgeFunction(content: string, documentId: string): Promise<Suggestion[]> {
    if (!content.trim() || content.length < 5) {
      return []
    }
    
    // CRITICAL: Normalize content before sending to Edge Function
    const normalizedContent = content
      .replace(/\r\n/g, '\n')  // Normalize line endings
      .replace(/\r/g, '\n')     // Handle Mac line endings  
      .normalize('NFC')         // Unicode normalization
    
    console.log('🚀 Calling analyze-grammar Edge Function...')
    
    const { data, error } = await supabase.functions.invoke('analyze-grammar', {
      body: { text: normalizedContent, documentId }
    })
    
    if (error) {
      console.error('❌ Edge Function error:', error)
      throw error
    }
    
    console.log('✅ Edge Function response:', data)
    return data.suggestions || []
  }
  
  // Keep existing analyzeText for backward compatibility
  static async analyzeText(content: string, documentId: string): Promise<Suggestion[]> {
    return this.basicSpellCheck(content, documentId)
  }
  
  // Enhanced basic spell check with precise word boundaries
  private static basicSpellCheck(content: string, documentId: string): Suggestion[] {
    console.log('📝 Using basic spell check fallback')
    
    // CRITICAL: Normalize content to match SuggestionMarker normalization
    const normalizedContent = content
      .replace(/\r\n/g, '\n')  // Normalize line endings (Windows → Unix)
      .replace(/\r/g, '\n')     // Handle Mac line endings
      .normalize('NFC')         // Unicode normalization
    
    const commonMisspellings: Record<string, string> = {
      'teh': 'the',
      'adn': 'and',  
      'recieve': 'receive',
      'seperate': 'separate',
      'occured': 'occurred',
      'definately': 'definitely',
      'neccessary': 'necessary',
      'begining': 'beginning',
      'accomodate': 'accommodate',
      'enviroment': 'environment',
      'tommorow': 'tomorrow',
      'wierd': 'weird',
      'freind': 'friend'
    }
    
    const suggestions: Suggestion[] = []
    
    // Use regex to find exact word boundaries (no whitespace)
    const wordPattern = /\b\w+\b/g
    let match
    
    while ((match = wordPattern.exec(normalizedContent)) !== null) {
      const word = match[0]
      const wordStart = match.index
      const wordEnd = wordStart + word.length
      
      const cleanWord = word.toLowerCase().replace(/[.,!?;:"']/g, '')
      
      if (commonMisspellings[cleanWord]) {
        // Create corrected version maintaining original case and punctuation
        const correctedWord = word.replace(
          new RegExp(cleanWord, 'gi'), 
          commonMisspellings[cleanWord]
        )
        
        suggestions.push({
          id: `spell-${wordStart}-${Date.now()}`,
          document_id: documentId,  
          start_index: wordStart,
          end_index: wordEnd,
          issue_type: 'spelling',
          original_text: word,
          suggested_text: correctedWord,
          explanation: `Spelling: "${word}" should be "${correctedWord}"`,
          accepted: false,
          created_at: new Date().toISOString()
        })
      }
    }

    console.log('📝 Basic spell check found:', suggestions.length, 'suggestions')
    return suggestions
  }
} 