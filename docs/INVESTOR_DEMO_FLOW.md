# KidFun Investor Demo Flow
## The One Crisp Loop: Discovery → Save → Plan → Coordinate → Day-of

**Target:** 5-minute hands-on demo on iPhone  
**Competitor Benchmark:** Airbnb, ClassWallet (swipe-friendly, gesture-driven, instant feedback)

---

## Overview Diagram

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  DISCOVER   │ ──▶ │    SAVE     │ ──▶ │   PLAN      │ ──▶ │ COORDINATE  │ ──▶ │   DAY-OF    │
│             │     │             │     │             │     │             │     │             │
│ "Find soccer│     │ Tap heart   │     │ Tap "Plan"  │     │ Propose time│     │ View what's │
│  near me"   │     │ to save     │     │ invite pals │     │ RSVP going  │     │ happening   │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

---

## Screen 1: Discovery (Home / Search)

### Current Implementation
- **Route:** `/` (Index.tsx)
- **Components:** `ConversationalSearch`, `AIResultCard`, `AIResultModal`, `LocationMap`

### What User Sees
```
┌────────────────────────────────────────┐
│ [Hero Image - Kids Soccer]             │
│                                        │
│    Your family's activity network      │
│                                        │
│ ┌────────────────────────────────────┐ │
│ │ ⚽ What are you looking for?       │ │
│ ├────────────────────────────────────┤ │
│ │ 📍 Where (Austin, TX)              │ │
│ ├────────────────────────────────────┤ │
│ │ 📅 When (optional)                 │ │
│ └────────────────────────────────────┘ │
│                          [🔍 Search]   │
└────────────────────────────────────────┘
```

### Data Displayed
| Field | Source | Notes |
|-------|--------|-------|
| Activity query | User input | "Soccer for 6 year olds" |
| Location | Google Places autocomplete | Validated address |
| Date filter | Calendar picker | Optional |

### Key Actions
| Action | Result | Animation/Feedback |
|--------|--------|-------------------|
| Type query | Placeholder animates with emojis | ⚽🎨🎭 cycling |
| Enter location | Autocomplete dropdown | Smooth popover |
| Tap Search | Skeleton cards → results | Scroll to results |

### Results View
```
┌────────────────────────────────────────┐
│ Search Results (12 found)    [Clear]   │
│                                        │
│ ┌──────────────────┐ ┌──────────────┐  │
│ │ 📍 List View     │ │ 🗺️ Map View │  │
│ └──────────────────┘ └──────────────┘  │
│                                        │
│ ┌────────────────────────────────────┐ │
│ │ ⭐ ABC Soccer Academy              │ │
│ │ 4.8 ★ (156 reviews) • 2.3 mi      │ │
│ │ "Great for beginners, ages 4-12"   │ │
│ │                    [💾] [Share]    │ │
│ └────────────────────────────────────┘ │
│                                        │
│ ┌────────────────────────────────────┐ │
│ │ XYZ Sports Center         ✨ New   │ │
│ │ 4.5 ★ (89 reviews) • 3.1 mi       │ │
│ │ "Indoor facility, year-round"      │ │
│ └────────────────────────────────────┘ │
└────────────────────────────────────────┘
```

### Demo Script
> "Watch this - I just type 'soccer for my 6 year old' and our AI finds real providers near me, ranked by relevance. See how it explains WHY each one is a good match."

---

## Screen 2: Save Activity (Result Modal)

### Current Implementation
- **Component:** `AIResultModal.tsx`
- **Data:** `useSavedActivities` hook → `saved_activities` table

### What User Sees (Bottom Sheet on Mobile)
```
┌────────────────────────────────────────┐
│                              [X Close] │
│ ABC Soccer Academy           ✨ New    │
│                                        │
│ 📍 123 Main St, Austin TX              │
│ ⭐ 4.8 (156 reviews) • 92% match      │
│                                        │
│ "This academy specializes in youth     │
│ soccer with age-appropriate coaching   │
│ for beginners..."                      │
│                                        │
│ ┌──────────────────────────────────┐   │
│ │ 💡 Why it's a match              │   │
│ │ "Based on your search for 6yr    │   │
│ │  old beginners, this provider..."│   │
│ └──────────────────────────────────┘   │
│                                        │
│ [🗺️ Map showing location]             │
│                                        │
│ ┌─────────────┐ ┌─────────────────┐    │
│ │ 💾 Save     │ │ 📤 Share        │    │
│ └─────────────┘ └─────────────────┘    │
│                                        │
│ ┌────────────────────────────────────┐ │
│ │ 🌐 Visit Website                   │ │
│ └────────────────────────────────────┘ │
│ ┌────────────────────────────────────┐ │
│ │ 📍 Get Directions    📞 Call       │ │
│ └────────────────────────────────────┘ │
└────────────────────────────────────────┘
```

