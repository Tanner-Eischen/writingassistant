import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Database } from '../lib/types'

type Document = Database['public']['Tables']['documents']['Row']

interface DocumentState {
  // State
  documents: Document[]
  currentDocument: Document | null
  loading: boolean
  error: string | null

  // Actions
  setDocuments: (documents: Document[]) => void
  setCurrentDocument: (document: Document | null) => void
  updateContent: (content: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
  
  // Real database functions
  loadUserDocuments: () => Promise<void>
  createDocument: (title: string) => Promise<Document | null>
  updateDocument: (id: string, updates: Partial<Document>) => Promise<void>
  deleteDocument: (id: string) => Promise<void>
  
  // Mock data functions (keeping for backward compatibility)
  createMockDocument: (title: string) => Document
  loadMockDocuments: () => void
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  // Initial state
  documents: [],
  currentDocument: null,
  loading: false,
  error: null,

  // Simple setters
  setDocuments: (documents) => set({ documents }),
  setCurrentDocument: (document) => set({ currentDocument: document }),
  updateContent: (content) => {
    const { currentDocument } = get()
    if (currentDocument) {
      const updated = { ...currentDocument, content, updated_at: new Date().toISOString() }
      set({ currentDocument: updated })
      
      // Also update in documents array
      const { documents } = get()
      const updatedDocuments = documents.map(doc => 
        doc.id === updated.id ? updated : doc
      )
      set({ documents: updatedDocuments })

      // Auto-save to database (debounced)
      debouncedSave(updated.id, content)
    }
  },
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  // Real database functions
  loadUserDocuments: async () => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('updated_at', { ascending: false })

      if (error) throw error

      set({ documents: data || [], loading: false })
    } catch (error: any) {
      console.error('Error loading documents:', error)
      set({ 
        error: error.message || 'Failed to load documents',
        loading: false 
      })
    }
  },

  createDocument: async (title) => {
    set({ loading: true, error: null })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('documents')
        .insert({
          title,
          content: '',
          user_id: user.id,
          status: 'draft'
        })
        .select()
        .single()

      if (error) throw error

      const { documents } = get()
      set({ 
        documents: [data, ...documents],
        currentDocument: data,
        loading: false 
      })

      return data
    } catch (error: any) {
      console.error('Error creating document:', error)
      set({ 
        error: error.message || 'Failed to create document',
        loading: false 
      })
      return null
    }
  },

  updateDocument: async (id, updates) => {
    try {
      const { error } = await supabase
        .from('documents')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      // Update local state
      const { documents, currentDocument } = get()
      const updatedDocuments = documents.map(doc => 
        doc.id === id ? { ...doc, ...updates } : doc
      )
      set({ 
        documents: updatedDocuments,
        currentDocument: currentDocument?.id === id 
          ? { ...currentDocument, ...updates }
          : currentDocument
      })
    } catch (error: any) {
      console.error('Error updating document:', error)
      set({ error: error.message || 'Failed to update document' })
    }
  },

  deleteDocument: async (id) => {
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id)

      if (error) throw error

      const { documents, currentDocument } = get()
      const updatedDocuments = documents.filter(doc => doc.id !== id)
      set({ 
        documents: updatedDocuments,
        currentDocument: currentDocument?.id === id ? null : currentDocument
      })
    } catch (error: any) {
      console.error('Error deleting document:', error)
      set({ error: error.message || 'Failed to delete document' })
    }
  },

  // Mock functions (keeping for backward compatibility)
  createMockDocument: (title) => {
    const newDoc: Document = {
      id: `doc_${Date.now()}`,
      user_id: 'mock_user',
      title,
      content: '',
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    const { documents } = get()
    const updatedDocuments = [newDoc, ...documents]
    set({ documents: updatedDocuments, currentDocument: newDoc })
    
    return newDoc
  },

  loadMockDocuments: () => {
    const mockDocs: Document[] = [
      {
        id: 'doc_1',
        user_id: 'mock_user',
        title: 'Welcome to Writing Assistant',
        content: 'This is your first document. Start writing here...',
        status: 'draft',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'doc_2',
        user_id: 'mock_user', 
        title: 'Sample Document',
        content: 'This is a sample document with some text to demonstrate the editor.',
        status: 'draft',
        created_at: new Date(Date.now() - 172800000).toISOString(),
        updated_at: new Date(Date.now() - 7200000).toISOString()
      }
    ]
    
    set({ documents: mockDocs })
  }
}))

// Debounced auto-save function
let saveTimeout: NodeJS.Timeout
const debouncedSave = (documentId: string, content: string) => {
  clearTimeout(saveTimeout)
  saveTimeout = setTimeout(async () => {
    try {
      await useDocumentStore.getState().updateDocument(documentId, { 
        content,
        updated_at: new Date().toISOString()
      })
      console.log('Document auto-saved')
    } catch (error) {
      console.error('Auto-save failed:', error)
    }
  }, 1000) // Save after 1 second of inactivity
}

// Auto-save hook
export const useAutoSave = () => {
  const updateContent = useDocumentStore(state => state.updateContent)
  return updateContent
} 