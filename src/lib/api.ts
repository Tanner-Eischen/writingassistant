import { supabase } from './supabase'
import type { Database } from './types'

type Document = Database['public']['Tables']['documents']['Row']
type DocumentInsert = Database['public']['Tables']['documents']['Insert']
type DocumentUpdate = Database['public']['Tables']['documents']['Update']

export class DocumentsAPI {
  // Get all documents for the current user
  static async getAllDocuments() {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching documents:', error)
      throw new Error(error.message)
    }

    return data
  }

  // Get a specific document by ID
  static async getDocument(id: string) {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching document:', error)
      throw new Error(error.message)
    }

    return data
  }

  // Create a new document
  static async createDocument(title: string, content: string = '') {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User not authenticated')
    }

    const documentData: DocumentInsert = {
      user_id: user.id,
      title,
      content,
      status: 'draft'
    }

    const { data, error } = await supabase
      .from('documents')
      .insert(documentData)
      .select()
      .single()

    if (error) {
      console.error('Error creating document:', error)
      throw new Error(error.message)
    }

    return data
  }

  // Update an existing document
  static async updateDocument(id: string, updates: Partial<DocumentUpdate>) {
    const { data, error } = await supabase
      .from('documents')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating document:', error)
      throw new Error(error.message)
    }

    return data
  }

  // Delete a document
  static async deleteDocument(id: string) {
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting document:', error)
      throw new Error(error.message)
    }

    return true
  }

  // Auto-save document content (debounced)
  static async autoSaveDocument(id: string, content: string) {
    return this.updateDocument(id, { content })
  }
}

// Suggestions API
export class SuggestionsAPI {
  // Get suggestions for a document
  static async getSuggestions(documentId: string) {
    const { data, error } = await supabase
      .from('suggestions')
      .select('*')
      .eq('document_id', documentId)
      .order('start_index', { ascending: true })

    if (error) {
      console.error('Error fetching suggestions:', error)
      throw new Error(error.message)
    }

    return data
  }

  // Accept a suggestion
  static async acceptSuggestion(suggestionId: string) {
    const { data, error } = await supabase
      .from('suggestions')
      .update({ accepted: true })
      .eq('id', suggestionId)
      .select()
      .single()

    if (error) {
      console.error('Error accepting suggestion:', error)
      throw new Error(error.message)
    }

    return data
  }

  // Create a new suggestion
  static async createSuggestion(suggestion: Database['public']['Tables']['suggestions']['Insert']) {
    const { data, error } = await supabase
      .from('suggestions')
      .insert(suggestion)
      .select()
      .single()

    if (error) {
      console.error('Error creating suggestion:', error)
      throw new Error(error.message)
    }

    return data
  }
} 