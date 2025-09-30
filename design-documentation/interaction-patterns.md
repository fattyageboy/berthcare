# BerthCare Interaction Patterns & State Management

## Overview

This document defines the comprehensive interaction patterns, state management strategies, and user experience flows that ensure consistency across all BerthCare features. These patterns are specifically designed for healthcare environments with considerations for gloved hands, various lighting conditions, and time-critical scenarios.

## Core Interaction Principles

### Healthcare-Specific Interactions
- **Large Touch Targets:** Minimum 44px for use with medical gloves
- **Error Prevention:** Multi-step confirmations for critical actions
- **Quick Recovery:** Easy undo/redo for accidental inputs
- **Voice Integration:** Support for hands-free operation when needed
- **Offline-First:** All interactions must work without connectivity

### Accessibility-First Design
- **Screen Reader Friendly:** Every interaction has proper ARIA labels and announcements
- **Keyboard Navigation:** Complete keyboard accessibility for all features
- **High Contrast Support:** All interactions visible in high contrast mode
- **Motion Respect:** Honor prefers-reduced-motion user settings
- **Focus Management:** Clear focus indicators and logical tab order

## Fundamental Interaction Patterns

### 1. Touch and Gesture Patterns

#### Primary Touch Interactions
```
Tap (Single Touch)
- Usage: Button activation, selection, navigation
- Target Size: 44px × 44px minimum
- Feedback: Immediate visual response (scale/color change)
- Timeout: No timeout for single taps

Long Press (Hold)
- Usage: Context menus, additional options, help information
- Duration: 500ms activation threshold
- Feedback: Haptic feedback at 300ms, visual at 500ms
- Use Cases: Patient card options, form field help, shortcuts

Double Tap
- Usage: Rarely used, only for zoom functionality
- Timing: 300ms between taps
- Note: Avoided in main UI to prevent accessibility issues

Swipe Gestures
- Left/Right Swipe: Navigate between patients, dismiss notifications
- Up/Down Swipe: Scroll content, pull-to-refresh
- Threshold: 50px minimum movement for gesture recognition
```

#### Touch Feedback Specifications
```css
/* Button Press Feedback */
.interactive-element {
  transition: all 150ms ease-out;
}

.interactive-element:active {
  transform: scale(0.95);
  background-color: var(--primary-blue-pressed);
}

/* Touch Ripple Effect (Android) */
.ripple-effect {
  position: relative;
  overflow: hidden;
}

.ripple-effect::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: scale(0);
  animation: ripple 0.3s linear;
}

@keyframes ripple {
  to {
    transform: scale(2);
    opacity: 0;
  }
}
```

### 2. Form Interaction Patterns

#### Input Field Behaviors
```javascript
// Input Field State Management
const inputStates = {
  DEFAULT: 'default',
  FOCUSED: 'focused',
  ERROR: 'error',
  SUCCESS: 'success',
  DISABLED: 'disabled',
  LOADING: 'loading'
};

// Progressive Enhancement for Voice Input
const VitalSignsInput = () => {
  const [value, setValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [inputMethod, setInputMethod] = useState('manual'); // 'manual' | 'voice'

  const handleVoiceInput = async () => {
    if ('speechRecognition' in window || 'webkitSpeechRecognition' in window) {
      setIsListening(true);
      // Voice recognition implementation
    } else {
      // Fallback to manual input
      focusManualInput();
    }
  };

  return (
    <InputGroup>
      <TextInput
        value={value}
        onChange={setValue}
        placeholder="Enter blood pressure"
        accessibilityLabel="Blood pressure reading"
        inputMode="numeric"
      />
      <VoiceButton
        onPress={handleVoiceInput}
        isListening={isListening}
        accessibilityLabel="Use voice input for blood pressure"
      />
      <ValidationIndicator state={getValidationState(value)} />
    </InputGroup>
  );
};
```

