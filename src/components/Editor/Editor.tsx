import React, { useEffect, useRef, useState } from 'react'
import { useDocumentStore, useAutoSave } from '../../hooks/useDocumentStore'
import SuggestionMarker from './SuggestionMarker'
import { SuggestionEngine } from '../../lib/suggestionEngine'
import type { Suggestion } from '../../lib/types'

interface EditorProps {
  documentId: string
}

export default function Editor({ }: EditorProps) {
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  
  const { 
    currentDocument, 
    loading, 
    error,
    updateContent,
    clearError
  } = useDocumentStore()
  
  const debouncedAutoSave = useAutoSave()

  // Handle content changes
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    updateContent(newContent)
    setIsTyping(true)
    
    // Analyze content for suggestions with debouncing
    if (currentDocument && newContent.length > 5) {
      console.log('Starting suggestion analysis...') // Debug log
      
      SuggestionEngine.analyzeTextDebounced(
        newContent, 
        currentDocument.id,
        (newSuggestions) => {
          console.log('Received suggestions:', newSuggestions) // Debug log
          setSuggestions(newSuggestions)
        },
        1500 // Wait 1.5 seconds after user stops typing
      )
    } else {
      setSuggestions([])
    }
    
    // Trigger auto-save
    debouncedAutoSave()
    
    // Reset typing indicator
    setTimeout(() => setIsTyping(false), 1000)
  }

  // Handle key shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl+S or Cmd+S to manually save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault()
      debouncedAutoSave()
    }
  }

  // Clear error when user starts typing
  useEffect(() => {
    if (error && isTyping) {
      clearError()
    }
  }, [error, isTyping, clearError])

  // Add suggestion handlers
  const handleAcceptSuggestion = (suggestion: Suggestion) => {
    if (!currentDocument) return
    
    const newContent = 
      currentDocument.content.substring(0, suggestion.start_index) +
      suggestion.suggested_text +
      currentDocument.content.substring(suggestion.end_index)
    
    updateContent(newContent)
    setSuggestions(prev => prev.filter(s => s.id !== suggestion.id))
  }

  const handleDismissSuggestion = (suggestionId: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId))
  }

  if (loading && !currentDocument) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading document...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading document</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!currentDocument) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No document selected</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Document Header */}
      <div className="flex-shrink-0 border-b border-gray-200 pb-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{currentDocument.title}</h1>
            <p className="text-sm text-gray-500 mt-1">
              Last updated: {new Date(currentDocument.updated_at).toLocaleString()}
              {isTyping && <span className="ml-2 text-blue-600">• Typing...</span>}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Draft
            </span>
          </div>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 relative">
        <textarea
          ref={editorRef}
          value={currentDocument.content}
          onChange={handleContentChange}
          onKeyDown={handleKeyDown}
          className="w-full h-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm leading-relaxed"
          placeholder="Start writing your document here..."
          spellCheck={false}
        />
        
        {/* Suggestion Overlays - Back on top of textarea */}
        <SuggestionMarker 
          content={currentDocument.content}
          suggestions={suggestions}
          editorRef={editorRef}
          onAcceptSuggestion={handleAcceptSuggestion}
          onDismissSuggestion={handleDismissSuggestion}
        />
      </div>

      {/* Remove the suggestions panel from below and replace with summary */}
      <div className="flex-shrink-0 mt-2">
        {suggestions.length > 0 && (
          <div className="text-sm text-gray-600 text-center">
            💡 {suggestions.length} suggestion{suggestions.length !== 1 ? 's' : ''} found. 
            Click highlighted words for details.
          </div>
        )}
      </div>

      {/* Editor Footer */}
      <div className="flex-shrink-0 border-t border-gray-200 pt-4 mt-4">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <span>{currentDocument.content.length} characters</span>
            <span>{currentDocument.content.split(/\s+/).filter(Boolean).length} words</span>
            <span className="text-gray-400">Suggestions coming soon</span>
            <span className={`${suggestions.length > 0 ? 'text-orange-600' : 'text-green-600'}`}>
              {suggestions.length} suggestions
            </span>
          </div>
          <div className="text-xs">
            Press Ctrl+S to save manually
          </div>
        </div>
      </div>
    </div>
  )
} 