### Data Saved to `saved_activities`
| Column | Value | Notes |
|--------|-------|-------|
| `user_id` | Current user UUID | |
| `provider_id` | UUID or null | Only if in our DB |
| `provider_name` | "ABC Soccer Academy" | Always stored |
| `provider_url` | "https://..." | For later reference |
| `activity_name` | null | Optional |
| `status` | "saved" | Default |

### Key Actions
| Action | Result | Animation/Feedback |
|--------|--------|-------------------|
| Tap Save | Icon changes to checkmark | `BookmarkCheck` icon, toast |
| Tap Share | Share dialog opens | Select connections |
| Tap Website | Opens in browser | UTM params added |

### Demo Script
> "I can save this for later, or tap Share to instantly send it to another parent. One tap - it's in my list."

---

## Screen 3: Create Plan (Dashboard → Saved → Plan Button)

### Current Implementation
- **Route:** `/dashboard`
- **Components:** `SavedActivitiesSection`, `CreateThreadDialog`
- **Data:** Creates `coordination_threads` + `thread_participants`

### Entry Points (3 ways to start a plan)
1. **From Saved Activity** - Tap 📅 icon on saved activity card
2. **From Dashboard** - "Create Plan" button in Coordination Feed
3. **From Result Modal** - (MISSING) - Should add "Plan with Friends" button

### What User Sees
```
┌────────────────────────────────────────┐
│            Create a Plan               │
│ Start coordinating with your           │
│ connections                            │
│────────────────────────────────────────│
│                                        │
│ Activity Name *                        │
│ ┌────────────────────────────────────┐ │
│ │ Soccer at ABC Academy              │ │ ← Pre-filled
│ └────────────────────────────────────┘ │
│                                        │
│ Venue / Provider                       │
│ ┌────────────────────────────────────┐ │
│ │ ABC Soccer Academy                 │ │ ← Pre-filled
│ └────────────────────────────────────┘ │
│                                        │
│ 👥 Invite Connections                  │
│ ┌────────────────────────────────────┐ │
│ │ [✓] Sarah M.         [Avatar]     │ │
│ │ [ ] John D.          [Avatar]     │ │
│ │ [ ] Lisa K.          [Avatar]     │ │
│ └────────────────────────────────────┘ │
│ 2 selected                             │
│                                        │
│ 🕐 Propose a Time (optional)           │
│ ┌────────────────┐ ┌──────────┐        │
│ │ Sat, Jan 18    │ │ 10:00 AM │        │
│ └────────────────┘ └──────────┘        │
│                                        │
│ Notes                                  │
│ ┌────────────────────────────────────┐ │
│ │ Let's try their intro class!      │ │
│ └────────────────────────────────────┘ │
│                                        │
│   [Cancel]              [Create Plan]  │
└────────────────────────────────────────┘
```

### Data Created

**coordination_threads:**
| Column | Value |
|--------|-------|
| `activity_name` | "Soccer at ABC Academy" |
| `provider_name` | "ABC Soccer Academy" |
| `provider_url` | "https://..." |
| `created_by` | Current user UUID |
| `status` | "proposing" (if date) or "idea" |

**thread_participants:**
| Column | Value |
|--------|-------|
| `thread_id` | New thread UUID |
| `user_id` | Each invited user + creator |
| `role` | "organizer" / "invited" |
| `rsvp_status` | "pending" |

**thread_time_proposals:** (if date provided)
| Column | Value |
|--------|-------|
| `thread_id` | Thread UUID |
| `proposed_date` | "2025-01-18T10:00:00Z" |
| `proposed_by` | Current user |
| `status` | "proposed" |

