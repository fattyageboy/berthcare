# BerthCare Mobile

React Native mobile application for the BerthCare healthcare visit management system.

## Architecture

This mobile app follows an offline-first architecture with the following key features:

- **Offline-first data capture** using SQLite/WatermelonDB
- **Real-time GPS tracking** for visit verification
- **Photo capture** with local file management
- **Bi-directional sync** with conflict resolution
- **Push notifications** via Firebase Cloud Messaging

## Tech Stack

- **React Native 0.81.4** with TypeScript
- **React Navigation** for routing
- **Redux Toolkit** for state management
- **WatermelonDB** for offline storage
- **Axios** for API communication
- **AsyncStorage** for secure token storage

## Project Structure

```
mobile/
├── src/
│   ├── screens/          # Screen components
│   ├── components/       # Reusable UI components
│   ├── navigation/       # Navigation configuration
│   ├── services/         # API and business logic services
│   ├── store/            # Redux store and slices
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Utility functions
│   ├── types/            # TypeScript type definitions
│   └── assets/           # Images, fonts, etc.
├── android/              # Android native code
├── ios/                  # iOS native code
└── __tests__/            # Test files
```

## Getting Started

### Prerequisites

- Node.js >= 20
- React Native development environment set up
- iOS: Xcode and CocoaPods
- Android: Android Studio and SDK

### Installation

1. Install dependencies:
```bash
cd mobile
npm install
```

2. Install iOS pods (macOS only):
```bash
cd ios
bundle install
bundle exec pod install
cd ..
```

### Running the App

#### iOS
```bash
npm run ios
```

#### Android
```bash
npm run android
```

### Development

#### Type Checking
```bash
npm run type-check
```

#### Linting
```bash
npm run lint
npm run lint:fix
```

#### Formatting
```bash
npm run format
```

#### Testing
```bash
npm test
```

## Environment Configuration

Create a `.env` file in the mobile directory:

```env
API_BASE_URL=http://localhost:3000
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_CLIENT_ID=your_client_id
GOOGLE_MAPS_API_KEY=your_api_key
```

## Key Features

### Offline-First Architecture
- Local SQLite database with WatermelonDB
- Background sync with conflict resolution
- Queue-based upload for photos and data

### Visit Management
- GPS-based check-in verification (100m urban, 500m rural)
- Real-time location tracking
- Photo capture and documentation
- Care activity logging

### Synchronization
- Bi-directional sync with backend
- Last-write-wins conflict resolution
- WebSocket for real-time updates
- Automatic retry with exponential backoff

### Security
- Secure token storage with AsyncStorage
- Biometric authentication support
- End-to-end encryption for sensitive data
- Certificate pinning for API calls

## Backend Integration

This mobile app integrates with the BerthCare backend services:

- **User Service** (Port 3001) - Authentication and user management
- **Visit Service** (Port 3002) - Visit lifecycle and documentation
- **Sync Service** (Port 3003) - Data synchronization
- **Notification Service** (Port 3004) - Push notifications
- **File Upload Service** - Photo uploads to S3

## Contributing

1. Follow the TypeScript strict mode guidelines
2. Use functional components with hooks
3. Write tests for business logic
4. Follow the established folder structure
5. Use the provided ESLint and Prettier configurations

## Troubleshooting

### iOS Build Issues
```bash
cd ios
pod deintegrate
pod install
cd ..
```

### Android Build Issues
```bash
cd android
./gradlew clean
cd ..
```

### Metro Bundler Issues
```bash
npm start -- --reset-cache
```

## License

Private - BerthCare Healthcare Solutions
