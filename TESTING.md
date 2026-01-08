# StarSprout MVP Testing Guide

## Pre-Deployment Testing Checklist

### 1. Database Setup Verification

**Execute SQL Scripts in Order:**
```sql
-- Run in Supabase SQL Editor
-- 1. scripts/001_create_starsprout_schema.sql
-- 2. scripts/002_create_rls_policies.sql
-- 3. scripts/003_seed_system_data.sql
-- 4. scripts/004_create_helper_functions.sql
```

**Verify Tables Created:**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'starsprout_%';
```

Expected tables:
- starsprout_households
- starsprout_users
- starsprout_consents
- starsprout_quest_templates
- starsprout_tasks
- starsprout_rewards
- starsprout_reward_redemptions
- starsprout_badges
- starsprout_user_badges
- starsprout_streaks
- starsprout_friendships
- starsprout_leaderboard_snapshots
- starsprout_activity_events
- starsprout_weekly_summaries
- starsprout_notification_preferences
- starsprout_feature_flags
- starsprout_invite_codes

### 2. Row Level Security (RLS) Testing

**Test Cross-Household Access Prevention:**

```sql
-- As Parent 1 (household A), attempt to access household B data
SELECT * FROM starsprout_users WHERE household_id != '[PARENT_1_HOUSEHOLD_ID]';
-- Should return 0 rows

-- As Child 1, attempt to access another child's tasks
SELECT * FROM starsprout_tasks WHERE assigned_to != '[CHILD_1_ID]';
-- Should return 0 rows

-- Verify RLS is enabled on all tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE 'starsprout_%';
-- All should show rowsecurity = true
```

### 3. End-to-End User Flows

#### **Flow 1: Parent Onboarding → Quest Assignment**
1. Sign up as new parent at `/sign-up`
2. Complete onboarding at `/onboarding/parent`:
   - Create household name
   - Add first child (nickname, age band, avatar)
   - Accept consent
   - Assign starter quest
3. Verify database records:
   - Household created in `starsprout_households`
   - Parent user in `starsprout_users` with role='parent'
   - Child user in `starsprout_users` with role='child'
   - Consent record in `starsprout_consents`
   - Task created in `starsprout_tasks`
4. Check MagicBell notification sent to child

#### **Flow 2: Child Quest Submission → Parent Approval**
1. Sign in as child
2. Navigate to `/kid/home`
3. Click "I Did It" on pending quest
4. Add optional reflection text
5. Submit quest
6. Verify:
   - Task status = 'submitted' in database
   - MagicBell notification sent to parent
7. Sign in as parent
8. Navigate to `/parent/quests`
9. Approve the quest
10. Verify:
    - Task status = 'approved'
    - Points added to child's total
    - Streak updated (if eligible)
    - Badge awarded (if eligible)
    - MagicBell notification sent to child

#### **Flow 3: Reward Redemption Cycle**
1. As parent, create reward at `/parent/rewards`
   - Set point cost
   - Add description
2. As child, browse rewards at `/kid/rewards`
3. Request reward redemption
4. Verify:
   - Redemption request created with status='requested'
   - MagicBell notification sent to parent
5. As parent, approve redemption
6. Verify:
   - Points deducted from child's balance
   - Status = 'approved'
   - MagicBell notification sent to child
7. As parent, mark as fulfilled
8. Verify status = 'fulfilled'

#### **Flow 4: Friend Request with Parent Approval**
1. As child 1, copy friend invite code at `/kid/friends`
2. As child 2 (different household), enter friend code
3. Verify:
   - Friendship record created with status='pending'
   - MagicBell notifications sent to BOTH parents
4. As parent 1, approve at `/parent/social`
5. As parent 2, approve at `/parent/social`
6. Verify:
   - Friendship status = 'approved'
   - Both children appear in each other's friends list
   - Leaderboard shows friends only
   - MagicBell notifications sent to both children

### 4. Security Testing

**Test Authentication & Authorization:**

```bash
# Attempt to access protected route without auth
curl https://your-app.vercel.app/api/email/weekly-summary
# Should return 401 Unauthorized

# Attempt child action as parent
# Sign in as parent, then try to access /kid/home
# Should redirect or show error

# Test role enforcement
# As child, try to access /parent/dashboard
# Should redirect to /kid/home

# Test household isolation
# As parent A, try to approve task from household B
# Should fail with authorization error
```

**Test Rate Limiting:**

```bash
# Test AI endpoint rate limit (10/min)
for i in {1..15}; do
  curl -X POST https://your-app.vercel.app/api/ai/motivation \
    -H "Content-Type: application/json" \
    -d '{"questTitle":"Test","childNickname":"Test","ageBand":"8-10"}'
done
# Should return 429 after 10 requests

