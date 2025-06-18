// @ts-ignore
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

interface ReadabilityScore {
  id: string
  document_id: string
  score_type: 'flesch_reading_ease' | 'flesch_kincaid_grade' | 'automated_readability'
  score_value: number
  analysis_text_length: number
  generated_at: string
}

interface ReadabilityAnalysisResponse {
  readability_scores: ReadabilityScore[]
  summary: string
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

    if (text.length < 50) {
      return new Response(JSON.stringify({ error: 'Text too short for readability analysis (min 50 characters)' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Calculate readability scores
    const readabilityAnalysis = calculateReadabilityScores(text, documentId);

    return new Response(JSON.stringify(readabilityAnalysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Readability analysis error:', error);
    return new Response(JSON.stringify({ error: 'Readability analysis failed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

function calculateReadabilityScores(text: string, documentId: string): ReadabilityAnalysisResponse {
  // Text metrics
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const syllables = countSyllables(text);
  
  const sentenceCount = sentences.length;
  const wordCount = words.length;
  const syllableCount = syllables;
  
  if (sentenceCount === 0 || wordCount === 0) {
    throw new Error('Invalid text structure for readability analysis');
  }
  
  // Average sentence length and syllables per word
  const avgSentenceLength = wordCount / sentenceCount;
  const avgSyllablesPerWord = syllableCount / wordCount;
  
  // Flesch Reading Ease Score (0-100, higher = easier)
  const fleschReadingEase = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
  
  // Flesch-Kincaid Grade Level
  const fleschKincaidGrade = (0.39 * avgSentenceLength) + (11.8 * avgSyllablesPerWord) - 15.59;
  
  // Automated Readability Index
  const charactersPerWord = text.replace(/\s+/g, '').length / wordCount;
  const automatedReadability = (4.71 * charactersPerWord) + (0.5 * avgSentenceLength) - 21.43;
  
  // Create score objects
  const scores: ReadabilityScore[] = [
    {
      id: `flesch-ease-${Date.now()}`,
      document_id: documentId,
      score_type: 'flesch_reading_ease',
      score_value: Math.round(Math.max(0, Math.min(100, fleschReadingEase)) * 10) / 10,
      analysis_text_length: text.length,
      generated_at: new Date().toISOString()
    },
    {
      id: `flesch-grade-${Date.now()}`,
      document_id: documentId,
      score_type: 'flesch_kincaid_grade',
      score_value: Math.round(Math.max(0, fleschKincaidGrade) * 10) / 10,
      analysis_text_length: text.length,
      generated_at: new Date().toISOString()
    },
    {
      id: `auto-read-${Date.now()}`,
      document_id: documentId,
      score_type: 'automated_readability',
      score_value: Math.round(Math.max(0, automatedReadability) * 10) / 10,
      analysis_text_length: text.length,
      generated_at: new Date().toISOString()
    }
  ];
  
  // Generate summary
  const summary = generateReadabilitySummary(scores, wordCount, sentenceCount);
  
  return {
    readability_scores: scores,
    summary: summary
  };
}

function countSyllables(text: string): number {
  const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  
  return words.reduce((total, word) => {
    // Remove punctuation
    const cleanWord = word.replace(/[^a-z]/g, '');
    if (cleanWord.length === 0) return total;
    
    // Count vowel groups
    let syllableCount = 0;
    let previousWasVowel = false;
    
    for (let i = 0; i < cleanWord.length; i++) {
      const isVowel = 'aeiouy'.includes(cleanWord[i]);
      
      if (isVowel && !previousWasVowel) {
        syllableCount++;
      }
      
      previousWasVowel = isVowel;
    }
    
    // Handle silent 'e'
    if (cleanWord.endsWith('e') && syllableCount > 1) {
      syllableCount--;
    }
    
    // Every word has at least one syllable
    return total + Math.max(1, syllableCount);
  }, 0);
}

function generateReadabilitySummary(scores: ReadabilityScore[], wordCount: number, sentenceCount: number): string {
  const fleschEase = scores.find(s => s.score_type === 'flesch_reading_ease')?.score_value || 0;
  const fleschGrade = scores.find(s => s.score_type === 'flesch_kincaid_grade')?.score_value || 0;
  
  let summary = `Your text has ${wordCount} words in ${sentenceCount} sentences. `;
  
  // Flesch Reading Ease interpretation
  if (fleschEase >= 90) {
    summary += "Very easy to read (5th grade level). ";
  } else if (fleschEase >= 80) {
    summary += "Easy to read (6th grade level). ";
  } else if (fleschEase >= 70) {
    summary += "Fairly easy to read (7th grade level). ";
  } else if (fleschEase >= 60) {
    summary += "Standard reading level (8th-9th grade). ";
  } else if (fleschEase >= 50) {
    summary += "Fairly difficult to read (10th-12th grade). ";
  } else if (fleschEase >= 30) {
    summary += "Difficult to read (college level). ";
  } else {
    summary += "Very difficult to read (graduate level). ";
  }
  
  summary += `Reading ease score: ${fleschEase}/100. `;
  summary += `Grade level: ${Math.round(fleschGrade)}. `;
  
  // Recommendations
  if (fleschEase < 60) {
    summary += "Consider using shorter sentences and simpler words to improve readability.";
  } else if (fleschEase > 80) {
    summary += "Your writing is very accessible to most readers.";
  } else {
    summary += "Your writing has good readability for general audiences.";
  }
  
  return summary;
} 