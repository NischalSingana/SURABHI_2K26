# Virtual Participation Feature Implementation

## Overview
Implemented virtual registration feature allowing eligible students to participate remotely in competitions at a reduced fee of ₹150 instead of ₹350 for physical participation.

## Eligibility Criteria
Virtual participation is available ONLY for:
- ✅ Google OAuth users (other college students)
- ✅ Students from states OTHER than Andhra Pradesh and Telangana
- ❌ NOT available for KL University students
- ❌ NOT available for International students (they have separate pricing)

## Key Features

### 1. Database Schema Updates
- Added `virtualEnabled` field to `Event` model
- Added `isVirtual` field to `IndividualRegistration` model
- Added `isVirtual` field to `GroupRegistration` model
- Created indexes for better query performance

### 2. Admin Controls
- Added "Virtual Participation" toggle in event management
- Admins can enable/disable virtual participation per event
- Shows purple "Virtual Enabled" badge on events with virtual participation

### 3. Registration Process
- Displays participation mode selection (Physical/Virtual) for eligible users
- Shows fee comparison: ₹350 (Physical) vs ₹150 (Virtual)
- Displays virtual benefits:
  - Proctored online competition room
  - Eligible for cash prizes
  - Participation certificate provided
  - Save on travel & accommodation costs

### 4. Payment Logic
- Automatically calculates correct fees based on participation mode
- KL University students: Free (physical only)
- International students: Free (separate registration)
- Other college students (AP/Telangana): ₹350 (physical only)
- Other college students (other states): ₹350 (physical) or ₹150 (virtual)

## Files Modified

### Backend
- `/prisma/schema.prisma` - Added virtual fields
- `/actions/events.action.ts` - Updated registration functions
- `/lib/constants.ts` - Added fee constants and excluded states
- `/lib/virtual-eligibility.ts` - NEW: Eligibility check utilities

### Frontend
- `/app/admin/competitions/page.tsx` - Added virtual badge display
- `/components/ui/MultiStepEventForm.tsx` - Added virtual toggle
- `/app/competitions/[category]/[slug]/register/page.tsx` - Added virtual UI

## Database Migration

Run this SQL on your production database:

```sql
-- Add virtualEnabled to Event table
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "virtualEnabled" BOOLEAN NOT NULL DEFAULT false;

-- Add isVirtual to IndividualRegistration table
ALTER TABLE "IndividualRegistration" ADD COLUMN IF NOT EXISTS "isVirtual" BOOLEAN NOT NULL DEFAULT false;

-- Add isVirtual to GroupRegistration table  
ALTER TABLE "GroupRegistration" ADD COLUMN IF NOT EXISTS "isVirtual" BOOLEAN NOT NULL DEFAULT false;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "IndividualRegistration_isVirtual_idx" ON "IndividualRegistration"("isVirtual");
CREATE INDEX IF NOT EXISTS "GroupRegistration_isVirtual_idx" ON "GroupRegistration"("isVirtual");
```

## Constants

```typescript
REGISTRATION_FEES = {
    PHYSICAL: 350,  // Physical participation at KL University
    VIRTUAL: 150,   // Virtual participation (proctored online)
}

VIRTUAL_EXCLUDED_STATES = ["Andhra Pradesh", "Telangana"]
```

## Usage

### For Admins
1. Go to Admin > Competitions
2. Create/Edit an event
3. Toggle "Virtual Participation" to enable virtual option
4. Event will show "Virtual Enabled" badge

### For Students
1. Register for an event with virtual enabled
2. If eligible, see "Participation Mode" section
3. Choose Physical (₹350) or Virtual (₹150)
4. Complete payment and registration
5. Virtual participants will receive proctored room details

## Testing Checklist
- [ ] Virtual toggle works in admin panel
- [ ] Eligibility check works correctly
- [ ] Fee calculation is accurate
- [ ] Registration saves isVirtual correctly
- [ ] KL students cannot access virtual
- [ ] International students cannot access virtual
- [ ] AP/Telangana students cannot access virtual
- [ ] Other state students see virtual option
- [ ] Payment amount matches selected mode

## Future Enhancements
- Add virtual participation analytics
- Send different confirmation emails for virtual vs physical
- Add virtual room links/instructions system
- Track virtual vs physical attendance separately
