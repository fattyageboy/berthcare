# Family Portal Feature Design

## Feature Overview

**Priority:** P1 - Important for family satisfaction but not core workflow

**User Story:** As a family member, I want to see when care visits happen and view basic care information, so that I feel informed about my loved one's care.

**Value Proposition:** Provides family members with transparency into their loved one's care, improving family satisfaction and reducing anxiety through clear communication and regular updates.

## Target Users

### Primary User
- **Jennifer (48, Daughter of Client):** Works full-time, lives 2 hours from elderly parent, needs peace of mind about care quality

### User Context
- **Demographics:** Adult children (35-65) of elderly patients
- **Technology Comfort:** Moderate, uses web and mobile apps regularly
- **Pain Points:** Limited communication, uncertainty about care quality
- **Goals:** Stay informed about parent's care, peace of mind
- **Success Metrics:** Increased transparency, easier communication with care team

### Secondary Users
- **Spouses:** Partners of care recipients wanting day-to-day updates
- **Adult Siblings:** Multiple family members needing coordinated communication
- **Power of Attorney:** Legal representatives managing care decisions

## Key Features

### 1. Visit Dashboard
- **Real-time Updates:** Live status of scheduled and completed visits
- **Visit Summaries:** Simple, family-friendly summaries of care activities
- **Provider Information:** Photos and contact info for regular care providers
- **Schedule Visibility:** Upcoming visits and any schedule changes

### 2. Care Information Display
- **Simplified Care Plans:** Medical information translated to plain language
- **Health Status Updates:** Easy-to-understand health indicators and trends
- **Medication Tracking:** Current medications with basic information
- **Safety Notes:** Important safety considerations and precautions

### 3. Communication Hub
- **Care Team Contact:** Direct communication with care coordinators
- **Message History:** Archive of all communications and updates
- **Emergency Information:** Clear escalation paths for concerns
- **Notification Preferences:** Customizable alert settings

### 4. Progress Tracking
- **Health Trends:** Visual charts showing improvement or concerns
- **Goal Progress:** Updates on care plan objectives and milestones
- **Photo Sharing:** Care provider photos (with consent) showing progress
- **Activity Reports:** Weekly/monthly summaries of care activities

## User Experience Requirements

### Information Architecture
- **Family-Friendly Language:** Non-technical terminology throughout
- **Intuitive Navigation:** Simple, clear menu structure (max 2 levels deep)
- **Mobile-Responsive:** Works well on smartphones and tablets
- **Quick Overview:** Dashboard shows most important information first

### Progressive Disclosure Strategy
- **Essential Information First:** Recent visits, current status, urgent updates
- **Expandable Details:** Drill down for more detailed care information
- **Historical Data:** Access to past visits and long-term trends
- **Advanced Features:** Communication tools and detailed reports

### Privacy and Security
- **Read-Only Access:** Family members cannot edit care information
- **Controlled Sharing:** Care providers control what information is shared
- **Consent Management:** Clear consent process for information sharing
- **Access Levels:** Different family members may have different access rights

### Error Prevention Mechanisms
- **Clear Boundaries:** Obvious distinction between viewing and editing capabilities
- **Contact Guidance:** Clear instructions for when to contact care team vs. emergency services
- **Information Currency:** Clear timestamps on all information
- **System Status:** Indicators when information is being updated

## Design Specifications

