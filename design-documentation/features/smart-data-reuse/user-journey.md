# Smart Data Reuse: User Journey

## Primary User Journey: Routine Visit with Data Reuse

### Context
Sarah, an experienced home care nurse, is starting her second visit with Mrs. Johnson, an 78-year-old diabetes patient who receives twice-weekly care visits. Sarah documented a comprehensive assessment two days ago.

### Journey Map

#### Phase 1: Visit Preparation (Pre-arrival)
**Location**: In vehicle, 5 minutes before arrival
**Goal**: Quick context review of previous visit

```
Actions:
1. Open BerthCare app
2. Navigate to Mrs. Johnson's profile
3. Review "Last Visit Summary" card
4. Note any care alerts or changes
```

**System Behavior**:
- Loads patient profile with last visit highlights
- Shows care alerts in chronological order
- Displays medication changes since last visit
- Indicates data freshness (2 days ago)

**Pain Points**:
- Limited time for thorough review
- Need to understand what changed since last visit
- Concern about missing critical updates

**Design Opportunity**:
- **Quick Insights Card**: Key changes highlighted upfront
- **Care Alert Priority**: Most important items shown first
- **Offline Accessibility**: Works without connectivity

---

#### Phase 2: Visit Initiation (Patient home)
**Location**: Patient's living room
**Goal**: Begin documentation efficiently using previous data

```
Actions:
1. Tap "Start Visit Documentation"
2. See "Copy from March 15 Visit" option
3. Tap copy option to view selection modal
4. Review pre-selected data categories
5. Tap "Copy Selected" to populate form
```

**System Behavior**:
- Identifies most recent relevant visit (March 15)
- Smart-selects routine data (vital signs template, medication list)
- Excludes time-sensitive data (visit notes, timestamps)
- Pre-populates form within 2 seconds

**Pain Points**:
- Uncertainty about what data will be copied
- Need to verify copied data is still accurate
- Want to avoid copying inappropriate information

**Design Solutions**:
- **Smart Selection Preview**: Show what will be copied before confirming
- **Data Freshness Indicators**: Visual cues for data age and relevance
- **Granular Control**: Easy selection/deselection of data categories

---

#### Phase 3: Data Review and Validation
**Location**: Patient's bedside
**Goal**: Verify copied data accuracy and update changes

```
Actions:
1. Review pre-populated vital signs section
2. Notice blood pressure copied from last visit (128/82)
3. Take new blood pressure reading (135/88)
4. Tap blood pressure field to edit
5. Update with new measurement
6. System highlights field as "modified"
```

**System Behavior**:
- Copied fields have subtle blue background
- Tapped fields switch to edit mode with white background
- Modified fields get yellow highlight and "edited" indicator
- Auto-saves changes every 30 seconds

**User Mental Model**:
- Blue = copied from before (review needed)
- White = actively editing
- Yellow = I changed this from the copied version
- Green = completed and verified

**Pain Points**:
- Need to distinguish what was copied vs. what's new
- Want to understand why certain data was pre-selected
- Risk of accidentally submitting outdated information

**Design Solutions**:
- **Clear Visual Language**: Consistent color coding throughout
- **Change Tracking**: Visual history of what was modified
- **Required Review**: Flag fields that always need fresh data

---

#### Phase 4: Efficient Completion
**Location**: Patient's kitchen (completing medication review)
**Goal**: Quickly document routine medication compliance

```
Actions:
1. Navigate to Medication section
2. See pre-populated medication list from last visit
3. Verify patient has taken morning medications
4. Update compliance status for each medication
5. Add quick note about patient's reported side effects
```

**System Behavior**:
- Medication list copied with previous compliance status
- Toggle switches for quick compliance updates
- Voice-to-text available for side effect notes
- Smart suggestions based on common patterns

**Efficiency Gains**:
- **Before**: Manual entry of 8 medications (5 minutes)
- **After**: Review and update existing list (1.5 minutes)
- **Time Saved**: 3.5 minutes on medication documentation alone

**Pain Points**:
- Medications may have changed since last visit
- Dosages might be different
- New medications need to be added

**Design Solutions**:
- **Medication Change Alerts**: Highlight when prescriptions were modified
- **Quick Add**: Fast entry for new medications
- **Verification Prompts**: Remind to verify unchanged medications

