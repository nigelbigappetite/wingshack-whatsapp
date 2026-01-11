# Simplification Plan - Build Incrementally

## Current Problem
Too many features added at once, causing TypeScript errors and build failures. Need to simplify to a working core, then add features one by one.

## Phase 1: Core Working Features (KEEP)
These are essential and must work:

### ✅ Keep These:
1. **Basic Messaging**
   - Inbound webhook handler (simplified - no automation)
   - Outbound message sending
   - Thread list display
   - Message view
   - Reply form

2. **Database Tables**
   - `contacts`
   - `threads` (basic fields only)
   - `messages` (basic fields only)
   - `outbox_jobs`

3. **UI Components**
   - `ThreadsList`
   - `MessagesList`
   - `ReplyForm`
   - Basic inbox page

## Phase 2: Temporarily Disable (COMMENT OUT)
These can be added back later:

1. **Automation Rules** - Comment out rule evaluation in webhook
2. **SLA Tracking** - Comment out SLA badge and fields
3. **Channels** - Set channel_id to null for now
4. **Analytics** - Disable analytics page
5. **Templates** - Remove template picker from reply form
6. **Notes & Tags** - Remove from UI
7. **Media Attachments** - Simplify to text only for now
8. **Search & Filters** - Remove from UI temporarily

## Implementation Steps

### Step 1: Simplify Inbound Webhook
- Remove automation rule evaluation
- Remove SLA calculations
- Simplify to basic contact/thread/message creation
- Remove channel logic (set to null)

### Step 2: Simplify Reply Form
- Remove template picker
- Remove attachment upload
- Keep only text input

### Step 3: Simplify Inbox Page
- Remove search
- Remove filters
- Remove notes/tags components
- Remove SLA badge
- Keep only thread list and message view

### Step 4: Verify Build
- Ensure TypeScript compiles
- Ensure build succeeds
- Test basic messaging flow

## Phase 3: Add Features Back One by One

Once core is working, add features incrementally:

1. **Media Support** (Phase 3.1)
   - Add media fields to interface
   - Add attachment upload
   - Test thoroughly

2. **Search** (Phase 3.2)
   - Add search API
   - Add search UI
   - Test thoroughly

3. **Templates** (Phase 3.3)
   - Add templates table
   - Add template picker
   - Test thoroughly

4. **Notes & Tags** (Phase 3.4)
   - Add notes UI
   - Add tags UI
   - Test thoroughly

5. **Channels** (Phase 3.5)
   - Add channel support
   - Add channel selector
   - Test thoroughly

6. **Automation** (Phase 3.6)
   - Add rules engine
   - Add rule evaluation
   - Test thoroughly

7. **SLA** (Phase 3.7)
   - Add SLA tracking
   - Add SLA badge
   - Test thoroughly

8. **Analytics** (Phase 3.8)
   - Add analytics views
   - Add analytics page
   - Test thoroughly

## Next Steps

1. Create simplified version of webhook handler
2. Create simplified version of inbox page
3. Remove/comment out complex features
4. Test build
5. Deploy working version
6. Add features back one at a time