### Demo Script
> "Now watch the magic. I tap 'Create Plan', it pre-fills from my saved activity. I pick the parents I want to invite - these are parents from my kid's school. Propose a time, and boom - they get notified."

---

## Screen 4: Coordinate & Confirm (Coordination Feed)

### Current Implementation
- **Route:** `/dashboard` (Coordination Feed section)
- **Components:** `CoordinationFeed`, `ThreadCard`, `ProposeTimeDialog`, `ThreadRsvpButtons`

### What Invitee Sees (Notification → Dashboard)
```
┌────────────────────────────────────────┐
│ ⚡ Needs Your Response (1)             │
│────────────────────────────────────────│
│ ┌────────────────────────────────────┐ │
│ │ 🟡 Choosing Time                   │ │
│ │ Soccer at ABC Academy              │ │
│ │ ABC Soccer Academy                 │ │
│ │                                    │ │
│ │ 🕐 1 time proposed                 │ │
│ │ 👥 2 going, 0 maybe                │ │
│ │                                    │ │
│ │ Sarah invited you • 2 min ago      │ │
│ │                                    │ │
│ │        [▼ View proposed time]      │ │
│ └────────────────────────────────────┘ │
└────────────────────────────────────────┘
```

### Expanded Thread View
```
┌────────────────────────────────────────┐
│ ┌────────────────────────────────────┐ │
│ │ Proposed Times                     │ │
│ │                                    │ │
│ │ Sat, Jan 18 • 10:00 AM            │ │
│ │ proposed by Sarah M.               │ │
│ │ "Let's try their intro class!"     │ │
│ │                                    │ │
│ │ [✓ Accept This Time]               │ │ ← Only organizer sees
│ ├────────────────────────────────────┤ │
│ │ [🕐 Propose a different time]      │ │
│ └────────────────────────────────────┘ │
└────────────────────────────────────────┘
```

### After Time Accepted (Scheduled State)
```
┌────────────────────────────────────────┐
│ 📅 Scheduled                           │
│────────────────────────────────────────│
│ ┌─────────────────────────────────┐    │
│ │ 🟢 Scheduled                     │   │
│ │ Soccer at ABC Academy            │   │
│ │                                  │   │
│ │ 📅 Sat, Jan 18 • 10:00 AM       │   │
│ │ 📍 123 Main St, Austin           │   │
│ │ 👥 3 going                       │   │
│ │                                  │   │
│ │ ┌──────┐ ┌──────┐ ┌──────┐      │   │
│ │ │ ✓    │ │ ?    │ │ ✗    │      │   │
│ │ │Going │ │Maybe │ │Can't │      │   │
│ │ └──────┘ └──────┘ └──────┘      │   │
│ └─────────────────────────────────┘    │
└────────────────────────────────────────┘
```

### Key Actions
| Action | Result | Animation |
|--------|--------|-----------|
| Tap "View proposed times" | Expands card | Slide down |
| Tap "Accept This Time" | Thread → "scheduled" | Status badge turns green |
| Tap RSVP button | Updates participation | Button highlight |

### Demo Script
> "Sarah gets a notification - she sees my proposed time. She can accept it, or propose a different time. Once we agree, everyone gets the confirmed event. Simple RSVP - going, maybe, can't make it."

---

## Screen 5: Day-of View (Scheduled Tab)

### Current Implementation
- **Route:** `/dashboard` → Coordination Feed → "Scheduled" tab
- **Component:** `CoordinationFeed` with `ThreadCard`

### What User Sees
```
┌────────────────────────────────────────┐
│ [Planning] [Needs Response] [SCHEDULED]│
│────────────────────────────────────────│
│                                        │
│ 📆 Today                               │
│ ┌────────────────────────────────────┐ │
│ │ 🟢│ Soccer at ABC Academy          │ │
│ │   │ 10:00 AM • 123 Main St         │ │
│ │   │                                │ │
│ │   │ 👥 Sarah M, John D (3 going)   │ │
│ │   │                                │ │
│ │   │ [📍 Directions] [📞 Call]      │ │
│ └────┴───────────────────────────────┘ │
│                                        │
│ 📆 Next Week                           │
│ ┌────────────────────────────────────┐ │
│ │ 🟢│ Art Class at Creative Kids     │ │
│ │   │ Wed, Jan 22 • 3:00 PM          │ │
│ │   │ 👥 2 going, 1 maybe            │ │
│ └────┴───────────────────────────────┘ │
└────────────────────────────────────────┘
```

