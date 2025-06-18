import React, { useState, useEffect } from 'react'
import { useAuthStore } from '../hooks/useAuthStore'
import { useDocumentStore } from '../hooks/useDocumentStore'
import { AnalysisAPI } from '../lib/analysisAPI'
import Editor from '../components/Editor/Editor'
import ToneCard from '../components/ToneCard'
import ReadabilityCard from '../components/ReadabilityCard'
import type { Database } from '../lib/types'

type ToneFeedback = Database['public']['Tables']['tone_feedback']['Row']
type ReadabilityScore = Database['public']['Tables']['readability_scores']['Row']

export default function DashboardPage() {
  const { user, signOut: authSignOut } = useAuthStore()
  const { 
    documents, 
    currentDocument, 
    loading, 
    error,
    setCurrentDocument,
    createDocument,
    loadUserDocuments,
    deleteDocument,
    clearError
  } = useDocumentStore()
  
  const [showNewDocumentModal, setShowNewDocumentModal] = useState(false)
  const [newDocumentTitle, setNewDocumentTitle] = useState('')
  
  // Analysis states
  const [toneFeedback, setToneFeedback] = useState<ToneFeedback | null>(null)
  const [readabilityScores, setReadabilityScores] = useState<ReadabilityScore[]>([])
  const [toneLoading, setToneLoading] = useState(false)
  const [readabilityLoading, setReadabilityLoading] = useState(false)

  // Load user documents on mount
  useEffect(() => {
    if (user) {
      loadUserDocuments()
    }
  }, [user, loadUserDocuments])

  // Clear analysis when document changes
  useEffect(() => {
    setToneFeedback(null)
    setReadabilityScores([])
  }, [currentDocument?.id])

  const handleCreateDocument = async () => {
    if (!newDocumentTitle.trim()) return
    
    try {
      await createDocument(newDocumentTitle.trim())
      setNewDocumentTitle('')
      setShowNewDocumentModal(false)
    } catch (error) {
      console.error('Error creating document:', error)
    }
  }

  const handleDeleteDocument = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      await deleteDocument(id)
    }
  }

  const handleToneAnalysis = async () => {
    if (!currentDocument?.content.trim()) {
      alert('Please write some content first')
      return
    }

    if (currentDocument.content.length < 20) {
      alert('Please write at least 20 characters for tone analysis')
      return
    }

    setToneLoading(true)
    try {
      const result = await AnalysisAPI.analyzeTone(currentDocument.content, currentDocument.id)
      setToneFeedback(result)
    } catch (error) {
      console.error('Tone analysis failed:', error)
      alert('Tone analysis failed. Please try again.')
    } finally {
      setToneLoading(false)
    }
  }

  const handleReadabilityAnalysis = async () => {
    if (!currentDocument?.content.trim()) {
      alert('Please write some content first')
      return
    }

    if (currentDocument.content.length < 50) {
      alert('Please write at least 50 characters for readability analysis')
      return
    }

    setReadabilityLoading(true)
    try {
      const result = await AnalysisAPI.analyzeReadability(currentDocument.content, currentDocument.id)
      setReadabilityScores(result.readability_scores)
    } catch (error) {
      console.error('Readability analysis failed:', error)
      alert('Readability analysis failed. Please try again.')
    } finally {
      setReadabilityLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Writing Assistant</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, {user?.email || 'User'}
              </span>
              <button
                onClick={authSignOut}
                className="text-sm text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-md transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="flex gap-6">
          {/* Left Sidebar - Document List */}
          <div className="w-1/5 bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Documents</h2>
              <button
                onClick={() => setShowNewDocumentModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
              >
                New
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700">{error}</p>
                <button 
                  onClick={clearError}
                  className="text-xs text-red-600 hover:text-red-800 mt-1"
                >
                  Dismiss
                </button>
              </div>
            )}

            {loading && documents.length === 0 ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Loading...</p>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      currentDocument?.id === doc.id
                        ? 'bg-blue-50 border-blue-200 border'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                    onClick={() => setCurrentDocument(doc)}
                  >
                    <h3 className="font-medium text-gray-900 truncate">{doc.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(doc.updated_at).toLocaleDateString()}
                    </p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Draft
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteDocument(doc.id)
                        }}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                
                {documents.length === 0 && !loading && (
                  <p className="text-gray-500 text-center py-8">
                    No documents yet. Create your first document!
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Main Content - Editor */}
          <div className="flex-1 bg-white rounded-lg shadow p-6">
            {currentDocument ? (
              <Editor documentId={currentDocument.id} />
            ) : (
              <div className="text-center py-12">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Welcome to Writing Assistant!
                </h3>
                <p className="text-gray-600 mb-4">
                  Select a document from the sidebar or create a new one to get started.
                </p>
                <button
                  onClick={() => setShowNewDocumentModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                >
                  Create Your First Document
                </button>
              </div>
            )}
          </div>

          {/* Right Sidebar - Analysis Panels */}
          <div className="w-1/4 space-y-6">
            <ToneCard 
              toneFeedback={toneFeedback}
              loading={toneLoading}
              onAnalyze={handleToneAnalysis}
            />
            
            <ReadabilityCard 
              readabilityScores={readabilityScores}
              loading={readabilityLoading}
              onAnalyze={handleReadabilityAnalysis}
            />
          </div>
        </div>
      </div>

      {/* New Document Modal */}
      {showNewDocumentModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Document</h3>
            <input
              type="text"
              value={newDocumentTitle}
              onChange={(e) => setNewDocumentTitle(e.target.value)}
              placeholder="Enter document title"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateDocument()
                } else if (e.key === 'Escape') {
                  setShowNewDocumentModal(false)
                }
              }}
              autoFocus
            />
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => setShowNewDocumentModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateDocument}
                disabled={!newDocumentTitle.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 