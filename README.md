# StarSprout MVP

A trust-first, playful quest system that helps children build consistent habits while giving parents actionable insights.

## Overview

StarSprout is a production-ready Progressive Web App (PWA) built with Next.js 16, Clerk, Supabase, and Upstash Redis. The application implements a complete gamified habit-building system with:

- **Parent Dashboard**: Assign quests, approve completions, manage rewards, view analytics
- **Child Experience**: Complete quests, earn points/badges, request rewards, see progress
- **Privacy-First Design**: COPPA/GDPR-aligned with household isolation and parental controls
- **AI-Powered**: Optional AI features for motivational messages, reflections, and weekly insights
- **Admin Panel**: Internal operations tool for content management and system monitoring

## Tech Stack

- **Framework**: Next.js 16 (App Router) with React 19.2
- **Authentication**: Clerk with role-based access (parent/child/admin) and household metadata
- **Database**: Supabase Postgres with Row Level Security (RLS)
- **Caching**: Upstash Redis for leaderboards and aggregates
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **AI**: OpenAI integration (optional, with fallbacks)
- **Notifications**: MagicBell for in-app notifications
- **Email**: Resend for transactional emails (parent-only)
- **Storage**: Vercel Blob for avatars and badges
- **Analytics**: Vercel Analytics (privacy-safe)

## Getting Started

### Prerequisites