#### Smart Data Reuse Patterns
```javascript
// Previous Visit Data Integration
const SmartInputField = ({ fieldName, patientId, previousValue }) => {
  const [value, setValue] = useState('');
  const [showPrevious, setShowPrevious] = useState(!!previousValue);
  const [isUsingPrevious, setIsUsingPrevious] = useState(false);

  const handleUsePrevious = () => {
    setValue(previousValue);
    setIsUsingPrevious(true);
    // Announce to screen readers
    announceToScreenReader(`Previous value ${previousValue} copied to ${fieldName}`);
  };

  const handleClearPrevious = () => {
    setValue('');
    setIsUsingPrevious(false);
    setShowPrevious(false);
  };

  return (
    <View>
      <Label required>{fieldName}</Label>
      <InputContainer>
        <TextInput
          value={value}
          onChangeText={(text) => {
            setValue(text);
            if (isUsingPrevious) setIsUsingPrevious(false);
          }}
          placeholder={`Enter ${fieldName.toLowerCase()}`}
          style={[
            styles.input,
            isUsingPrevious && styles.copiedFromPrevious
          ]}
        />
        {showPrevious && !value && (
          <PreviousValueButton onPress={handleUsePrevious}>
            <Text>Use previous: {previousValue}</Text>
          </PreviousValueButton>
        )}
        {isUsingPrevious && (
          <CopiedIndicator>
            <Icon name="copy" size={16} />
            <Text>From last visit</Text>
            <TouchableOpacity onPress={handleClearPrevious}>
              <Icon name="close" size={16} />
            </TouchableOpacity>
          </CopiedIndicator>
        )}
      </InputContainer>
    </View>
  );
};
```

### 3. Navigation Patterns

#### Tab Navigation (Mobile Primary)
```javascript
// Bottom Tab Navigation with Healthcare Context
const TabNavigator = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [badges, setBadges] = useState({
    visits: 3,    // Pending visits
    team: 1,      // Urgent messages
    reports: 0,   // New reports
  });

  const tabConfig = [
    {
      id: 'home',
      label: 'Home',
      icon: 'home',
      badgeCount: 0,
      accessibilityLabel: 'Home screen'
    },
    {
      id: 'visits',
      label: 'Visits',
      icon: 'clipboard',
      badgeCount: badges.visits,
      accessibilityLabel: `Patient visits, ${badges.visits} pending`
    },
    {
      id: 'team',
      label: 'Team',
      icon: 'users',
      badgeCount: badges.team,
      accessibilityLabel: `Care team, ${badges.team} new messages`
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: 'chart-bar',
      badgeCount: badges.reports,
      accessibilityLabel: 'Reports and analytics'
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: 'user',
      badgeCount: 0,
      accessibilityLabel: 'User profile and settings'
    }
  ];

  return (
    <TabContainer>
      {tabConfig.map((tab) => (
        <TabButton
          key={tab.id}
          active={activeTab === tab.id}
          onPress={() => setActiveTab(tab.id)}
          accessibilityRole="tab"
          accessibilityLabel={tab.accessibilityLabel}
          accessibilityState={{ selected: activeTab === tab.id }}
        >
          <TabIcon name={tab.icon} active={activeTab === tab.id} />
          {tab.badgeCount > 0 && (
            <Badge count={tab.badgeCount} />
          )}
          <TabLabel active={activeTab === tab.id}>{tab.label}</TabLabel>
        </TabButton>
      ))}
    </TabContainer>
  );
};
```

#### Breadcrumb Navigation (Complex Workflows)
```javascript
// Contextual Breadcrumb for Deep Navigation
const BreadcrumbNavigation = ({ path, onNavigate }) => {
  const maxItems = 3; // Mobile optimization
  const visiblePath = path.length > maxItems ?
    ['...', ...path.slice(-maxItems)] : path;

  return (
    <BreadcrumbContainer>
      {visiblePath.map((item, index) => (
        <BreadcrumbItem key={index}>
          {item !== '...' ? (
            <TouchableOpacity
              onPress={() => onNavigate(item.id)}
              accessibilityRole="link"
              accessibilityLabel={`Navigate to ${item.label}`}
            >
              <BreadcrumbText active={index === visiblePath.length - 1}>
                {item.label}
              </BreadcrumbText>
            </TouchableOpacity>
          ) : (
            <BreadcrumbText muted>...</BreadcrumbText>
          )}
          {index < visiblePath.length - 1 && (
            <ChevronRight size={16} color="muted" />
          )}
        </BreadcrumbItem>
      ))}
    </BreadcrumbContainer>
  );
};
```

