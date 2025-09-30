# Screen States and Wireframe Specifications - Mobile Documentation

## Screen 1: Authentication & Login

### Default State
```
┌─────────────────────────────────────┐
│  Status Bar (9:41 AM, 100%, WiFi)   │
├─────────────────────────────────────┤
│                                     │
│           [BerthCare Logo]          │
│          Welcome Back               │
│                                     │
│    ┌─────────────────────────────┐  │
│    │  🔒 Login with Touch ID     │  │
│    └─────────────────────────────┘  │
│                                     │
│           or use password           │
│                                     │
│    ┌─────────────────────────────┐  │
│    │  Username                   │  │
│    └─────────────────────────────┘  │
│    ┌─────────────────────────────┐  │
│    │  Password                   │  │
│    └─────────────────────────────┘  │
│                                     │
│    ☐ Remember this device           │
│                                     │
│    ┌─────────────────────────────┐  │
│    │         Sign In             │  │
│    └─────────────────────────────┘  │
│                                     │
│         Forgot password?            │
│                                     │
│      Emergency: 1-800-xxx-xxxx      │
└─────────────────────────────────────┘
```

### Loading State (Biometric Authentication)
```
┌─────────────────────────────────────┐
│  Status Bar (9:41 AM, 100%, WiFi)   │
├─────────────────────────────────────┤
│                                     │
│           [BerthCare Logo]          │
│                                     │
│              [Spinner]              │
│         Verifying identity...       │
│                                     │
│    ┌─────────────────────────────┐  │
│    │         Cancel              │  │
│    └─────────────────────────────┘  │
│                                     │
│      Emergency: 1-800-xxx-xxxx      │
└─────────────────────────────────────┘
```

### Error State
```
┌─────────────────────────────────────┐
│  Status Bar (9:41 AM, 100%, WiFi)   │
├─────────────────────────────────────┤
│                                     │
│           [BerthCare Logo]          │
│                                     │
│              [❌ Icon]              │
│        Authentication Failed        │
│     Please try again or use         │
│           your password             │
│                                     │
│    ┌─────────────────────────────┐  │
│    │      Try Touch ID Again     │  │
│    └─────────────────────────────┘  │
│    ┌─────────────────────────────┐  │
│    │       Use Password          │  │
│    └─────────────────────────────┘  │
│                                     │
│      Emergency: 1-800-xxx-xxxx      │
└─────────────────────────────────────┘
```

## Screen 2: Daily Schedule

### Default State - Online
```
┌─────────────────────────────────────┐
│ Today, March 15  🌤️ 18°C  🟢 Online │
├─────────────────────────────────────┤
│  Good morning, Sarah               ⚙️│
│  You have 6 visits today            │
├─────────────────────────────────────┤
│┌───────────────────────────────────┐│
││ 8:30 AM • In Progress             ││
││ Margaret Thompson, 78             ││
││ 📍 2.1 km • 5 min drive           ││
││ Regular Care + Medication         ││
││                    [📞] [🧭]       ││
│└───────────────────────────────────┘│
│┌───────────────────────────────────┐│
││ 10:00 AM • Pending                ││
││ Robert Chen, 65                   ││
││ 📍 4.8 km • 12 min drive          ││
││ Assessment + Physical Therapy     ││
││                    [📞] [🧭]       ││
│└───────────────────────────────────┘│
│┌───────────────────────────────────┐│
││ 11:30 AM • Pending                ││
││ Dorothy Wilson, 82                ││
││ 📍 1.3 km • 4 min drive           ││
││ Wound Care + Medication           ││
││                    [📞] [🧭]       ││
│└───────────────────────────────────┘│
├─────────────────────────────────────┤
│ [🏠] [📋] [👥] [📊] [👤]             │
│ Home  Visits Team Stats Profile     │
└─────────────────────────────────────┘
```

### Offline State
```
┌─────────────────────────────────────┐
│ Today, March 15  🌤️ 18°C  🟠 Offline│
├─────────────────────────────────────┤
│  Working offline                   ⚙️│
│  Data will sync when connected      │
├─────────────────────────────────────┤
│┌───────────────────────────────────┐│
││ 8:30 AM • In Progress  [⏸️ Sync]  ││
││ Margaret Thompson, 78            ││
││ Last synced: 7:45 AM             ││
││ Regular Care + Medication        ││
││                    [📞] [🧭]      ││
│└───────────────────────────────────┘│
│┌───────────────────────────────────┐│
││ 10:00 AM • Pending                ││
││ Robert Chen, 65                   ││
││ 📍 4.8 km • 12 min drive          ││
││ Assessment + Physical Therapy     ││
││                    [📞] [🧭]       ││
│└───────────────────────────────────┘│
├─────────────────────────────────────┤
│    [🔄 Try to Connect]              │
├─────────────────────────────────────┤
│ [🏠] [📋] [👥] [📊] [👤]              │
│ Home  Visits Team Stats Profile     │
└─────────────────────────────────────┘
```

