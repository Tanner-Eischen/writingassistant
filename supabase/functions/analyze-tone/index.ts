// @ts-ignore
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

interface ToneAnalysisResponse {
  id: string
  document_id: string
  tone_detected: 'formal' | 'casual' | 'confident' | 'friendly' | 'professional'
  confidence: number
  summary: string
  generated_at: string
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

    if (text.length < 20) {
      return new Response(JSON.stringify({ error: 'Text too short for tone analysis (min 20 characters)' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Analyze tone using rule-based approach
    const toneAnalysis = analyzeTone(text, documentId);

    return new Response(JSON.stringify({ tone_analysis: toneAnalysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Tone analysis error:', error);
    return new Response(JSON.stringify({ error: 'Tone analysis failed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

function analyzeTone(text: string, documentId: string): ToneAnalysisResponse {
  const lowerText = text.toLowerCase();
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/);
  
  // Tone indicators
  const formalIndicators = [
    'therefore', 'furthermore', 'consequently', 'nevertheless', 'moreover',
    'however', 'thus', 'hence', 'indeed', 'whereas', 'notwithstanding',
    'accordingly', 'subsequently', 'nonetheless', 'henceforth'
  ];
  
  const casualIndicators = [
    'yeah', 'okay', 'cool', 'awesome', 'totally', 'basically', 'actually',
    'like', 'you know', 'kinda', 'sorta', 'gonna', 'wanna', 'gotta'
  ];
  
  const confidentIndicators = [
    'definitely', 'certainly', 'absolutely', 'clearly', 'obviously',
    'undoubtedly', 'surely', 'precisely', 'exactly', 'guaranteed',
    'proven', 'established', 'confident', 'assured', 'decisive'
  ];
  
  const friendlyIndicators = [
    'thanks', 'please', 'welcome', 'appreciate', 'wonderful', 'great',
    'excellent', 'amazing', 'fantastic', 'love', 'enjoy', 'happy',
    'excited', 'delighted', 'pleased'
  ];
  
  const professionalIndicators = [
    'regarding', 'concerning', 'pursuant', 'objective', 'analysis',
    'implementation', 'strategy', 'optimize', 'leverage', 'facilitate',
    'comprehensive', 'systematic', 'methodology', 'framework', 'initiative'
  ];
  
  // Calculate scores
  const formalScore = countMatches(lowerText, formalIndicators) + 
                    (hasComplexSentences(sentences) ? 20 : 0) +
                    (hasPassiveVoice(lowerText) ? 15 : 0);
  
  const casualScore = countMatches(lowerText, casualIndicators) +
                     (hasContractions(text) ? 15 : 0) +
                     (hasShortSentences(sentences) ? 10 : 0);
  
  const confidentScore = countMatches(lowerText, confidentIndicators) +
                        (hasDeclarativeStatements(sentences) ? 15 : 0);
  
  const friendlyScore = countMatches(lowerText, friendlyIndicators) +
                       (hasExclamations(text) ? 10 : 0) +
                       (hasQuestions(text) ? 5 : 0);
  
  const professionalScore = countMatches(lowerText, professionalIndicators) +
                           (hasBusinessTerms(lowerText) ? 15 : 0);
  
  // Determine dominant tone
  const scores = {
    formal: formalScore,
    casual: casualScore,
    confident: confidentScore,
    friendly: friendlyScore,
    professional: professionalScore
  };
  
  const maxScore = Math.max(...Object.values(scores));
  const dominantTone = Object.entries(scores).find(([_, score]) => score === maxScore)?.[0] as any;
  
  // Calculate confidence (0-100)
  const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
  const confidence = totalScore > 0 ? Math.min(100, Math.round((maxScore / totalScore) * 100)) : 50;
  
  // Generate summary
  const summary = generateToneSummary(dominantTone, confidence, scores, text.length);
  
  return {
    id: `tone-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    document_id: documentId,
    tone_detected: dominantTone || 'professional',
    confidence: confidence,
    summary: summary,
    generated_at: new Date().toISOString()
  };
}

function countMatches(text: string, indicators: string[]): number {
  return indicators.reduce((count, indicator) => {
    const regex = new RegExp(`\\b${indicator}\\b`, 'gi');
    const matches = text.match(regex);
    return count + (matches ? matches.length * 5 : 0);
  }, 0);
}

function hasComplexSentences(sentences: string[]): boolean {
  return sentences.some(s => s.split(',').length > 3);
}

function hasPassiveVoice(text: string): boolean {
  return /\b(was|were|is|are|been|being)\s+\w+ed\b/gi.test(text);
}

function hasContractions(text: string): boolean {
  return /\b\w+[''](?:t|re|ve|ll|d)\b/gi.test(text);
}

function hasShortSentences(sentences: string[]): boolean {
  const avgLength = sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences.length;
  return avgLength < 12;
}

function hasDeclarativeStatements(sentences: string[]): boolean {
  return sentences.filter(s => !s.includes('?') && !s.includes('!')).length > sentences.length * 0.7;
}

function hasExclamations(text: string): boolean {
  return (text.match(/!/g) || []).length > 0;
}

function hasQuestions(text: string): boolean {
  return (text.match(/\?/g) || []).length > 0;
}

function hasBusinessTerms(text: string): boolean {
  const businessTerms = ['roi', 'kpi', 'synergy', 'stakeholder', 'deliverable', 'milestone'];
  return businessTerms.some(term => text.includes(term));
}

function generateToneSummary(tone: string, confidence: number, scores: any, textLength: number): string {
  const wordCount = Math.round(textLength / 5); // Rough word estimate
  
  let summary = `Your writing has a ${tone} tone`;
  
  if (confidence > 80) {
    summary += ` with high confidence (${confidence}%). `;
  } else if (confidence > 60) {
    summary += ` with moderate confidence (${confidence}%). `;
  } else {
    summary += ` with lower confidence (${confidence}%). `;
  }
  
  // Add specific insights
  switch (tone) {
    case 'formal':
      summary += "Your text uses sophisticated vocabulary and complex sentence structures. ";
      break;
    case 'casual':
      summary += "Your writing feels conversational and relaxed with informal expressions. ";
      break;
    case 'confident':
      summary += "Your writing conveys certainty and decisiveness in your statements. ";
      break;
    case 'friendly':
      summary += "Your text has a warm, approachable tone with positive language. ";
      break;
    case 'professional':
      summary += "Your writing maintains a business-appropriate, objective tone. ";
      break;
  }
  
  summary += `Analysis based on ${wordCount} words.`;
  
  return summary;
} 