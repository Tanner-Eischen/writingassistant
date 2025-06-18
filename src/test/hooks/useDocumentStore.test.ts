import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDocumentStore } from '../../hooks/useDocumentStore'
import { supabase } from '../../lib/supabase'

vi.mock('../../lib/supabase')

const mockSupabase = supabase as {
  auth: { getUser: Mock }
  from: Mock
}

describe('useDocumentStore', () => {
  const mockFromChain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn(),
  }

  beforeEach(() => {
    // Reset store state
    useDocumentStore.setState({
      documents: [],
      currentDocument: null,
      loading: false,
      error: null,
    })

    vi.clearAllMocks()
    mockSupabase.from.mockReturnValue(mockFromChain)
  })

  describe('loadUserDocuments', () => {
    it('should load user documents successfully', async () => {
      const mockDocuments = [
        { id: '1', title: 'Doc 1', content: 'Content 1', user_id: 'user1' },
        { id: '2', title: 'Doc 2', content: 'Content 2', user_id: 'user1' },
      ]

      mockFromChain.order.mockResolvedValue({
        data: mockDocuments,
        error: null,
      })

      const { result } = renderHook(() => useDocumentStore())

      await act(async () => {
        await result.current.loadUserDocuments()
      })

      expect(result.current.documents).toEqual(mockDocuments)
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(mockSupabase.from).toHaveBeenCalledWith('documents')
      expect(mockFromChain.select).toHaveBeenCalledWith('*')
      expect(mockFromChain.order).toHaveBeenCalledWith('updated_at', { ascending: false })
    })

    it('should handle errors when loading documents', async () => {
      const mockError = { message: 'Database error' }
      mockFromChain.order.mockResolvedValue({
        data: null,
        error: mockError,
      })

      const { result } = renderHook(() => useDocumentStore())

      await act(async () => {
        await result.current.loadUserDocuments()
      })

      expect(result.current.documents).toEqual([])
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe('Database error')
    })
  })

  describe('createDocument', () => {
    it('should create a new document successfully', async () => {
      const mockUser = { id: 'user123' }
      const mockDocument = {
        id: 'doc123',
        title: 'New Document',
        content: '',
        user_id: 'user123',
        status: 'draft',
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      mockFromChain.single.mockResolvedValue({
        data: mockDocument,
        error: null,
      })

      const { result } = renderHook(() => useDocumentStore())

      await act(async () => {
        const doc = await result.current.createDocument('New Document')
        expect(doc).toEqual(mockDocument)
      })

      expect(result.current.documents).toContain(mockDocument)
      expect(result.current.currentDocument).toEqual(mockDocument)
      expect(mockFromChain.insert).toHaveBeenCalledWith({
        title: 'New Document',
        content: '',
        user_id: 'user123',
        status: 'draft',
      })
    })

    it('should handle authentication errors', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const { result } = renderHook(() => useDocumentStore())

      await act(async () => {
        const doc = await result.current.createDocument('New Document')
        expect(doc).toBeNull()
      })

      expect(result.current.error).toBe('Not authenticated')
      expect(mockFromChain.insert).not.toHaveBeenCalled()
    })
  })

  describe('updateDocument', () => {
    it('should update a document successfully', async () => {
      const initialDoc = {
        id: 'doc123',
        title: 'Original Title',
        content: 'Original content',
        user_id: 'user123',
      }

      useDocumentStore.setState({
        documents: [initialDoc],
        currentDocument: initialDoc,
      })

      mockFromChain.eq.mockResolvedValue({ error: null })

      const { result } = renderHook(() => useDocumentStore())

      await act(async () => {
        await result.current.updateDocument('doc123', { title: 'Updated Title' })
      })

      expect(result.current.documents[0].title).toBe('Updated Title')
      expect(result.current.currentDocument?.title).toBe('Updated Title')
      expect(mockFromChain.update).toHaveBeenCalledWith({ title: 'Updated Title' })
      expect(mockFromChain.eq).toHaveBeenCalledWith('id', 'doc123')
    })
  })

  describe('deleteDocument', () => {
    it('should delete a document successfully', async () => {
      const docToDelete = { id: 'doc123', title: 'To Delete', user_id: 'user123' }
      const docToKeep = { id: 'doc456', title: 'To Keep', user_id: 'user123' }

      useDocumentStore.setState({
        documents: [docToDelete, docToKeep],
        currentDocument: docToDelete,
      })

      mockFromChain.eq.mockResolvedValue({ error: null })

      const { result } = renderHook(() => useDocumentStore())

      await act(async () => {
        await result.current.deleteDocument('doc123')
      })

      expect(result.current.documents).toEqual([docToKeep])
      expect(result.current.currentDocument).toBeNull()
      expect(mockFromChain.delete).toHaveBeenCalled()
      expect(mockFromChain.eq).toHaveBeenCalledWith('id', 'doc123')
    })
  })
}) 