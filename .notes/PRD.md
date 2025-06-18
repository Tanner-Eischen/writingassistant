
# Project Requirements Document – Writing Assistant MVP

---

## Project Overview

Build a writing assistant that helps casual users improve grammar, spelling, clarity, and tone in real-time as they type. It provides suggestions, rephrasing, readability scores, and tone feedback through a lightweight, responsive interface.

---

## User Role & Core Workflows

1. User logs in using Supabase Auth (email or Google).
2. User creates, renames, and deletes documents.
3. User types in an editor with real-time grammar and spelling suggestions.
4. User clicks highlighted suggestions to view explanations and apply fixes.
5. User manually triggers tone and readability analysis.
6. User reviews readability scores and tone feedback summaries.
7. User updates preferences for tone, writing goal, and real-time feedback.
8. User logs out and resumes writing later with data preserved.

---

### Technical Foundation

### Data Models (Supabase)

- `users`: Supabase Auth managed
- `documents`: `id`, `user_id`, `title`, `content`, `status`, `timestamps`
- `suggestions`: `id`, `document_id`, `start_index`, `end_index`, `issue_type`, `original_text`, `suggested_text`, `explanation`, `accepted`
- `readability_scores`: `id`, `document_id`, `score_type`, `score_value`, `analysis_text_length`, `generated_at`
- `tone_feedback`: `id`, `document_id`, `tone_detected`, `confidence`, `summary`, `generated_at`
- `user_settings`: `user_id`, `enabled_platforms`, `preferred_tone`, `goal`, `real_time_enabled`, `auto_save_enabled`

### API Endpoints

- `POST /api/documents`
- `GET /api/documents`, `GET /api/documents/:id`
- `PUT /api/documents/:id`, `DELETE /api/documents/:id`
- `GET /api/suggestions/:document_id`
- `POST /api/suggestions/:id/accept`
- `POST /api/analyze/grammar`
- `POST /api/analyze/tone`
- `POST /api/analyze/readability`
- `GET /api/user-settings`
- `PUT /api/user-settings`

### Key Components (React 18 + TypeScript + Tailwind + Zustand)

- `<Editor />`: main text area with suggestion overlays
- `<SuggestionMarker />`: underlines grammar and spelling issues
- `<SuggestionPopover />`: shows fix options and explanations
- `<ToneCard />` & `<ReadabilityCard />`: feedback visualizations
- `<SettingsModal />`: preference configuration
- `<Sidebar />`, `<Header />`, `<DocumentList />`: navigation and document list
- Zustand Stores: `useAuthStore`, `useDocumentStore`, `useSettingsStore`

---

## MVP Launch Requirements

1. User authentication via Supabase (email or OAuth).
2. Full CRUD operations on documents.
3. Real-time grammar and spelling suggestions.
4. Accept individual suggestions inline.
5. Manual triggers for tone and readability analysis.
6. Persisted feedback results stored in Supabase.
7. User preferences configurable via settings modal.
8. Supabase RLS enforced on all user-specific data.
9. Basic rate limiting on AI analysis API calls.
10. Fully responsive design using Tailwind CSS.
