import type { Suggestion } from './types'

interface LanguageToolMatch {
  message: string
  shortMessage: string
  offset: number
  length: number
  replacements: Array<{ value: string }>
  rule: {
    id: string
    description: string
    issueType: string
    category: {
      id: string
      name: string
    }
  }
  context: {
    text: string
    offset: number
    length: number
  }
}

interface LanguageToolResponse {
  matches: LanguageToolMatch[]
}

export class LanguageToolAPI {
  private static readonly BASE_URL = 'https://api.languagetool.org/v2'
  
  static async checkText(text: string, documentId: string): Promise<Suggestion[]> {
    if (!text.trim()) return []
    
    try {
      // Use URLSearchParams instead of FormData for better compatibility
      const params = new URLSearchParams()
      params.append('text', text)
      params.append('language', 'en-US')
      
      const response = await fetch(`${this.BASE_URL}/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      })
      
      if (!response.ok) {
        console.error('LanguageTool API response:', await response.text())
        throw new Error(`LanguageTool API error: ${response.status}`)
      }
      
      const data: LanguageToolResponse = await response.json()
      console.log('LanguageTool response:', data) // Debug log
      
      return this.convertToSuggestions(data.matches, documentId, text)
    } catch (error) {
      console.error('Error checking text with LanguageTool:', error)
      return []
    }
  }
  
  private static convertToSuggestions(matches: LanguageToolMatch[], documentId: string, text: string): Suggestion[] {
    return matches.map((match, index) => {
      // Determine issue type based on LanguageTool categories
      let issueType: 'grammar' | 'spelling' | 'style' | 'clarity' = 'grammar'
      
      const categoryId = match.rule.category.id.toLowerCase()
      const ruleId = match.rule.id.toLowerCase()
      
      if (categoryId.includes('typo') || ruleId.includes('spell')) {
        issueType = 'spelling'
      } else if (categoryId.includes('style') || categoryId.includes('redundancy')) {
        issueType = 'style'
      } else if (categoryId.includes('clarity') || categoryId.includes('confused')) {
        issueType = 'clarity'
      }
      
      // Get the best replacement suggestion
      const suggestedText = match.replacements.length > 0 
        ? match.replacements[0].value 
        : match.context.text.substring(match.context.offset, match.context.offset + match.context.length)
      
      return {
        id: `lt-${index}-${match.offset}`,
        document_id: documentId,
        start_index: match.offset,
        end_index: match.offset + match.length,
        issue_type: issueType,
        original_text: text.substring(match.offset, match.offset + match.length),
        suggested_text: suggestedText,
        explanation: match.message,
        accepted: false,
        created_at: new Date().toISOString()
      }
    })
  }
} 