### Web Dashboard (Desktop/Tablet)
```
┌──────────────────────────────────────────────────────────────┐
│ BerthCare Family Portal    📧 Messages  👤 Jennifer   [🚪] │
├──────────────────────────────────────────────────────────────┤
│ 👋 Welcome back, Jennifer                    🔔 2 New Updates │
│ Margaret Thompson's Care Dashboard                           │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ 📅 TODAY'S CARE STATUS                    📊 HEALTH SUMMARY  │
│ ┌─────────────────────────────────────┐  ┌─────────────────┐│
│ │ ✅ Morning Visit Complete           │  │ Overall Status  ││
│ │    Sarah R. • 9:00 AM - 9:45 AM    │  │ 🟢 Stable      ││
│ │    Medication ✓ Vitals ✓ Mobility  │  │                 ││
│ │                                     │  │ Recent Vitals   ││
│ │ 🕒 Afternoon Visit Scheduled        │  │ BP: 138/82 ✓    ││
│ │    Mike D. • 2:00 PM - 2:30 PM     │  │ Temp: 98.6°F ✓  ││
│ │    Physical Therapy Session         │  │ Weight: 165 lbs ││
│ │                                     │  │                 ││
│ │ 📞 Contact Care Team                │  │ [View Trends]   ││
│ └─────────────────────────────────────┘  └─────────────────┘│
│                                                              │
│ 💊 CURRENT MEDICATIONS                📋 RECENT CARE NOTES   │
│ ┌─────────────────────────────────────┐  ┌─────────────────┐│
│ │ • Blood Pressure (Lisinopril)      │  │ Mar 15: Doing   ││
│ │   10mg daily, morning               │  │ well today.     ││
│ │                                     │  │ Walked to       ││
│ │ • Diabetes (Metformin)              │  │ kitchen with    ││
│ │   500mg twice daily                 │  │ minimal help.   ││
│ │                                     │  │                 ││
│ │ • Insulin (Lantus)                  │  │ Mar 14: Slight  ││
│ │   20 units evening                  │  │ confusion this  ││
│ │                                     │  │ morning, but    ││
│ │ Last updated: Mar 12 by Dr. Smith   │  │ improved after  ││
│ │ Next review: Mar 26                 │  │ medication.     ││
│ └─────────────────────────────────────┘  └─────────────────┘│
│                                                              │
│ 📈 HEALTH TRENDS (Last 30 Days)       📞 EMERGENCY CONTACT   │
│ ┌─────────────────────────────────────┐  ┌─────────────────┐│
│ │ Blood Pressure                      │  │ During visits:  ││
│ │ ████████▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓   │  │ Call Sarah      ││
│ │ Normal  Elevated  High              │  │ (403) 555-0123  ││
│ │                                     │  │                 ││
│ │ Mobility & Independence             │  │ After hours:    ││
│ │ ████████████████████▓▓▓▓▓▓          │  │ Care Coordinator││
│ │ Independent  Assisted  Dependent    │  │ (403) 555-0199  ││
│ │                                     │  │                 ││
│ │ [View Detailed Reports]             │  │ Emergency: 911  ││
│ └─────────────────────────────────────┘  └─────────────────┘│
└──────────────────────────────────────────────────────────────┘
```

### Mobile Interface (Smartphone)
```
┌─────────────────────────────────────┐
│ 📱 BerthCare Family         🔔 ⚙️  │
├─────────────────────────────────────┤
│ Margaret Thompson's Care            │
│ Last updated: 2 hours ago           │
├─────────────────────────────────────┤
│                                     │
│ 📅 Today's Status                   │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ✅ Morning Visit Complete       │ │
│ │    Sarah • 9:00-9:45 AM        │ │
│ │    All activities completed     │ │
│ │    💬 "Mom doing great today"   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🕒 Next: Afternoon PT           │ │
│ │    Mike • 2:00 PM Today         │ │
│ │    📍 Physical therapy session  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 🩺 Health Summary                   │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Overall Status: 🟢 Stable       │ │
│ │                                 │ │
│ │ Blood Pressure: 138/82 ✓        │ │
│ │ Temperature: 98.6°F ✓           │ │
│ │ Mobility: Good with walker       │ │
│ │                                 │ │
│ │ [View Full Health Report]       │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 💊 Medications                      │
│ ┌─────────────────────────────────┐ │
│ │ 3 current medications           │ │
│ │ All taken as prescribed         │ │
│ │ Next review: March 26           │ │
│ │ [View Medication List]          │ │
│ └─────────────────────────────────┘ │
│                                     │
│    [📞 Contact Team] [📊 Reports]   │
├─────────────────────────────────────┤
│ Home  Updates  Contact  Reports     │
└─────────────────────────────────────┘
```

