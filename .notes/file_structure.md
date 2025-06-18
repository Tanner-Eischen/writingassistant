.
├── public/                         # Static assets (favicon, logos, etc.)
├── src/
│   ├── assets/                    # Icons, images, etc.
│   ├── components/                # Reusable UI components
│   │   ├── Editor/               # Main text editor with suggestions
│   │   │   ├── Editor.tsx
│   │   │   └── SuggestionMarker.tsx
│   │   ├── SuggestionPopover.tsx # Click-to-accept UI for suggestions
│   │   ├── ToneCard.tsx          # Tone feedback display
│   │   ├── ReadabilityCard.tsx   # Readability score display
│   │   ├── SettingsModal.tsx     # User preference configuration
│   │   ├── Sidebar.tsx           # Navigation panel
│   │   ├── Header.tsx            # Top bar with auth/session info
│   │   └── DocumentList.tsx      # Lists user’s documents
│   ├── hooks/                     # Custom Zustand + logic hooks
│   │   ├── useAuthStore.ts       # Auth/session management
│   │   ├── useDocumentStore.ts   # Document + content state
│   │   ├── useSettingsStore.ts   # User preferences
│   │   └── useRealtimeSync.ts    # Supabase realtime subscriptions
│   ├── lib/                       # Supabase client, utility functions
│   │   ├── supabase.ts           # Initialized Supabase client
│   │   ├── api.ts                # API request helpers
│   │   ├── types.ts              # Global TypeScript types/interfaces
│   │   └── constants.ts          # Enum values, status types, etc.
│   ├── pages/                     # Route-level components
│   │   ├── index.tsx             # Landing page or redirect to /dashboard
│   │   ├── login.tsx             # Login/signup screen
│   │   ├── dashboard.tsx         # Lists documents
│   │   └── editor/[id].tsx       # Editor page for a document
│   ├── styles/                    # Global Tailwind config and custom classes
│   │   └── globals.css
│   ├── App.tsx                    # Main app wrapper (routes, layout)
│   ├── main.tsx                   # Vite entry point
│   └── router.tsx                 # Route definitions using React Router
├── supabase/
│   ├── sql/                       # SQL seed scripts for tables & RLS
│   │   ├── schema.sql
│   │   └── policies.sql
│   └── functions/                # Supabase Edge Functions
│       ├── analyze-grammar.ts   # Grammar/spell analysis proxy
│       ├── analyze-tone.ts      # Tone classification
│       └── analyze-readability.ts # Readability scoring
├── .env                           # API keys, Supabase project URL
├── tailwind.config.ts            # Tailwind setup
├── tsconfig.json                 # TypeScript settings
├── vite.config.ts                # Vite bundler config
└── README.md                     # Project overview and setup