### Pull-to-Refresh State
```
┌─────────────────────────────────────┐
│ Today, March 15  🌤️ 18°C  🟢 Online│
├─────────────────────────────────────┤
│           [🔄 Spinner]              │
│         Updating schedule...         │
│                                     │
│┌───────────────────────────────────┐│
││ 8:30 AM • In Progress            ││
││ Margaret Thompson, 78            ││
││ 📍 2.1 km • 5 min drive          ││
││ Regular Care + Medication        ││
││                    [📞] [🧭]      ││
│└───────────────────────────────────┘│
└─────────────────────────────────────┘
```

## Screen 3: Patient Profile

### Default State - Overview Tab
```
┌─────────────────────────────────────┐
│  ← Margaret Thompson            ⋯   │
├─────────────────────────────────────┤
│  [Photo] Margaret Thompson, 78      │
│         Diabetes, Hypertension      │
│         Next: Regular Care          │
├─────────────────────────────────────┤
│ Overview | Care Plan | History | 📞  │
├─────────────────────────────────────┤
│ 🏥 Key Medical Information           │
│                                     │
│ Primary Conditions:                 │
│ • Type 2 Diabetes (HbA1c: 7.2%)    │
│ • Essential Hypertension            │
│ • Chronic Kidney Disease Stage 3    │
│                                     │
│ Current Medications:                │
│ • Metformin 500mg BID               │
│ • Lisinopril 10mg Daily             │
│ • Insulin Lantus 20u Evening        │
│                                     │
│ ⚠️ Allergies:                       │
│ • Penicillin (rash)                 │
│ • Sulfa drugs (GI upset)            │
│                                     │
│ 📋 Last Visit (March 12):           │
│ • Vitals stable                     │
│ • Blood glucose 142 mg/dL           │
│ • Medication compliance good        │
│ • Minor skin tear on left arm      │
├─────────────────────────────────────┤
│ [📞 Call] [💬 Message] [🧭 Navigate]  │
│                                     │
│    ┌─────────────────────────────┐  │
│    │       Start Visit           │  │
│    └─────────────────────────────┘  │
└─────────────────────────────────────┘
```

### Care Plan Tab
```
┌─────────────────────────────────────┐
│  ← Margaret Thompson            ⋯   │
├─────────────────────────────────────┤
│  [Photo] Margaret Thompson, 78      │
│         Diabetes, Hypertension      │
│         Next: Regular Care          │
├─────────────────────────────────────┤
│ Overview | Care Plan | History | 📞  │
├─────────────────────────────────────┤
│ 🎯 Current Care Objectives          │
│                                     │
│ Primary Goals:                      │
│ ✅ Maintain HbA1c < 7.5%            │
│ 🔄 Monitor kidney function          │
│ ✅ Prevent diabetic complications    │
│                                     │
│ 💊 Medication Management:           │
│ • Monitor blood glucose trends      │
│ • Assess insulin injection sites    │
│ • Review medication adherence       │
│                                     │
│ 🏃‍♀️ Mobility & Safety:              │
│ • Independent with walker           │
│ • Fall risk: Moderate              │
│ • Vision: Slight impairment         │
│                                     │
│ 👨‍⚕️ Care Team:                      │
│ • Dr. Smith (Primary Care)          │
│ • Nurse Sarah (Home Care)           │
│ • John Thompson (Son, Emergency)    │
├─────────────────────────────────────┤
│    ┌─────────────────────────────┐  │
│    │       Start Visit           │  │
│    └─────────────────────────────┘  │
└─────────────────────────────────────┘
```

## Screen 4: Visit Documentation - Vital Signs Section

