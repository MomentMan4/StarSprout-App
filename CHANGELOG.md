# Changelog

All notable changes to StarSprout MVP will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2026-01-08

### Added
- **Email System**: React Email templates with Resend integration
  - Welcome email for new parent accounts
  - Weekly summary email with household stats and insights
  - Automated cron job for Sunday evening delivery
  - All emails parent-only, respectful, minimal design
- **Enhanced Telemetry**: Privacy-safe event tracking via Vercel Analytics
  - 15+ tracked events (onboarding, quests, rewards, badges, social)
  - Zero PII collection, aggregate metrics only
- **Loading States**: Reusable skeleton components
  - Quest cards, dashboard stats, rewards, leaderboards
  - Consistent loading experience across all screens
- **Error Boundaries**: React error boundary with friendly fallback
  - Graceful error recovery UI
  - Automatic error logging for debugging
- **Empty States**: Unified empty state component with CTAs
  - Used throughout parent and child experiences
- **PWA Manifest**: Complete Progressive Web App configuration
  - App icons generated (192x192, 512x512)
  - Theme colors, orientation, screenshots metadata
  - Installable on iOS and Android

### Changed
- Enhanced `lib/telemetry/index.ts` with comprehensive event types
- Updated `package.json` to include `react-email`, `@react-email/components`, `resend`
- Improved `.env.example` with email and cron configuration

### Fixed
- Graceful fallback when external services (email, AI) are unavailable

## [0.2.0] - 2026-01-08

### Changed
- **BREAKING**: Migrated from Supabase Auth to Clerk for authentication
- Updated authentication flow to use Clerk's managed sign-in/sign-up
- Modified user metadata storage to use Clerk's publicMetadata
- Updated middleware to use `clerkMiddleware` with role-based route protection
- Refactored `lib/auth/index.ts` to work with Clerk session claims
- Updated onboarding flows to sync Clerk users with Supabase database

### Added
- Clerk authentication integration with `@clerk/nextjs`
- New API route `/api/auth/complete-onboarding` for metadata updates
- Role-based route guards in middleware (parent/child separation)
- Setup completion check in middleware to enforce onboarding
- Environment variable documentation in `.env.example`

### Removed
- Old Supabase Auth login/signup pages (`/auth/*`)
- Supabase Auth-specific middleware logic
- Direct Supabase user creation in onboarding

## [0.1.0] - 2026-01-08

### Added
- Initial StarSprout MVP implementation
- Complete database schema with 17 tables and RLS policies
- Parent and child user personas with role-based routing
- Quest management system with templates and daily assignments
- Rewards catalog with request and approval workflows
- Badge system with unlock conditions and progress tracking
- Social features with friend requests and household leaderboards
- Integration wrappers for OpenAI, MagicBell, Upstash, Vercel Blob
- PWA configuration with manifest and mobile optimization
- Privacy-first design with COPPA compliance and parent consent flows
