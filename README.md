# Writing Assistant - AI-Powered Grammar & Style Checker

A modern, feature-rich writing assistant built with React and Supabase that helps improve your writing with real-time grammar checking, tone analysis, and readability scoring.

## ✨ Features

- **Real-time Grammar Checking** - Powered by LanguageTool API for instant grammar and spelling suggestions
- **Document Management** - Create, edit, and organize your documents with autosave functionality
- **Tone Analysis** - Analyze the tone of your writing (formal, casual, confident, friendly, professional)
- **Readability Scoring** - Get comprehensive readability metrics including Flesch Reading Ease and Flesch-Kincaid Grade Level
- **User Authentication** - Secure user accounts with email/password authentication
- **Responsive Design** - Clean, modern interface that works on all devices
- **Demo Mode** - Try the application instantly with pre-loaded demo content

## 🚀 Tech Stack

### Frontend
- **React 18** - Modern React with hooks and functional components
- **TypeScript** - Type-safe development experience
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **Zustand** - Lightweight state management

### Backend
- **Supabase** - Backend-as-a-Service with PostgreSQL database
- **Row Level Security (RLS)** - Secure data access policies
- **Edge Functions** - Serverless functions for custom logic

### Testing
- **Vitest** - Fast unit testing framework
- **React Testing Library** - Component testing utilities
- **Mock Service Worker** - API mocking for tests

### External APIs
- **LanguageTool** - Grammar and spell checking service

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- Supabase account (optional - demo mode available)
- LanguageTool API access (optional - for grammar checking)

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/writing-assistant.git
cd writing-assistant
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env.local` file in the root directory:
```env
# Supabase Configuration (Optional - demo mode works without these)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# LanguageTool API (Optional)
VITE_LANGUAGETOOL_API_URL=https://api.languagetool.org
```

### 4. Database Setup (Optional)
If you want to use real user accounts and data persistence:

1. Create a new Supabase project
2. Run the SQL scripts in order:
   ```sql
   -- In your Supabase SQL editor
   supabase/sql/schema.sql      -- Database tables
   supabase/sql/policies.sql    -- Security policies
   supabase/sql/triggers.sql    -- Auto-creation triggers
   ```

### 5. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 🎯 Usage

### Demo Mode (No Setup Required)
The application automatically runs in demo mode with a pre-configured user and sample documents. You can:
- Edit documents and see real-time changes
- Test the user interface and document management
- Experience the overall workflow

### Full Setup with Authentication
With proper environment configuration:
1. **Sign Up** - Create a new account with email/password
2. **Create Documents** - Start writing with the built-in editor
3. **Grammar Checking** - Get real-time suggestions as you type
4. **Analyze Tone** - Use the tone analysis panel to understand your writing style
5. **Check Readability** - Get readability scores to improve accessibility

## 🏗️ Project Structure