- Node.js 18+
- Clerk account (sign up at [clerk.com](https://clerk.com))
- Supabase account (connected via Vercel)
- Upstash Redis account (connected via Vercel)

### Installation

1. Clone and install dependencies:

```bash
npm install
```

2. Set up Clerk:
   - Create an application at [dashboard.clerk.com](https://dashboard.clerk.com)
   - Copy your Publishable Key and Secret Key from the API Keys page
   - Add them to your environment variables (see step 3)

3. Set up environment variables:
   
   **Required for Clerk:**
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Get from Clerk Dashboard
   - `CLERK_SECRET_KEY` - Get from Clerk Dashboard
   
   See `.env.example` for all environment variables. You can add these in the **Vars** section of the v0 sidebar or in your `.env.local` file.

4. Run database migrations:

   Execute the SQL scripts in `/scripts` in order:
   - `001_create_starsprout_schema.sql`
   - `002_create_rls_policies.sql`
   - `003_seed_system_data.sql`
   - `004_create_helper_functions.sql`

5. Start the development server:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
starsprout/
├── app/
│   ├── sign-in/           # Clerk sign-in page
│   ├── sign-up/           # Clerk sign-up page
│   ├── onboarding/        # Parent and child onboarding flows
│   ├── parent/            # Parent dashboard and management
│   ├── kid/               # Child quest experience
│   ├── admin/             # Admin panel (internal ops)
│   ├── legal/             # Privacy policy and terms
│   └── api/
│       ├── auth/          # Auth API routes (metadata updates)
│       ├── ai/            # AI endpoints (motivation, reflection, etc.)
│       ├── email/         # Email cron jobs
│       └── settings/      # Preferences and feature flags
├── emails/                # React Email templates
│   ├── welcome.tsx        # Parent welcome email
│   └── weekly-summary.tsx # Weekly insights email
├── lib/
│   ├── auth/              # Auth helpers and role management (Clerk)
│   ├── adminAuth.ts       # Admin-specific auth helpers
│   ├── db/                # Database client and types
│   │   └── repositories/  # Domain-specific data access
│   ├── ai/                # OpenAI integration wrapper
│   ├── email/             # Resend email service
│   ├── notify/            # MagicBell notification wrapper
│   ├── cache/             # Upstash Redis helpers
│   ├── storage/           # Vercel Blob helpers
│   ├── telemetry/         # Vercel Analytics helpers
│   └── supabase/          # Supabase client/server/proxy
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── kid/               # Child-specific components
│   ├── parent/            # Parent-specific components
│   ├── admin/             # Admin panel components
│   ├── onboarding/        # Onboarding flow components
│   └── notifications/     # MagicBell integration
├── scripts/               # SQL database migrations
├── proxy.ts               # Clerk middleware with role-based routing
└── public/                # PWA manifest and icons
```

## Authentication Flow

StarSprout uses Clerk for authentication with custom role-based access:

1. **Sign Up**: Parents sign up via Clerk's UI at `/sign-up`
2. **Onboarding**: Parents complete household setup and consent
3. **Metadata Storage**: User role, household_id, and age_band stored in Clerk's `publicMetadata`
4. **Database Sync**: User profiles synced to Supabase for household data
5. **Route Protection**: Middleware enforces role-based access (parent vs child routes)

### Role Model

- **Parent**: Can access `/parent/*` routes, manage household, approve actions
- **Child**: Can access `/kid/*` routes, complete quests, request rewards
- **Admin**: Can access `/admin/*` routes, internal operations tool (requires dual auth)

## Key Features

### For Parents

- Create household and add children
- Assign quests from system templates or custom templates
- Review and approve quest submissions
- Create custom rewards and manage redemptions
- View weekly insights and analytics
- Approve social connections (friends)
- Privacy and consent management
- Receive weekly summary emails (optional)

### For Children

- View and complete daily quests
- Earn points and unlock badges
- Track streaks and progress
- Request reward redemptions
- Safe, parent-approved friend connections
- Age-appropriate UI and motivational messages
- Friends-only leaderboard

### For Admins

- View system metrics (households, users, tasks)
- Manage all households
- View user details and activity
- Create and manage quest templates
- Manage badge definitions and criteria
- Toggle features per household/user
- Monitor cron job execution
- View all system activity events

## Database Schema

The application uses 17 tables with comprehensive RLS policies:

- `starsprout_households` - Family units
- `starsprout_users` - Parents and children (synced with Clerk)
- `starsprout_tasks` - Quest instances
- `starsprout_quest_templates` - Reusable quest templates
- `starsprout_rewards` - Reward catalog
- `starsprout_reward_redemptions` - Redemption requests
- `starsprout_badges` - Badge definitions
- `starsprout_user_badges` - Earned badges
- `starsprout_streaks` - Daily completion streaks
- `starsprout_user_points` - Point totals and balances
- `starsprout_friendships` - Social connections
- `starsprout_consents` - COPPA/privacy consents
- `starsprout_activity_events` - Audit log
- `starsprout_notification_preferences` - Notification settings
- `starsprout_feature_flags` - AI and feature toggles
- `starsprout_weekly_summaries` - Generated insights
- `starsprout_leaderboard_snapshots` - Weekly rankings

All tables implement household-scoped RLS policies to ensure data isolation.

## Email System

StarSprout uses Resend for parent-only transactional emails:

- **Welcome Email**: Sent after parent completes onboarding
- **Weekly Summary**: Automated delivery every Sunday evening
  - Household stats (quests, badges, streaks)
  - Child highlights
  - AI-generated insights (strengths, opportunities)
  - Praise lines with copy button
  - Link to dashboard

Configure weekly emails in `/api/email/weekly-summary` as a Vercel Cron Job:
```
0 20 * * 0  (8pm Sunday, PT)
```

## AI Features

Optional AI-powered features (requires `OPENAI_API_KEY`):

- **Motivational Messages**: Age-appropriate encouragement after quest completion
- **Reflection Prompts**: Ephemeral, non-stored reflection questions
- **Weekly Insights**: Narrative summaries with strengths and opportunities
- **Template Suggestions**: AI-generated quest templates
- **Tuning Suggestions**: Difficulty and point recommendations

All AI features:
- Use only aggregated, anonymous signals (no PII)
- Have graceful fallbacks when disabled or unavailable
- Can be toggled off in parent settings
- Never store child free-text responses

## Security

- Clerk-managed authentication with secure session handling
- Row Level Security (RLS) enforced on all Supabase tables
- Household-scoped data isolation
- Parent consent required for child accounts
- No PII sent to AI providers
- No third-party tracking or ads
- Role-based route protection via middleware
- Rate limiting on AI endpoints
- CRON_SECRET protection for scheduled jobs
- Admin routes protected by dual authentication (role + allowlist)
- No impersonation feature (by design)
- All admin actions write to audit logs
- Unauthorized access shows a clean error page with no data leakage

## PWA Configuration

StarSprout is installable as a Progressive Web App:

- Manifest file at `/manifest.json`
- App icons (192x192, 512x512)
- Offline-friendly architecture
- Responsive design optimized for mobile
- Theme color and viewport configuration
- Haptic feedback on supported devices

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Format code
npm run format

# Type check
npm run typecheck
```

## Environment Variables

### Required

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk publishable key
- `CLERK_SECRET_KEY` - Clerk secret key
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL (auto-configured)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key (auto-configured)
- `KV_REST_API_URL` - Upstash Redis URL (auto-configured)
- `KV_REST_API_TOKEN` - Upstash Redis token (auto-configured)

### Optional

- `OPENAI_API_KEY` - Enable AI features (motivations, reflections, insights)
- `MAGICBELL_API_KEY` - Enable in-app notifications
- `MAGICBELL_API_SECRET` - MagicBell secret
- `RESEND_API_KEY` - Enable transactional emails
- `BLOB_READ_WRITE_TOKEN` - Enable file uploads (avatars, badges)
- `CRON_SECRET` - Secure scheduled jobs (weekly summary)
- `NEXT_PUBLIC_APP_URL` - App URL for email links (production)
- `ADMIN_EMAIL_ALLOWLIST` - Comma-separated admin email addresses

## Deployment

Deploy to Vercel with automatic integration setup:

1. Connect your repository to Vercel
2. Add Supabase and Upstash Redis integrations via Vercel Dashboard
3. Add Clerk environment variables in Vercel project settings
4. Add optional environment variables for AI/email/notifications
5. Configure Cron Job for weekly summaries (Settings > Cron Jobs)
6. Deploy

## Scheduled Jobs

Configure in Vercel Cron Jobs:

- **Weekly Summary Email**: `0 20 * * 0` (8pm Sunday PT)
  - Endpoint: `/api/email/weekly-summary`
  - Method: POST
  - Add `CRON_SECRET` header for authentication

## Troubleshooting

### "Missing publishableKey" error

You need to add your Clerk API keys. Get them from [dashboard.clerk.com/last-active?path=api-keys](https://dashboard.clerk.com/last-active?path=api-keys) and add to the **Vars** section in the v0 sidebar.

### Database errors

Ensure you've run all SQL migration scripts in order. Check the Supabase dashboard SQL editor for any errors.

### Emails not sending

1. Add `RESEND_API_KEY` to environment variables
2. Configure a verified domain in Resend dashboard
3. Update `from` addresses in `lib/email/index.ts` to use your domain

### AI features not working

1. Add `OPENAI_API_KEY` to environment variables
2. Check API key has sufficient credits
3. Ensure rate limits are not exceeded

## License

Private - Not for redistribution

## Support

For questions or issues, please refer to the PRD document or contact the development team.