### 4. Data Loading and Sync Patterns

#### Progressive Loading States
```javascript
// Multi-stage Loading with Offline Support
const PatientDataLoader = ({ patientId }) => {
  const [loadingState, setLoadingState] = useState('initial');
  const [data, setData] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [isOffline, setIsOffline] = useState(false);

  const loadingStates = {
    initial: 'Loading patient information...',
    demographics: 'Loading patient details...',
    medical: 'Loading medical history...',
    visits: 'Loading visit records...',
    complete: 'Ready',
    error: 'Unable to load data',
    offline: 'Working offline'
  };

  useEffect(() => {
    loadPatientData();
  }, [patientId]);

  const loadPatientData = async () => {
    try {
      setLoadingState('demographics');
      const demographics = await loadFromCacheOrNetwork('demographics', patientId);
      setData(prev => ({ ...prev, demographics }));

      setLoadingState('medical');
      const medical = await loadFromCacheOrNetwork('medical', patientId);
      setData(prev => ({ ...prev, medical }));

      setLoadingState('visits');
      const visits = await loadFromCacheOrNetwork('visits', patientId);
      setData(prev => ({ ...prev, visits }));

      setLoadingState('complete');
    } catch (error) {
      if (error.type === 'offline') {
        setIsOffline(true);
        setLoadingState('offline');
      } else {
        setLoadingState('error');
      }
    }
  };

  return (
    <LoadingContainer>
      {loadingState !== 'complete' && (
        <LoadingIndicator>
          <ProgressBar value={getProgressValue(loadingState)} />
          <LoadingText>{loadingStates[loadingState]}</LoadingText>
          {isOffline && (
            <OfflineIndicator>
              <Icon name="cloud-off" />
              <Text>Working offline • Last sync: {lastSyncTime}</Text>
            </OfflineIndicator>
          )}
        </LoadingIndicator>
      )}
      {data && <PatientContent data={data} />}
    </LoadingContainer>
  );
};
```

#### Sync Status Patterns
```javascript
// Comprehensive Sync State Management
const SyncStateManager = () => {
  const [syncState, setSyncState] = useState('online');
  const [pendingItems, setPendingItems] = useState([]);
  const [lastSyncTime, setLastSyncTime] = useState(new Date());

  const syncStates = {
    online: { icon: 'wifi', color: 'green', message: 'Online' },
    syncing: { icon: 'sync', color: 'blue', message: 'Syncing...', animated: true },
    offline: { icon: 'cloud-off', color: 'gray', message: 'Offline' },
    error: { icon: 'alert-circle', color: 'red', message: 'Sync failed' },
    pending: { icon: 'clock', color: 'orange', message: 'Changes pending' }
  };

  const handleConnectivityChange = (isConnected) => {
    if (isConnected && pendingItems.length > 0) {
      startSync();
    } else if (!isConnected) {
      setSyncState('offline');
    }
  };

  const startSync = async () => {
    setSyncState('syncing');
    try {
      for (const item of pendingItems) {
        await syncItem(item);
      }
      setPendingItems([]);
      setSyncState('online');
      setLastSyncTime(new Date());
    } catch (error) {
      setSyncState('error');
    }
  };

  return (
    <SyncIndicator state={syncState}>
      <AnimatedIcon
        name={syncStates[syncState].icon}
        color={syncStates[syncState].color}
        animated={syncStates[syncState].animated}
      />
      <SyncText>{syncStates[syncState].message}</SyncText>
      {pendingItems.length > 0 && (
        <PendingBadge>{pendingItems.length}</PendingBadge>
      )}
    </SyncIndicator>
  );
};
```

