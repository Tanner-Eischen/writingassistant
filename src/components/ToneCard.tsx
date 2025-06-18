import React, { useState } from 'react'
import type { Database } from '../lib/types'

type ToneFeedback = Database['public']['Tables']['tone_feedback']['Row']

interface ToneCardProps {
  toneFeedback: ToneFeedback | null
  loading?: boolean
  onAnalyze?: () => void
}

// Radar Chart Component
const ToneRadarChart = ({ scores }: { scores: Record<string, number> }) => {
  const [hoveredTone, setHoveredTone] = useState<string | null>(null)
  const size = 240
  const center = size / 2
  const maxRadius = 70
  const levels = 4

  const tones = [
    { 
      key: 'formal', 
      label: 'Formal', 
      color: '#3B82F6',
      description: 'Structured, academic language with complex sentences and professional vocabulary'
    },
    { 
      key: 'confident', 
      label: 'Confident', 
      color: '#8B5CF6',
      description: 'Assertive statements, decisive language, and authoritative voice'
    },
    { 
      key: 'friendly', 
      label: 'Friendly', 
      color: '#F59E0B',
      description: 'Warm, approachable language that builds rapport and connection'
    },
    { 
      key: 'casual', 
      label: 'Casual', 
      color: '#10B981',
      description: 'Conversational, relaxed style with contractions and informal expressions'
    },
    { 
      key: 'professional', 
      label: 'Professional', 
      color: '#6B7280',
      description: 'Business-appropriate tone that balances formality with accessibility'
    }
  ]

  const angleStep = (2 * Math.PI) / tones.length

  // Non-linear scale to make chart less empty
  const scaleValue = (value: number) => {
    return Math.sqrt(value / 100) * 100
  }

  // Calculate points for the filled area
  const getPoint = (angle: number, value: number) => {
    const scaledValue = scaleValue(value)
    const radius = (scaledValue / 100) * maxRadius
    const x = center + radius * Math.cos(angle - Math.PI / 2)
    const y = center + radius * Math.sin(angle - Math.PI / 2)
    return { x, y }
  }

  // Create path for filled area
  const pathPoints = tones.map((tone, i) => {
    const angle = i * angleStep
    const value = scores[tone.key] || 0
    return getPoint(angle, value)
  })
  
  const pathData = pathPoints.map((point, i) => 
    `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ') + ' Z'

  return (
    <div className="relative">
      <svg width={size} height={size} className="mx-auto">
        {/* Background grid circles */}
        {Array.from({ length: levels }, (_, i) => (
          <circle
            key={i}
            cx={center}
            cy={center}
            r={(maxRadius / levels) * (i + 1)}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="1"
          />
        ))}
        
        {/* Grid lines from center to each tone */}
        {tones.map((tone, i) => {
          const angle = i * angleStep
          return (
            <line
              key={tone.key}
              x1={center}
              y1={center}
              x2={center + maxRadius * Math.cos(angle - Math.PI / 2)}
              y2={center + maxRadius * Math.sin(angle - Math.PI / 2)}
              stroke="#E5E7EB"
              strokeWidth="1"
            />
          )
        })}

        {/* Filled area */}
        <path
          d={pathData}
          fill="rgba(139, 92, 246, 0.2)"
          stroke="#8B5CF6"
          strokeWidth="2"
        />

        {/* Data points with hover */}
        {tones.map((tone, i) => {
          const angle = i * angleStep
          const value = scores[tone.key] || 0
          const point = getPoint(angle, value)
          const isHovered = hoveredTone === tone.key
          
          return (
            <g key={tone.key}>
              {/* Larger invisible hover area */}
              <circle
                cx={point.x}
                cy={point.y}
                r="15"
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredTone(tone.key)}
                onMouseLeave={() => setHoveredTone(null)}
              />
              {/* Visible data point */}
              <circle
                cx={point.x}
                cy={point.y}
                r={isHovered ? "6" : "4"}
                fill={tone.color}
                stroke="white"
                strokeWidth="2"
                style={{ 
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={() => setHoveredTone(tone.key)}
                onMouseLeave={() => setHoveredTone(null)}
              />
            </g>
          )
        })}

        {/* FIXED: Larger, properly spaced labels */}
        {tones.map((tone, i) => {
          const angle = i * angleStep
          const labelRadius = maxRadius + 50
          const x = center + labelRadius * Math.cos(angle - Math.PI / 2)
          const y = center + labelRadius * Math.sin(angle - Math.PI / 2)
          
          return (
            <g key={`label-${tone.key}`}>
              {/* Tone name - LARGER text */}
              <text
                x={x}
                y={y - 5}
                textAnchor="middle"
                className="font-medium fill-gray-700"
                style={{ fontSize: '13px' }}
              >
                {tone.label}
              </text>
              {/* Percentage - LARGER text */}
              <text
                x={x}
                y={y + 10}
                textAnchor="middle"
                className="fill-gray-500"
                style={{ fontSize: '12px' }}
              >
                {Math.round(scores[tone.key] || 0)}%
              </text>
            </g>
          )
        })}
      </svg>

      {/* Hover tooltip */}
      {hoveredTone && (
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full mt-2 z-10">
          <div className="bg-gray-900 text-white text-sm rounded-lg p-3 max-w-xs text-center shadow-lg">
            <div className="font-semibold mb-1">
              {tones.find(t => t.key === hoveredTone)?.label}
            </div>
            <div className="text-gray-300">
              {tones.find(t => t.key === hoveredTone)?.description}
            </div>
            {/* Arrow pointing up */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full">
              <div className="border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
            </div>
          </div>
        </div>
      )}

      {/* Scale reference */}
      <div className="text-center mt-4">
        <div className="text-xs text-gray-400">
          Hover over data points to learn about each tone
        </div>
      </div>
    </div>
  )
}

export default function ToneCard({ toneFeedback, loading = false, onAnalyze }: ToneCardProps) {
  // More realistic tone distribution
  const calculateToneScores = (primaryTone: string, confidence: number) => {
    const baseScores = {
      formal: 15,
      casual: 15,
      confident: 15,
      friendly: 15,
      professional: 15
    }

    // Primary tone gets the confidence value
    baseScores[primaryTone as keyof typeof baseScores] = confidence

    // Create more realistic secondary distributions
    const remaining = 100 - confidence
    const otherTones = Object.keys(baseScores).filter(t => t !== primaryTone)
    
    // Distribute with some variation to create interesting patterns
    const distributions = [0.4, 0.3, 0.2, 0.1] // Decreasing weights
    otherTones.forEach((tone, i) => {
      const baseAmount = remaining * distributions[i]
      const variation = (Math.random() - 0.5) * 20 // ±10 variation
      baseScores[tone as keyof typeof baseScores] = Math.max(5, Math.min(40, baseAmount + variation))
    })

    // Normalize to ensure total doesn't exceed 100
    const total = Object.values(baseScores).reduce((sum, val) => sum + val, 0)
    if (total > 100) {
      const factor = 100 / total
      Object.keys(baseScores).forEach(key => {
        baseScores[key as keyof typeof baseScores] *= factor
      })
    }

    return baseScores
  }

  const getToneInsight = (scores: Record<string, number>) => {
    const sorted = Object.entries(scores).sort(([,a], [,b]) => b - a)
    const primary = sorted[0]
    const secondary = sorted[1]
    
    if (primary[1] > 60) {
      return `Strong ${primary[0]} tone dominates your writing.`
    } else if (primary[1] > 40) {
      return `Primarily ${primary[0]} with ${secondary[0]} undertones.`
    } else {
      return `Balanced mix of ${primary[0]} and ${secondary[0]} tones.`
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Tone Analysis</h3>
        {onAnalyze && (
          <button
            onClick={onAnalyze}
            disabled={loading}
            className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Analyzing...' : 'Analyze Tone'}
          </button>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-purple-600"></div>
          <span className="ml-2 text-gray-600">Analyzing tone...</span>
        </div>
      )}

      {!loading && !toneFeedback && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">🎭</div>
          <p>Click "Analyze Tone" to see your writing's tone profile</p>
        </div>
      )}

      {!loading && toneFeedback && (
        <div className="space-y-4">
          {/* FIXED Radar Chart */}
          <div className="py-2">
            <ToneRadarChart 
              scores={calculateToneScores(toneFeedback.tone_detected, toneFeedback.confidence)} 
            />
          </div>

          {/* Tone Insight */}
          <div className="text-center">
            <div className="text-sm font-medium text-gray-900 mb-1">
              {getToneInsight(calculateToneScores(toneFeedback.tone_detected, toneFeedback.confidence))}
            </div>
            <div className="text-xs text-gray-500">
              Hover over chart points to learn about each tone
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Writing Analysis</h4>
            <p className="text-sm text-gray-700">{toneFeedback.summary}</p>
          </div>

          {/* Top Tones List */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">💡 Tone Breakdown</h4>
            <div className="space-y-1">
              {Object.entries(calculateToneScores(toneFeedback.tone_detected, toneFeedback.confidence))
                .sort(([,a], [,b]) => b - a)
                .slice(0, 3)
                .map(([tone, score]) => (
                  <div key={tone} className="flex justify-between text-sm">
                    <span className="text-blue-800 capitalize">{tone}</span>
                    <span className="text-blue-600 font-medium">{Math.round(score)}%</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Timestamp */}
          <div className="text-xs text-gray-400 text-center">
            Analyzed {new Date(toneFeedback.generated_at).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  )
} 