import React, { useState, useEffect, useRef } from 'react'
import type { Suggestion } from '../../lib/types'

interface SuggestionMarkerProps {
  content: string
  suggestions: Suggestion[]
  editorRef: React.RefObject<HTMLTextAreaElement>
  onAcceptSuggestion: (suggestion: Suggestion) => void
  onDismissSuggestion: (suggestionId: string) => void
}

interface TextPosition {
  top: number
  left: number
  width: number
  height: number
}

export default function SuggestionMarker({ 
  content,
  suggestions,
  editorRef,
  onAcceptSuggestion, 
  onDismissSuggestion 
}: SuggestionMarkerProps) {
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null)
  const [textPositions, setTextPositions] = useState<Map<string, TextPosition>>(new Map())

  // FIXED: Corrected systematic offset issues
  const calculateTextPosition = (start: number, end: number): TextPosition | null => {
    if (!editorRef.current) return null
    
    const textarea = editorRef.current
    
    try {
      // Normalize content to handle copy/paste artifacts
      const normalizedContent = content
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .normalize('NFC')
      
      const safeStart = Math.max(0, Math.min(start, normalizedContent.length))
      const safeEnd = Math.max(safeStart, Math.min(end, normalizedContent.length))
      
      const targetText = normalizedContent.substring(safeStart, safeEnd)
      if (!targetText) return null
      
      // Create mirror div with EXACT textarea styling
      const mirror = document.createElement('div')
      const computedStyle = window.getComputedStyle(textarea)
      
      // Position mirror invisibly
      mirror.style.position = 'absolute'
      mirror.style.visibility = 'hidden'
      mirror.style.top = '-9999px'
      mirror.style.left = '-9999px'
      mirror.style.pointerEvents = 'none'
      
      // CRITICAL: Match textarea's text rendering exactly
      mirror.style.whiteSpace = computedStyle.whiteSpace || 'pre-wrap'
      mirror.style.wordWrap = computedStyle.wordWrap || 'break-word'
      mirror.style.overflowWrap = computedStyle.overflowWrap || 'break-word'
      
      // Copy ALL text-affecting styles
      const textStyles = [
        'font-family', 'font-size', 'font-weight', 'font-style', 'font-variant',
        'line-height', 'letter-spacing', 'word-spacing', 'text-transform', 'text-indent',
        'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
        'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width',
        'width', 'box-sizing', 'direction'
      ]
      
      textStyles.forEach(prop => {
        const value = computedStyle.getPropertyValue(prop)
        if (value) {
          mirror.style.setProperty(prop, value)
        }
      })
      
      document.body.appendChild(mirror)
      
      // Build mirror content with target span
      const beforeText = normalizedContent.substring(0, safeStart)
      const afterText = normalizedContent.substring(safeEnd)
      
      // Add content as text nodes and target span
      if (beforeText) {
        mirror.appendChild(document.createTextNode(beforeText))
      }
      
      const targetSpan = document.createElement('span')
      targetSpan.textContent = targetText
      targetSpan.style.backgroundColor = 'rgba(255, 0, 0, 0.1)' // Debug marker
      mirror.appendChild(targetSpan)
      
      if (afterText) {
        mirror.appendChild(document.createTextNode(afterText))
      }
      
      // Get precise measurements
      const spanRect = targetSpan.getBoundingClientRect()
      const mirrorRect = mirror.getBoundingClientRect()
      
      // Calculate position relative to mirror
      const relativeTop = spanRect.top - mirrorRect.top
      const relativeLeft = spanRect.left - mirrorRect.left
      
      // Get textarea's content area position (excluding borders)
      const textareaRect = textarea.getBoundingClientRect()
      const borderTop = parseFloat(computedStyle.borderTopWidth) || 0
      const borderLeft = parseFloat(computedStyle.borderLeftWidth) || 0
      const paddingTop = parseFloat(computedStyle.paddingTop) || 0
      const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0
      
      // FIXED: Account for scroll WITHOUT double-counting padding
      const scrollTop = textarea.scrollTop
      const scrollLeft = textarea.scrollLeft
      
      // Final calculation - no extra padding added since mirror already has it
      const finalTop = relativeTop - scrollTop
      const finalLeft = relativeLeft - scrollLeft
      
      console.log(`🎯 Position Fix Debug:`, {
        targetText: `"${targetText}"`,
        relativeTop,
        relativeLeft,
        scrollTop,
        scrollLeft,
        finalTop,
        finalLeft,
        paddingTop,
        paddingLeft,
        borderTop,
        borderLeft
      })
      
      // Cleanup
      document.body.removeChild(mirror)
      
      return {
        top: finalTop,
        left: finalLeft,
        width: Math.max(spanRect.width, 8),
        height: Math.max(spanRect.height, 16)
      }
      
    } catch (error) {
      console.error('Position calculation error:', error)
      return null
    }
  }

  // Recalculate positions when content or suggestions change
  useEffect(() => {
    if (!editorRef.current || !content || suggestions.length === 0) {
      setTextPositions(new Map())
      return
    }

    const newPositions = new Map<string, TextPosition>()

    suggestions.forEach((suggestion) => {
      try {
        const position = calculateTextPosition(suggestion.start_index, suggestion.end_index)
        if (position) {
          newPositions.set(suggestion.id, position)
        }
      } catch (error) {
        console.error(`Error processing suggestion ${suggestion.id}:`, error)
      }
    })

    setTextPositions(newPositions)
  }, [content, suggestions])

  // Update on scroll/resize
  useEffect(() => {
    const textarea = editorRef.current
    if (!textarea) return

    const handleUpdate = () => {
      // Recalculate all positions
      const newPositions = new Map<string, TextPosition>()
      suggestions.forEach((suggestion) => {
        const position = calculateTextPosition(suggestion.start_index, suggestion.end_index)
        if (position) {
          newPositions.set(suggestion.id, position)
        }
      })
      setTextPositions(newPositions)
    }

    textarea.addEventListener('scroll', handleUpdate, { passive: true })
    window.addEventListener('resize', handleUpdate, { passive: true })
    
    return () => {
      textarea.removeEventListener('scroll', handleUpdate)
      window.removeEventListener('resize', handleUpdate)  
    }
  }, [suggestions, content])

  const handleHighlightClick = (suggestion: Suggestion, event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setSelectedSuggestion(selectedSuggestion?.id === suggestion.id ? null : suggestion)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('[data-suggestion-popup]') && 
          !target.closest('[data-suggestion-highlight]')) {
        setSelectedSuggestion(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="absolute inset-0 pointer-events-none">
      {suggestions.map((suggestion) => {
        const position = textPositions.get(suggestion.id)
        if (!position) return null

        const isSelected = selectedSuggestion?.id === suggestion.id

        return (
          <div key={suggestion.id}>
            {/* FIXED highlight positioning */}
            <div
              data-suggestion-highlight
              className={`absolute pointer-events-auto cursor-pointer transition-all duration-200 ${
                suggestion.issue_type === 'spelling'
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-blue-500 hover:bg-blue-600'
              } ${isSelected ? 'bg-opacity-50' : 'bg-opacity-30'}`}
              style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
                width: `${position.width}px`,
                height: `${position.height}px`,
                borderRadius: '2px',
                border: '1px solid rgba(255,255,255,0.5)',
                minWidth: '6px',
                minHeight: '14px'
              }}
              onClick={(e) => handleHighlightClick(suggestion, e)}
              title={`${suggestion.issue_type}: ${suggestion.explanation}`}
            />

            {/* Popup */}
            {isSelected && (
              <div
                data-suggestion-popup
                className="absolute pointer-events-auto bg-white shadow-xl border border-gray-300 rounded-lg p-4 z-50 max-w-sm"
                style={{
                  top: `${position.top + position.height + 8}px`,
                  left: `${Math.max(8, Math.min(position.left, window.innerWidth - 300))}px`
                }}
              >
                <button
                  onClick={() => setSelectedSuggestion(null)}
                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-lg"
                >
                  ✕
                </button>

                <div className="pr-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      suggestion.issue_type === 'spelling' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {suggestion.issue_type}
                    </span>
                    <span className="font-semibold text-gray-900">
                      "{suggestion.original_text}"
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-700 mb-3">
                    {suggestion.explanation}
                  </p>
                  
                  <div className="bg-gray-50 p-3 rounded-lg mb-4">
                    <div className="text-xs text-gray-600 mb-2">Suggested change:</div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm bg-red-100 px-2 py-1 rounded line-through">
                        {suggestion.original_text}
                      </span>
                      <span className="text-gray-400">→</span>
                      <span className="font-mono text-sm bg-green-100 px-2 py-1 rounded font-semibold">
                        {suggestion.suggested_text}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        onAcceptSuggestion(suggestion)
                        setSelectedSuggestion(null)
                      }}
                      className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors font-medium"
                    >
                      ✓ Accept
                    </button>
                    <button
                      onClick={() => {
                        onDismissSuggestion(suggestion.id)
                        setSelectedSuggestion(null)
                      }}
                      className="flex-1 px-3 py-2 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400 transition-colors"
                    >
                      ✗ Dismiss
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
} 