### Default State with Smart Pre-population
```
┌─────────────────────────────────────┐
│  ← Visit Documentation        💾 ✅  │
├─────────────────────────────────────┤
│  Margaret Thompson • 8:30 AM Visit  │
│  Progress: ●●○○○ (2 of 5 sections)  │
├─────────────────────────────────────┤
│                                     │
│ 🔄 Vital Signs (from last visit)    │
│                                     │
│ Temperature:                        │
│ ┌─────────────┬─────────────────┐   │
│ │ 98.6 °F     │ [Copy from last]│   │
│ └─────────────┴─────────────────┘   │
│                                     │
│ Blood Pressure:                     │
│ ┌─────────────┬─────────────────┐   │
│ │ 138/82 mmHg │ [Copy from last]│   │
│ └─────────────┴─────────────────┘   │
│                                     │
│ Pulse:                              │
│ ┌─────────────┬─────────────────┐   │
│ │ 76 bpm      │ [Copy from last]│   │
│ └─────────────┴─────────────────┘   │
│                                     │
│ Respirations:                       │
│ ┌─────────────┬─────────────────┐   │
│ │ 18 /min     │ [Copy from last]│   │
│ └─────────────┴─────────────────┘   │
│                                     │
│      [🎤 Voice Input]               │
├─────────────────────────────────────┤
│  [◄ Previous]        [Next ►]      │
└─────────────────────────────────────┘
```

### Active Voice Input State
```
┌─────────────────────────────────────┐
│  ← Visit Documentation        💾 ✅  │
├─────────────────────────────────────┤
│  Margaret Thompson • 8:30 AM Visit  │
│  Progress: ●●○○○ (2 of 5 sections)  │
├─────────────────────────────────────┤
│                                     │
│ 🔄 Vital Signs (from last visit)    │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  🎤 Recording... 00:05          │ │
│ │  "Temperature ninety nine       │ │
│ │   point two degrees"            │ │
│ │                                 │ │
│ │  [🟥 Stop Recording]            │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Temperature:                        │
│ ┌─────────────┬─────────────────┐   │
│ │ 99.2 °F     │      ✓          │   │
│ └─────────────┴─────────────────┘   │
│                                     │
│ Blood Pressure:                     │
│ ┌─────────────┬─────────────────┐   │
│ │ 138/82 mmHg │ [Copy from last]│   │
│ └─────────────┴─────────────────┘   │
├─────────────────────────────────────┤
│  [◄ Previous]        [Next ►]      │
└─────────────────────────────────────┘
```

### Validation Error State
```
┌─────────────────────────────────────┐
│  ← Visit Documentation        💾 ⚠️  │
├─────────────────────────────────────┤
│  Margaret Thompson • 8:30 AM Visit  │
│  Progress: ●●○○○ (2 of 5 sections)  │
├─────────────────────────────────────┤
│                                     │
│ 🔄 Vital Signs (from last visit)    │
│                                     │
│ Temperature: *Required              │
│ ┌─────────────┬─────────────────┐   │
│ │             │ [🔴 Required]   │   │
│ └─────────────┴─────────────────┘   │
│ ⚠️ Please enter temperature         │
│                                     │
│ Blood Pressure: *Required           │
│ ┌─────────────┬─────────────────┐   │
│ │ 200/110     │ ⚠️ High BP      │   │
│ └─────────────┴─────────────────┘   │
│ ⚠️ BP reading unusually high.       │
│    Please double-check and note     │
│    if patient needs immediate care  │
│                                     │
│      [🎤 Voice Input]               │
├─────────────────────────────────────┤
│  [◄ Previous]        [Next ►]      │
└─────────────────────────────────────┘
```

## Screen 5: Review and Submit

### Default Review State
```
┌─────────────────────────────────────┐
│  ← Review Visit             💾 ✅   │
├─────────────────────────────────────┤
│  Margaret Thompson • 8:30 AM Visit  │
│  Ready for submission               │
├─────────────────────────────────────┤
│                                     │
│ ✅ Vital Signs Complete             │
│ • Temperature: 99.2°F               │
│ • BP: 145/88 mmHg                   │
│ • Pulse: 78 bpm                     │
│                                     │
│ ✅ Assessment Complete              │
│ • Skin integrity: Good              │
│ • Mobility: Independent with walker │
│ • Pain level: 2/10                  │
│                                     │
│ ✅ Care Activities Complete         │
│ • Medication review: Done           │
│ • Blood glucose check: 156 mg/dL    │
│ • Insulin injection: Administered   │
│                                     │
│ ✅ Photos Attached (2)              │
│ [📷 Left arm skin tear] [📷 Med list]│
│                                     │
│ 📝 Digital Signature Required       │
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ │      [Signature Pad]            │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│     [Clear] Patient acknowledged     │
├─────────────────────────────────────┤
│    ┌─────────────────────────────┐  │
│    │      Submit Visit           │  │
│    └─────────────────────────────┘  │
└─────────────────────────────────────┘
```

