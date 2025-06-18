import React from 'react'
import type { Database } from '../lib/types'

type ReadabilityScore = Database['public']['Tables']['readability_scores']['Row']

interface ReadabilityCardProps {
  readabilityScores: ReadabilityScore[]
  loading?: boolean
  onAnalyze?: () => void
}

export default function ReadabilityCard({ readabilityScores, loading = false, onAnalyze }: ReadabilityCardProps) {
  const fleschEase = readabilityScores.find(s => s.score_type === 'flesch_reading_ease')
  const fleschGrade = readabilityScores.find(s => s.score_type === 'flesch_kincaid_grade')
  const autoReadability = readabilityScores.find(s => s.score_type === 'automated_readability')

  const getReadabilityLevel = (score: number) => {
    if (score >= 90) return { level: 'Very Easy', color: 'text-green-600', grade: '5th grade' }
    if (score >= 80) return { level: 'Easy', color: 'text-green-500', grade: '6th grade' }
    if (score >= 70) return { level: 'Fairly Easy', color: 'text-yellow-500', grade: '7th grade' }
    if (score >= 60) return { level: 'Standard', color: 'text-yellow-600', grade: '8th-9th grade' }
    if (score >= 50) return { level: 'Fairly Difficult', color: 'text-orange-500', grade: '10th-12th grade' }
    if (score >= 30) return { level: 'Difficult', color: 'text-red-500', grade: 'College level' }
    return { level: 'Very Difficult', color: 'text-red-600', grade: 'Graduate level' }
  }

  const getScoreColor = (score: number, maxScore: number = 100) => {
    const percentage = (score / maxScore) * 100
    if (percentage >= 70) return 'bg-green-500'
    if (percentage >= 50) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  // Convert grade level to intuitive display
  const formatGradeLevel = (gradeValue: number) => {
    const rounded = Math.round(gradeValue)
    if (rounded <= 5) return `${rounded}th grade (Elementary)`
    if (rounded <= 8) return `${rounded}th grade (Middle School)`
    if (rounded <= 12) return `${rounded}th grade (High School)`
    if (rounded <= 16) return `College level (${rounded}th grade equivalent)`
    return `Graduate level (${rounded}th grade equivalent)`
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Readability Analysis</h3>
        {onAnalyze && (
          <button
            onClick={onAnalyze}
            disabled={loading}
            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Analyzing...' : 'Analyze Readability'}
          </button>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-green-600"></div>
          <span className="ml-2 text-gray-600">Calculating readability...</span>
        </div>
      )}

      {!loading && readabilityScores.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📊</div>
          <p>Click "Analyze Readability" to check how easy your text is to read</p>
        </div>
      )}

      {!loading && readabilityScores.length > 0 && fleschEase && (
        <div className="space-y-4">
          {/* Main readability score - Use most intuitive metric */}
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {fleschEase.score_value}/100
            </div>
            <div className={`text-lg font-medium ${getReadabilityLevel(fleschEase.score_value).color}`}>
              {getReadabilityLevel(fleschEase.score_value).level}
            </div>
            <div className="text-sm text-gray-500">
              {getReadabilityLevel(fleschEase.score_value).grade}
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${getScoreColor(fleschEase.score_value)}`}
              style={{ width: `${Math.max(5, fleschEase.score_value)}%` }}
            />
          </div>

          {/* FIXED: More intuitive detailed scores */}
          <div className="grid grid-cols-1 gap-3">
            {fleschGrade && (
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-gray-900">Reading Level</div>
                  <div className="text-xs text-gray-500">Flesch-Kincaid Method</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">
                    {formatGradeLevel(fleschGrade.score_value)}
                  </div>
                </div>
              </div>
            )}

            {autoReadability && (
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-gray-900">Reading Level</div>
                  <div className="text-xs text-gray-500">Automated Readability Index</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">
                    {formatGradeLevel(autoReadability.score_value)}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Summary explanation */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-1">
              <strong>Understanding the scores:</strong>
            </div>
            <div className="text-xs text-gray-600">
              These metrics estimate the education level needed to easily understand your text. 
              {fleschGrade && ` Most methods suggest around ${Math.round(fleschGrade.score_value)}th grade level.`}
            </div>
          </div>

          {/* Text statistics */}
          <div className="border-t border-gray-100 pt-4">
            <div className="text-xs text-gray-500 text-center">
              Analysis based on {Math.round(fleschEase.analysis_text_length / 5)} words
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">💡 Recommendations</h4>
            <div className="text-sm text-blue-800">
              {fleschEase.score_value < 60 
                ? "Try using shorter sentences and simpler words to improve readability."
                : fleschEase.score_value > 80
                ? "Great! Your writing is very accessible to most readers."
                : "Good readability level for general audiences."
              }
            </div>
          </div>

          {/* Timestamp */}
          <div className="text-xs text-gray-400 text-center">
            Analyzed {new Date(readabilityScores[0].generated_at).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  )
} 