---

#### Phase 5: Completion and Submission
**Location**: Patient's front door (visit ending)
**Goal**: Complete documentation and prepare for next patient

```
Actions:
1. Review all sections for completeness
2. Add final visit summary notes
3. Digital signature from patient/family
4. Submit completed documentation
5. Receive confirmation of successful sync
```

**System Behavior**:
- Shows completion checklist with copied vs. new data summary
- Validates all required fields before submission
- Queues for upload if offline, syncs when connected
- Provides clear success confirmation

**Success Metrics**:
- **Total documentation time**: 8 minutes (vs. 18 minutes without reuse)
- **Data accuracy**: 100% (all copied data verified)
- **User satisfaction**: High confidence in documentation quality

---

## Secondary Journey: New Patient (No Previous Data)

### Context
Sarah visits Mr. Thompson for the first time, a new patient transferred from hospital care.

### Journey Flow

#### Phase 1: First-Time Setup
```
Actions:
1. Open Mr. Thompson's profile
2. See "No Previous Visits" indicator
3. Tap "Start New Documentation"
4. System provides blank form with smart defaults
```

**System Behavior**:
- Recognizes first-time patient status
- Offers care plan templates based on diagnosis
- Provides guided documentation prompts
- Suggests comprehensive assessment checklist

**Design Considerations**:
- **Template Suggestions**: Common care patterns for condition
- **Guided Input**: Step-by-step prompts for thoroughness
- **Future Optimization**: Capture data that will be useful for copying

---

## Edge Case Journeys

### Journey A: Outdated Previous Data
**Scenario**: Last visit was 3 weeks ago, significant changes likely

```
System Behavior:
- Shows "Last visit: 21 days ago" warning
- Recommends full assessment instead of copying
- Offers selective copying of stable data only
- Highlights fields that typically change over time
```

### Journey B: Different Caregiver
**Scenario**: Sarah is covering for colleague who did previous visits

```
System Behavior:
- Indicates "Previous visit by: Mike Rodriguez"
- Adds context about different assessment style
- Suggests reviewing care notes for continuity
- Provides colleague contact for questions
```

### Journey C: System Failure During Copy
**Scenario**: App crashes while copying previous visit data

```
Recovery Flow:
1. App restart detects incomplete copy operation
2. Offers to resume where left off
3. Shows draft saved data vs. original copy attempt
4. Allows user to choose recovery method
5. Ensures no data loss from interrupted session
```

---

## Advanced User Patterns

### Power User Journey: Auto-Copy Mode
**User Profile**: Experienced nurse with consistent patients

```
Workflow Enhancement:
1. Enable "Smart Auto-Copy" in settings
2. System learns copying patterns for each patient
3. Pre-populates form automatically on visit start
4. User reviews highlighted changes only
5. Voice dictation for quick modifications
```

**Efficiency Gains**:
- Reduces initial setup time by additional 2-3 minutes
- Maintains accuracy through intelligent pre-selection
- Adapts to individual caregiver preferences

### Team Coordination Journey: Shared Care Plans
**Scenario**: Multiple caregivers serving same patient

```
Collaborative Features:
1. See care plan updates from other team members
2. Copy from most recent visit regardless of caregiver
3. Compare different caregivers' assessment patterns
4. Add notes visible to entire care team
5. Flag discrepancies for team discussion
```

---

## Journey Success Metrics

### Quantitative Measures
- **Time Savings**: 50% reduction in documentation time
- **Accuracy Rate**: 95% of copied data remains unchanged
- **User Adoption**: 85% of visits use some form of data reuse
- **Error Reduction**: 60% fewer data entry mistakes

### Qualitative Measures
- **Confidence**: Users feel secure about data accuracy
- **Efficiency**: More time available for patient care
- **Consistency**: Standardized documentation across team
- **Satisfaction**: Reduced frustration with repetitive tasks

### Business Impact
- **Patient Satisfaction**: More face-to-face time with caregivers
- **Cost Reduction**: Labor savings through efficiency gains
- **Quality Improvement**: More complete, accurate documentation
- **Staff Retention**: Reduced administrative burden improves job satisfaction

---

*These user journeys ensure the Smart Data Reuse feature delivers meaningful efficiency improvements while maintaining clinical accuracy and user confidence.*