### Submitting State
```
┌─────────────────────────────────────┐
│  ← Review Visit             💾 🔄   │
├─────────────────────────────────────┤
│  Margaret Thompson • 8:30 AM Visit  │
│  Submitting visit data...           │
├─────────────────────────────────────┤
│                                     │
│              [Spinner]              │
│                                     │
│         Uploading visit data        │
│            Photos: 2/2 ✅           │
│         Signature: Saved ✅         │
│         Documentation: ✅           │
│                                     │
│        This may take a moment       │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│    ┌─────────────────────────────┐  │
│    │         Cancel              │  │
│    └─────────────────────────────┘  │
└─────────────────────────────────────┘
```

### Success State
```
┌─────────────────────────────────────┐
│  ← Visit Complete           💾 ✅   │
├─────────────────────────────────────┤
│  Margaret Thompson • 8:30 AM Visit  │
│  Successfully completed             │
├─────────────────────────────────────┤
│                                     │
│              [✅ Icon]              │
│                                     │
│         Visit Completed!            │
│                                     │
│    Your documentation has been      │
│    saved and will be available      │
│    in the patient's record.         │
│                                     │
│    Time saved today: 8 minutes      │
│    Total time: 9 minutes            │
│                                     │
│    Next patient in 15 minutes:      │
│         Robert Chen                 │
│                                     │
│                                     │
│    ┌─────────────────────────────┐  │
│    │     Continue to Next        │  │
│    └─────────────────────────────┘  │
│    ┌─────────────────────────────┐  │
│    │    Return to Schedule       │  │
│    └─────────────────────────────┘  │
└─────────────────────────────────────┘
```

## Screen 6: Offline Queue Management

### Pending Sync State
```
┌─────────────────────────────────────┐
│  ← Sync Status              🟠 Offline│
├─────────────────────────────────────┤
│  Offline Mode • 3 visits pending    │
│  Will sync when connected           │
├─────────────────────────────────────┤
│                                     │
│ 📋 Pending Uploads                  │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ⏸️ Margaret Thompson            │ │
│ │   8:30 AM visit complete        │ │
│ │   Photos: 2, Signature: Yes     │ │
│ │   Size: 2.3 MB                  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ⏸️ Robert Chen                  │ │
│ │   10:00 AM visit complete       │ │
│ │   Photos: 1, Signature: Yes     │ │
│ │   Size: 1.8 MB                  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ⏸️ Dorothy Wilson               │ │
│ │   11:30 AM visit in progress    │ │
│ │   Auto-saved 2 min ago          │ │
│ │   Size: 0.8 MB                  │ │
│ └─────────────────────────────────┘ │
│                                     │
│    [🔄 Try to Connect]              │
├─────────────────────────────────────┤
│ Total pending: 4.9 MB               │
└─────────────────────────────────────┘
```

### Syncing State
```
┌─────────────────────────────────────┐
│  ← Sync Status              🟡 Syncing│
├─────────────────────────────────────┤
│  Connected • Uploading visits...    │
│  2 of 3 visits uploaded             │
├─────────────────────────────────────┤
│                                     │
│ 🔄 Syncing Progress                 │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ✅ Margaret Thompson            │ │
│ │   8:30 AM visit • Uploaded      │ │
│ │   [████████████████████] 100%   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ✅ Robert Chen                  │ │
│ │   10:00 AM visit • Uploaded     │ │
│ │   [████████████████████] 100%   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🔄 Dorothy Wilson               │ │
│ │   11:30 AM visit • Uploading... │ │
│ │   [████████████     ] 65%       │ │
│ └─────────────────────────────────┘ │
│                                     │
│         Estimated: 30 seconds       │
│                                     │
│    [⏸️ Pause Upload]                │
└─────────────────────────────────────┘
```

## Component State Specifications

### Button States
- **Default:** Primary color background, white text
- **Hover:** Slightly darker background (mobile: immediate tap feedback)
- **Active/Pressed:** Darker background with subtle scale transform
- **Disabled:** Gray background, gray text, no interaction
- **Loading:** Spinner overlay, button text hidden, maintain dimensions

### Input Field States
- **Default:** Light gray border, white background
- **Focus:** Primary color border (2px), remove default outline
- **Error:** Red border (2px), red helper text below
- **Success:** Green border (1px), green checkmark icon
- **Disabled:** Light gray background, gray text, no cursor

### Card States
- **Default:** White background, subtle shadow
- **Hover:** Slight shadow increase (desktop only)
- **Active:** Subtle scale transform and shadow increase
- **Selected:** Primary color border (2px)
- **Loading:** Skeleton loading animation over content

### Connectivity Indicators
- **Online:** Green dot or wifi icon
- **Offline:** Gray dot or cloud icon with slash
- **Syncing:** Animated sync icon (rotating or pulsing)
- **Error:** Red warning icon with retry option

---

*These screen states ensure consistent user experience across all possible interaction scenarios in the mobile documentation workflow.*