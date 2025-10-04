# BerthCare Navigation Structure Diagram

## Visual Navigation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      AppNavigator (Stack)                       │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  Authentication Check                     │  │
│  │              (Redux: state.auth.isAuthenticated)          │  │
│  └────────────────────┬─────────────────┬───────────────────┘  │
│                       │                 │                       │
│              ┌────────▼────────┐   ┌────▼──────────┐           │
│              │ Unauthenticated │   │ Authenticated │           │
│              └────────┬────────┘   └────┬──────────┘           │
│                       │                 │                       │
│              ┌────────▼────────┐        │                       │
│              │  LoginScreen    │        │                       │
│              │                 │        │                       │
│              │  • Email/Pass   │        │                       │
│              │  • Biometric    │        │                       │
│              │  • Remember Me  │        │                       │
│              └─────────────────┘        │                       │
│                                         │                       │
│                       ┌─────────────────▼─────────────────┐     │
│                       │      MainTabs (Bottom Tabs)       │     │
│                       │                                   │     │
│                       │  ┌──────────┐    ┌──────────┐    │     │
│                       │  │ Schedule │    │   Home   │    │     │
│                       │  │   Tab    │    │   Tab    │    │     │
│                       │  └────┬─────┘    └────┬─────┘    │     │
│                       │       │               │          │     │
│                       │  ┌────▼─────┐    ┌────▼─────┐    │     │
│                       │  │ Schedule │    │   Home   │    │     │
│                       │  │  Screen  │    │  Screen  │    │     │
│                       │  │          │    │          │    │     │
│                       │  │ • Visits │    │ • Stats  │    │     │
│                       │  │ • List   │    │ • Quick  │    │     │
│                       │  │ • Cards  │    │   Actions│    │     │
│                       │  └──────────┘    └──────────┘    │     │
│                       └───────────────────────────────────┘     │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Modal Screens                         │  │
│  │                                                          │  │
│  │  ┌─────────────────┐  ┌──────────────────┐             │  │
│  │  │ PatientProfile  │  │ VisitDocumentation│             │  │
│  │  │                 │  │                  │             │  │
│  │  │ • Demographics  │  │ • Vital Signs    │             │  │
│  │  │ • Medical Info  │  │ • Activities     │             │  │
│  │  │ • Medications   │  │ • Notes          │             │  │
│  │  │ • Allergies     │  │ • Photos         │             │  │
│  │  └─────────────────┘  └────────┬─────────┘             │  │
│  │                                │                        │  │
│  │                       ┌────────▼─────────┐              │  │
│  │                       │  Review Screen   │              │  │
│  │                       │                  │              │  │
│  │                       │ • Summary        │              │  │
│  │                       │ • Edit/Submit    │              │  │
│  │                       │ • Confirmation   │              │  │
│  │                       └──────────────────┘              │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Navigation Paths

### Primary User Flows

#### 1. Visit Documentation Flow
```
┌──────────┐     ┌──────────────────┐     ┌────────┐     ┌──────────┐
│ Schedule │────▶│ VisitDocumentation│────▶│ Review │────▶│ Schedule │
│  Screen  │     │      Screen       │     │ Screen │     │  Screen  │
└──────────┘     └──────────────────┘     └────────┘     └──────────┘
   [Tap]              [Document]           [Submit]        [Success]
   Visit              Visit Details        & Confirm       Return
```

#### 2. Patient Information Flow
```
┌──────────┐     ┌──────────────┐     ┌──────────┐
│   Home   │────▶│   Patient    │────▶│   Home   │
│  Screen  │     │   Profile    │     │  Screen  │
└──────────┘     └──────────────┘     └──────────┘
   [Tap]            [View Info]          [Back]
   Button           Patient Details      Return
```

#### 3. Tab Navigation Flow
```
┌──────────┐                    ┌──────────┐
│ Schedule │◀──────────────────▶│   Home   │
│  Screen  │    [Tap Tab]       │  Screen  │
└──────────┘                    └──────────┘
```

### Deep Link Flows

#### Visit Deep Link
```
Push Notification
       │
       ▼
berthcare://visit/123/document
       │
       ▼
VisitDocumentation Screen
(visitId: "123")
```

#### Patient Deep Link
```
SMS/Email Link
       │
       ▼
https://app.berthcare.com/patient/456
       │
       ▼
PatientProfile Screen
(patientId: "456")
```

## Screen Hierarchy

```
AppNavigator (Root)
│
├─ Login (Unauthenticated)
│
└─ MainTabs (Authenticated)
   │
   ├─ Schedule Tab
   │  └─ ScheduleScreen
   │
   └─ Home Tab
      └─ HomeScreen
│
├─ PatientProfile (Modal)
│
├─ VisitDocumentation (Modal)
│
└─ Review (Modal)
```

## Component Integration

```
┌─────────────────────────────────────────┐
│              Screen Layout              │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │         Header Component          │  │
│  │  • Title                          │  │
│  │  • Back Button (optional)         │  │
│  │  • Right Action (optional)        │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │                                   │  │
│  │        Screen Content             │  │
│  │                                   │  │
│  │  • Cards                          │  │
│  │  • Inputs                         │  │
│  │  • Buttons                        │  │
│  │  • Lists                          │  │
│  │                                   │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │      Bottom Tab Bar (if tabs)     │  │
│  │  [Schedule] [Home]                │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## State Management Integration

```
┌─────────────────────────────────────────┐
│           Redux Store                   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  auth: {                        │   │
│  │    isAuthenticated: boolean     │───┼──▶ Controls Navigation
│  │    user: User | null            │   │    (Login vs MainTabs)
│  │  }                              │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  visits: {                      │   │
│  │    list: Visit[]                │───┼──▶ Schedule Screen Data
│  │    current: Visit | null        │   │
│  │  }                              │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  sync: {                        │   │
│  │    status: 'synced' | 'pending' │───┼──▶ Offline Indicator
│  │    lastSync: Date               │   │
│  │  }                              │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

## Animation Flow

```
Screen Transitions:

Push (Forward):
┌────────┐           ┌────────┐
│ Screen │  ────────▶│ Screen │
│   A    │  Slide    │   B    │
└────────┘  Right    └────────┘

Pop (Back):
┌────────┐           ┌────────┐
│ Screen │◀──────────│ Screen │
│   A    │  Slide    │   B    │
└────────┘  Left     └────────┘

Tab Switch:
┌────────┐           ┌────────┐
│  Tab   │◀────────▶│  Tab   │
│   A    │   Fade    │   B    │
└────────┘           └────────┘
```

## Error Handling Flow

```
Navigation Error
       │
       ▼
┌──────────────┐
│ Error Check  │
└──────┬───────┘
       │
       ├─ Invalid Route ──▶ Fallback to Home
       │
       ├─ Missing Params ──▶ Show Error Alert
       │
       └─ Auth Required ──▶ Redirect to Login
```

## Deep Link Resolution

```
Incoming URL
       │
       ▼
┌──────────────────┐
│  Parse URL       │
│  Extract Params  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Check Auth      │
└────────┬─────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
Authenticated  Not Auth
    │         │
    │         └──▶ Store Deep Link
    │              Navigate to Login
    │              After Login: Resume
    │
    ▼
Navigate to Target Screen
with Parameters
```

---

## Legend

```
┌─────┐
│ Box │  = Screen or Component
└─────┘

  ───▶   = Navigation Flow

  ◀───▶  = Bidirectional Navigation

  [Text] = User Action

  • Item = Feature or Content
```

---

This diagram provides a visual reference for understanding the complete navigation structure of the BerthCare mobile application.