## State Management Architecture

### 1. Global State Structure
```javascript
// Redux/Context State Architecture
const initialAppState = {
  // Authentication & User
  auth: {
    user: null,
    isAuthenticated: false,
    permissions: [],
    lastActivity: null
  },

  // Connectivity & Sync
  connectivity: {
    isOnline: true,
    syncStatus: 'idle', // 'idle' | 'syncing' | 'error'
    lastSyncTime: null,
    pendingChanges: [],
    conflictedItems: []
  },

  // Patient Data
  patients: {
    currentPatient: null,
    patientsList: [],
    searchResults: [],
    loadingStates: {},
    cache: {}
  },

  // Visit Management
  visits: {
    currentVisit: null,
    todaysVisits: [],
    visitHistory: [],
    draftVisits: [], // Offline drafts
    completedToday: []
  },

  // Care Team & Communication
  team: {
    teamMembers: [],
    conversations: [],
    unreadMessages: 0,
    urgentAlerts: [],
    onlineStatus: {}
  },

  // Application State
  ui: {
    activeTab: 'home',
    navigationStack: [],
    modals: {},
    notifications: [],
    loading: {}
  },

  // Settings & Preferences
  settings: {
    userPreferences: {},
    appSettings: {},
    accessibility: {},
    notifications: {}
  }
};
```

### 2. State Management Patterns

#### Optimistic Updates
```javascript
// Optimistic UI Updates for Better UX
const useOptimisticVisitUpdate = () => {
  const [visits, setVisits] = useState([]);
  const [pendingUpdates, setPendingUpdates] = useState(new Map());

  const updateVisitOptimistically = async (visitId, updates) => {
    // Immediately update UI
    setVisits(prev => prev.map(visit =>
      visit.id === visitId ? { ...visit, ...updates } : visit
    ));

    // Track pending update
    setPendingUpdates(prev => new Map(prev).set(visitId, updates));

    try {
      // Attempt server update
      await updateVisitOnServer(visitId, updates);

      // Remove from pending on success
      setPendingUpdates(prev => {
        const newPending = new Map(prev);
        newPending.delete(visitId);
        return newPending;
      });
    } catch (error) {
      // Revert on failure
      setVisits(prev => prev.map(visit =>
        visit.id === visitId ? { ...visit, ...getOriginalValues(visitId) } : visit
      ));

      // Show error to user
      showError('Update failed. Please try again.');
    }
  };

  return { visits, updateVisitOptimistically, pendingUpdates };
};
```

#### Offline-First State Management
```javascript
// Offline-Capable State with Conflict Resolution
const useOfflineFirstData = (dataType, id) => {
  const [data, setData] = useState(null);
  const [isStale, setIsStale] = useState(false);
  const [hasConflicts, setHasConflicts] = useState(false);

  const updateData = async (updates) => {
    // Always update local state first
    const optimisticData = { ...data, ...updates };
    setData(optimisticData);

    // Store in local cache
    await saveToLocalCache(dataType, id, optimisticData);

    // Add to sync queue
    addToSyncQueue({
      type: 'update',
      dataType,
      id,
      updates,
      timestamp: Date.now()
    });

    // Attempt immediate sync if online
    if (navigator.onLine) {
      try {
        await syncToServer(dataType, id, optimisticData);
      } catch (error) {
        if (error.type === 'conflict') {
          setHasConflicts(true);
          // Present conflict resolution UI
        }
      }
    }
  };

  const resolveConflict = async (resolution) => {
    const resolvedData = await resolveDataConflict(dataType, id, resolution);
    setData(resolvedData);
    setHasConflicts(false);
  };

  return {
    data,
    updateData,
    isStale,
    hasConflicts,
    resolveConflict
  };
};
```

### 3. Error State Management

