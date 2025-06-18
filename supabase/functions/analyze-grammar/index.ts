// @ts-ignore
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

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

interface SuggestionResponse {
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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders,
    });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405,
      });
    }

    const { text, documentId } = await req.json();

    // Validate input
    if (!text || !documentId) {
      return new Response(JSON.stringify({ error: 'Text and documentId are required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    if (text.length > 50000) {
      return new Response(JSON.stringify({ error: 'Text too long (max 50,000 characters)' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Call LanguageTool API server-side
    const params = new URLSearchParams();
    params.append('text', text);
    params.append('language', 'en-US');
    
    const languageToolResponse = await fetch('https://api.languagetool.org/v2/check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!languageToolResponse.ok) {
      console.error('LanguageTool API error:', languageToolResponse.status);
      // Return basic suggestions as fallback
      const basicSuggestions = generateBasicSuggestions(text, documentId);
      return new Response(JSON.stringify({ suggestions: basicSuggestions }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const data: LanguageToolResponse = await languageToolResponse.json();
    
    // Convert LanguageTool matches to our suggestion format
    const suggestions: SuggestionResponse[] = data.matches.map((match, index) => {
      // Determine issue type based on LanguageTool categories
      let issueType: 'grammar' | 'spelling' | 'style' | 'clarity' = 'grammar';
      
      const categoryId = match.rule.category.id.toLowerCase();
      const ruleId = match.rule.id.toLowerCase();
      
      if (categoryId.includes('typo') || ruleId.includes('spell')) {
        issueType = 'spelling';
      } else if (categoryId.includes('style') || categoryId.includes('redundancy')) {
        issueType = 'style';
      } else if (categoryId.includes('clarity') || categoryId.includes('confused')) {
        issueType = 'clarity';
      }
      
      // Get the best replacement suggestion
      const suggestedText = match.replacements.length > 0 
        ? match.replacements[0].value 
        : text.substring(match.offset, match.offset + match.length);
      
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
      };
    });

    // Add basic spell checking for common words
    const basicSuggestions = generateBasicSuggestions(text, documentId);
    const allSuggestions = [...suggestions, ...basicSuggestions];
    
    // Remove duplicates based on position
    const uniqueSuggestions = allSuggestions.filter((suggestion, index, self) => 
      index === self.findIndex(s => s.start_index === suggestion.start_index && s.end_index === suggestion.end_index)
    );

    return new Response(JSON.stringify({ suggestions: uniqueSuggestions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Grammar analysis error:', error);
    return new Response(JSON.stringify({ error: 'Grammar analysis failed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

// Fallback basic spell checking
function generateBasicSuggestions(text: string, documentId: string): SuggestionResponse[] {
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
  };
  
  const suggestions: SuggestionResponse[] = [];
  const words = text.split(/\s+/);
  let currentIndex = 0;

  words.forEach((word, wordIndex) => {
    const cleanWord = word.toLowerCase().replace(/[.,!?;:"']/g, '');
    
    if (commonMisspellings[cleanWord]) {
      const wordStart = text.indexOf(word, currentIndex);
      const wordEnd = wordStart + word.length;
      
      suggestions.push({
        id: `basic-spell-${wordIndex}-${wordStart}`,
        document_id: documentId,
        start_index: wordStart,
        end_index: wordEnd,
        issue_type: 'spelling',
        original_text: word,
        suggested_text: word.replace(cleanWord, commonMisspellings[cleanWord]),
        explanation: `Spelling: "${word}" should be "${commonMisspellings[cleanWord]}"`,
        accepted: false,
        created_at: new Date().toISOString()
      });
    }
    
    currentIndex = text.indexOf(word, currentIndex) + word.length;
  });

  return suggestions;
} 