### MISSING: Day-of Enhancements Needed
| Feature | Status | Priority |
|---------|--------|----------|
| "Today" grouping | ❌ Missing | HIGH |
| Quick-action buttons (Directions, Call) | ❌ Missing | HIGH |
| Push notifications | ❌ Missing | MEDIUM |
| Calendar sync (.ics export) | ❌ Missing | MEDIUM |

### Demo Script
> "On the day of, I see exactly what's coming up. One tap to get directions, one tap to call if I'm running late. The other parents see the same thing - we're all synced."

---

## Gap Analysis: What's Working vs What Needs Work

### ✅ Working Well
| Feature | Component | Notes |
|---------|-----------|-------|
| AI-powered search | `ConversationalSearch` | Good results, caching works |
| Save to list | `useSavedActivities` | Persists correctly |
| Create thread | `CreateThreadDialog` | Pre-fill from saved works |
| Invite connections | `useSocialConnections` | Shows accepted connections |
| Propose times | `ProposeTimeDialog` | Creates proposals |
| Accept proposals | `ThreadProposals` | Updates thread status |
| RSVP | `ThreadRsvpButtons` | Updates participant status |

### ⚠️ Needs Improvement (UX Polish)
| Issue | Current State | Target State |
|-------|---------------|--------------|
| Result card → Plan | Must save first, go to dashboard | One-tap "Plan with Friends" in modal |
| Thread card density | Too much text, not swipeable | Card-based, swipe to RSVP |
| Scheduled view | Basic list | Grouped by date, quick actions |
| Tab default logic | Complex logic | Smart: today's events first |
| Mobile navigation | Web-style tabs | Bottom nav with badge counts |

### ❌ Missing for Demo
| Feature | Priority | Effort | Notes |
|---------|----------|--------|-------|
| Push notifications | HIGH | Medium | Need Expo for native |
| Bottom sheet navigation | HIGH | Medium | React Native pattern |
| Swipe gestures | HIGH | Medium | framer-motion or native |
| "Plan" button in result modal | MEDIUM | Low | Easy add |
| Day-of quick actions | MEDIUM | Low | Directions, call buttons |
| Badge counts on tabs | LOW | Low | Unread count |

---

## Recommended Next Steps

### If staying in Lovable (1 week):
1. Add "Plan with Friends" button to `AIResultModal`
2. Improve `ThreadCard` with better mobile layout
3. Add Today/Upcoming grouping to Scheduled tab
4. Add quick-action buttons (directions, call)
5. Polish animations with framer-motion

### If exporting to React Native (2 weeks):
1. Export GitHub repo
2. Set up Expo with Supabase client (same backend)
3. Rebuild screens using React Native Paper or NativeBase
4. Add true native gestures and push notifications
5. Use this spec as the design reference

---

## Database Schema Reference

```sql
-- The core coordination tables
coordination_threads
├── id, activity_name, provider_name, provider_url
├── created_by, status (idea/proposing/scheduled/completed/cancelled)
├── scheduled_date, location, notes

thread_participants
├── thread_id, user_id, role (organizer/invited)
├── rsvp_status (pending/going/maybe/declined)
├── children_bringing[]

thread_time_proposals
├── thread_id, proposed_by, proposed_date
├── status (proposed/accepted/withdrawn), notes

thread_events (activity log)
├── thread_id, user_id, event_type, payload

saved_activities
├── user_id, provider_id, provider_name, provider_url
├── activity_name, status, scheduled_date, notes
```

---

## Demo Day Checklist

- [ ] 2+ test accounts with mutual connections
- [ ] Pre-saved activity in one account
- [ ] Fresh search ready to go
- [ ] Airplane mode tested (shows cached results)
- [ ] Phone fully charged, Do Not Disturb on
- [ ] Know the 5-step script cold

---

*Last updated: January 2025*
*Version: 1.0*