# Test friend request rate limit (5/hour)
# Make 6 friend requests within an hour
# Should fail after 5th request
```

### 5. AI Feature Testing

**Test AI Endpoints with Fallbacks:**

1. With `OPENAI_API_KEY` set:
   - Generate motivation message
   - Generate reflection prompt
   - Generate weekly brief
   - Verify responses are contextual and appropriate

2. Without `OPENAI_API_KEY` (remove from env):
   - Same tests should return fallback messages
   - App should continue functioning
   - No crashes or errors

3. Test AI Toggles:
   - Disable AI features in `/parent/settings`
   - Verify AI endpoints return fallbacks
   - Re-enable and verify AI resumes

### 6. Performance Testing

**Test Leaderboard Caching:**

```javascript
// Check Redis cache hit
// Load /kid/friends leaderboard twice
// Second load should be faster (cached)
```

**Test Weekly Summary Generation:**

```bash
# Trigger weekly summary endpoint
curl -X POST https://your-app.vercel.app/api/email/weekly-summary \
  -H "Authorization: Bearer [CRON_SECRET]"

# Verify email sent (check Resend dashboard)
# Verify weekly summary stored in database
```

### 7. Mobile UX Testing

**Test on Real Devices:**

iOS Safari:
- [ ] PWA installability (Add to Home Screen)
- [ ] Tap targets ≥44x44px
- [ ] Haptic feedback works (vibration)
- [ ] Animations smooth (60fps)
- [ ] Text readable without zoom
- [ ] Forms work correctly

Android Chrome:
- [ ] PWA installability
- [ ] Tap targets ≥44x44px
- [ ] Haptic feedback works
- [ ] Animations smooth
- [ ] Text readable without zoom
- [ ] Forms work correctly

### 8. Edge Cases & Error Handling

**Test Edge Cases:**

1. **Expired Invite Code:**
   - Create invite code
   - Wait 4+ hours or use code once
   - Attempt to use again
   - Should show "Invalid or expired code"

2. **Duplicate Friend Request:**
   - Send friend request
   - Attempt to send same request again
   - Should show "Already pending or friends"

3. **Quest Already Submitted:**
   - Submit quest
   - Attempt to submit again
   - Should show "Already submitted"

4. **Insufficient Points for Reward:**
   - Child with 10 points requests 50-point reward
   - Should show available vs aspirational clearly
   - Request should still work (parent approval required)

5. **Network Offline:**
   - Turn off network
   - Navigate app
   - Should show friendly offline message
   - No crashes

### 9. Legal Compliance

**COPPA/GDPR Compliance Check:**

- [ ] Privacy Policy exists at `/legal/privacy`
- [ ] Terms of Service exists at `/legal/terms`
- [ ] Parental consent captured during onboarding
- [ ] No child PII stored beyond nickname/avatar/age band
- [ ] Reflection text not persisted verbatim
- [ ] AI prompts exclude PII
- [ ] Parent can delete household data

### 10. Production Readiness

**Environment Variables Verification:**

```bash
# Check all required env vars are set in Vercel
vercel env ls

# Required variables:
# NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
# CLERK_SECRET_KEY
# NEXT_PUBLIC_SUPABASE_URL
# SUPABASE_ANON_KEY
# POSTGRES_URL
# KV_URL
# KV_REST_API_TOKEN
# OPENAI_API_KEY (optional, has fallbacks)
# MAGICBELL_API_KEY
# MAGICBELL_API_SECRET
# RESEND_API_KEY
# BLOB_READ_WRITE_TOKEN
# CRON_SECRET
```

**Vercel Cron Configuration:**

```json
// Verify vercel.json exists with cron
{
  "crons": [{
    "path": "/api/email/weekly-summary",
    "schedule": "0 19 * * 0"
  }]
}
```

### 11. Accessibility Testing

**WCAG 2.1 AA Compliance:**

- [ ] All images have alt text
- [ ] Color contrast ≥4.5:1 for text
- [ ] Keyboard navigation works
- [ ] Screen reader tested (VoiceOver/TalkBack)
- [ ] Form labels properly associated
- [ ] Error messages clear and helpful

## Test Sign-Off

Before launching to production, confirm:

- [ ] All SQL scripts executed successfully
- [ ] RLS policies prevent cross-household access (verified)
- [ ] End-to-end flows work for parent and child
- [ ] Rate limiting active and prevents abuse
- [ ] AI endpoints have fallbacks and work with/without OpenAI key
- [ ] Mobile UX tested on iOS and Android devices
- [ ] Legal pages contain actual terms (not placeholders)
- [ ] Weekly summary cron job configured
- [ ] All environment variables set in production
- [ ] No console errors or warnings in production build
- [ ] Performance acceptable (page loads <3s on 3G)

**Sign-off Date:** ___________  
**Tester Name:** ___________  
**Deployment Approved:** [ ] Yes [ ] No