### Communication Interface
```
┌─────────────────────────────────────┐
│  ← Messages                     ✏️  │
├─────────────────────────────────────┤
│  Care Team Communication            │
│  Response time: Within 24 hours     │
├─────────────────────────────────────┤
│                                     │
│ 💬 Conversation History             │
│                                     │
│ March 15, 2:30 PM                   │
│     ┌─────────────────────────────┐ │
│     │ Hi Jennifer, Margaret had   │ │
│     │ a great day today. She      │ │
│     │ walked to the kitchen       │ │
│     │ independently. BP is        │ │
│     │ stable. - Sarah             │ │
│     └─────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Thank you for the update! I'm   │ │
│ │ so glad to hear she's doing     │ │
│ │ well. Any concerns about her    │ │
│ │ confusion episodes?             │ │
│ │ 3:15 PM                         │ │
│ └─────────────────────────────────┘ │
│                                     │
│ March 14, 10:00 AM                  │
│     ┌─────────────────────────────┐ │
│     │ Quick update: Margaret was  │ │
│     │ slightly confused this      │ │
│     │ morning but improved after  │ │
│     │ her medication. We'll       │ │
│     │ monitor closely. - Mike     │ │
│     └─────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Type your message...            │ │
│ │                            [➤] │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ℹ️ For urgent concerns, call:        │
│    Care Team: (403) 555-0199       │
│    Emergency: 911                  │
└─────────────────────────────────────┘
```

## Technical Requirements

### Web Platform Requirements
- **Responsive Design:** Mobile-first approach, works on all devices
- **Browser Support:** Modern browsers (Chrome, Safari, Firefox, Edge)
- **Performance:** Page load times <3 seconds on mobile networks
- **Accessibility:** WCAG 2.1 AA compliance for screen readers and keyboard navigation

### Security and Privacy
- **Separate Authentication:** Different login system from staff app
- **Data Encryption:** All data encrypted in transit and at rest
- **Access Controls:** Granular permissions for different family members
- **Audit Logging:** Complete record of all family member access and actions

### Integration Requirements
- **Real-time Updates:** Live synchronization with care provider documentation
- **Notification System:** Email and SMS notifications for important updates
- **Content Filtering:** Automatic translation of medical terms to family-friendly language
- **Photo Sharing:** Secure sharing of care progress photos (with consent)

### Data Management
- **Read-Only Access:** Family members cannot modify any care data
- **Data Filtering:** Show only appropriate information based on privacy settings
- **Historical Data:** Access to visit history and trend information
- **Export Capabilities:** PDF reports for family records

## Success Metrics

### Primary Metrics
- **Family Satisfaction:** 70% report feeling better informed about care
- **Portal Usage:** 60% of families log in at least weekly
- **Communication Quality:** 80% find care team communication helpful
- **Response Time:** Care team responds to family questions within 24 hours

### Secondary Metrics
- **Feature Usage:** Track which sections families use most frequently
- **Support Requests:** Reduce family calls to care coordinators by 40%
- **Login Frequency:** Average 2-3 logins per week per family member
- **Message Volume:** Healthy communication patterns without overwhelming staff

## Implementation Roadmap

### Phase 1: Core Portal (Weeks 1-6)
- Basic dashboard with visit status and health summary
- Simple messaging system with care team
- Mobile-responsive web interface
- User authentication and access controls

### Phase 2: Enhanced Information (Weeks 7-10)
- Detailed health trends and progress tracking
- Medication information display
- Photo sharing capabilities
- Notification system setup

### Phase 3: Advanced Features (Weeks 11-14)
- Multiple family member access management
- Detailed reporting and export capabilities
- Integration with calendar systems
- Advanced notification preferences

### Phase 4: Analytics & Optimization (Weeks 15-16)
- Usage analytics dashboard
- Family satisfaction surveys
- Performance optimization
- User experience improvements

## Privacy and Consent Management

### Information Sharing Controls
- **Granular Permissions:** Care providers control what information is shared
- **Family Member Levels:** Different access levels for different family members
- **Consent Documentation:** Clear record of what families have agreed to see
- **Opt-out Options:** Easy way for patients to limit family access

### Compliance Requirements
- **PIPEDA Compliance:** Canadian privacy law adherence
- **Healthcare Regulations:** Provincial health information regulations
- **Data Retention:** Clear policies for how long family data is stored
- **Third-party Sharing:** No sharing of family data with external parties

---

*This family portal design provides transparency and peace of mind for families while maintaining patient privacy and reducing administrative burden on care teams.*