#### Progressive Error Handling
```javascript
// Tiered Error Handling System
const ErrorBoundaryWithRecovery = ({ children }) => {
  const [error, setError] = useState(null);
  const [errorLevel, setErrorLevel] = useState('none');

  const errorLevels = {
    minor: {
      showToast: true,
      allowContinue: true,
      autoRecover: true,
      message: 'Something went wrong, but you can continue.'
    },
    moderate: {
      showModal: true,
      allowRetry: true,
      message: 'An error occurred. Please try again.'
    },
    critical: {
      showFullScreen: true,
      requireRestart: true,
      message: 'A critical error occurred. The app needs to restart.'
    }
  };

  const handleError = (error, level = 'moderate') => {
    setError(error);
    setErrorLevel(level);

    // Log error for debugging
    logError(error, level);

    // Attempt auto-recovery for minor errors
    if (level === 'minor' && errorLevels[level].autoRecover) {
      setTimeout(() => {
        setError(null);
        setErrorLevel('none');
      }, 3000);
    }
  };

  const recoverFromError = () => {
    setError(null);
    setErrorLevel('none');
    // Attempt to restore previous state
    restorePreviousState();
  };

  if (error) {
    return (
      <ErrorDisplay
        error={error}
        level={errorLevel}
        onRecover={recoverFromError}
        onRestart={() => window.location.reload()}
      />
    );
  }

  return children;
};
```

## Animation and Micro-interaction Patterns

### 1. Healthcare-Appropriate Animations
```css
/* Respectful Animation System */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Standard Animations */
.fade-in {
  animation: fadeIn 250ms var(--easing-decelerate) forwards;
}

.slide-up {
  animation: slideUp 250ms var(--easing-decelerate) forwards;
}

.scale-in {
  animation: scaleIn 200ms var(--easing-decelerate) forwards;
}

/* Status Change Animations */
.status-change {
  position: relative;
  overflow: hidden;
}

.status-change::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(35, 155, 86, 0.3), transparent);
  animation: shimmer 1s ease-out;
}

@keyframes shimmer {
  0% { left: -100%; }
  100% { left: 100%; }
}

/* Critical Alert Pulse */
.critical-alert {
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
```

### 2. Loading and Progress Animations
```javascript
// Skeleton Loading for Healthcare Data
const SkeletonLoader = ({ type }) => {
  const skeletonTypes = {
    patientCard: (
      <SkeletonContainer>
        <SkeletonAvatar />
        <SkeletonContent>
          <SkeletonLine width="60%" />
          <SkeletonLine width="40%" />
        </SkeletonContent>
        <SkeletonActions>
          <SkeletonButton />
          <SkeletonButton />
        </SkeletonActions>
      </SkeletonContainer>
    ),
    vitalSigns: (
      <SkeletonGrid>
        <SkeletonCard>
          <SkeletonLine width="30%" />
          <SkeletonLine width="50%" height="24px" />
        </SkeletonCard>
        <SkeletonCard>
          <SkeletonLine width="40%" />
          <SkeletonLine width="60%" height="24px" />
        </SkeletonCard>
      </SkeletonGrid>
    )
  };

  return skeletonTypes[type] || skeletonTypes.patientCard;
};

// Progress Indicators for Multi-step Processes
const VisitProgressIndicator = ({ currentStep, totalSteps, stepLabels }) => {
  return (
    <ProgressContainer>
      <ProgressBar>
        <ProgressFill
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </ProgressBar>
      <StepIndicators>
        {stepLabels.map((label, index) => (
          <StepIndicator key={index}>
            <StepCircle
              completed={index < currentStep}
              current={index === currentStep}
            >
              {index < currentStep ? (
                <CheckIcon size={16} />
              ) : (
                <Text>{index + 1}</Text>
              )}
            </StepCircle>
            <StepLabel current={index === currentStep}>
              {label}
            </StepLabel>
          </StepIndicator>
        ))}
      </StepIndicators>
    </ProgressContainer>
  );
};
```

---

*These interaction patterns and state management strategies ensure a consistent, accessible, and efficient user experience across all BerthCare features while accommodating the unique requirements of healthcare environments.*