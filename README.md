# BerthCare

An offline-first mobile application for home care documentation that reduces documentation time by 50% while maintaining regulatory compliance.

## Overview

BerthCare is designed for nurses, personal support workers (PSWs), and care coordinators providing in-home care services. The platform enables real-time documentation, care coordination, and family communication with full offline functionality.

## Key Features

- **Offline-First Documentation**: Capture visit notes, vital signs, and photos without internet connectivity
- **Smart Data Reuse**: Pre-populate forms with previous visit data to reduce repetitive entry
- **GPS Visit Verification**: Automated check-in/check-out with location tracking
- **Real-Time Sync**: Background synchronization when connectivity is restored
- **Family Portal**: Web-based portal for family members to view care updates and photos
- **Care Coordination**: Team messaging and care plan management
- **Regulatory Compliance**: PHIPA/PIPEDA compliant with audit trails

## Technology Stack

### Mobile Application
- **Framework**: React Native (iOS/Android)
- **State Management**: Redux Toolkit with RTK Query
- **Offline Storage**: SQLite with Watermelon DB
- **Navigation**: React Navigation
- **UI Components**: Custom design system with accessibility support

### Backend Services
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **API**: RESTful API with WebSocket support
- **Authentication**: Auth0 with RBAC

### Database & Storage
- **Primary Database**: PostgreSQL
- **Cache Layer**: Redis
- **File Storage**: AWS S3 with CloudFront CDN
- **Search**: Elasticsearch

### Infrastructure
- **Cloud Platform**: AWS (Canadian data residency)
- **Container Orchestration**: ECS Fargate
- **CI/CD**: GitHub Actions
- **Monitoring**: New Relic, Sentry, CloudWatch

## Project Structure

```
berthcare/
├── mobile/                 # React Native mobile application
├── backend/                # Node.js microservices
│   ├── user-service/       # Authentication and user management
│   ├── visit-service/      # Visit documentation and care plans
│   ├── sync-service/       # Offline synchronization
│   └── notification-service/ # Push notifications and alerts
├── web/                    # React web applications
│   ├── family-portal/      # Family member access portal
│   └── admin-portal/       # Administrative dashboard
├── infrastructure/         # Infrastructure as Code (Terraform)
├── docs/                   # Technical documentation
└── scripts/                # Development and deployment scripts
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- React Native development environment
- Docker and Docker Compose
- AWS CLI (for deployment)
- Git

### Development Setup

```bash
# Clone the repository
git clone https://github.com/your-org/berthcare.git
cd berthcare

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Start local development environment
docker-compose up -d

# Run the mobile app
cd mobile
npm start
```

## Development Workflow

### Branch Strategy
- **main**: Production-ready code
- **develop**: Integration branch for features
- **feature/***: Feature development branches
- **hotfix/***: Emergency production fixes

### Commit Convention
Follow [Conventional Commits](https://www.conventionalcommits.org/) specification:
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `refactor:` Code refactoring
- `test:` Test additions or modifications
- `chore:` Maintenance tasks

### Code Review
- All changes require pull requests
- Minimum 2 reviewers required for approval
- All CI checks must pass
- Branch protection enforced on main and develop

## Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Generate coverage report
npm run test:coverage
```

## Deployment

Deployment is automated through GitHub Actions:
- **Development**: Auto-deploy on push to `develop`
- **Staging**: Auto-deploy on push to `staging`
- **Production**: Manual approval required for `main` branch

See [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for detailed deployment procedures.

## Security

- All dependencies scanned with Snyk
- SAST/DAST security scanning in CI/CD
- Regular security audits and penetration testing
- PHIPA/PIPEDA compliance for Canadian healthcare data
- SOC 2 Type II certification in progress

## Documentation

- [Architecture Overview](./project-documentation/architecture-output.md)
- [API Documentation](./docs/API.md)
- [Design System](./design-documentation/design-system/README.md)
- [User Journeys](./design-documentation/features/mobile-documentation/user-journey.md)
- [Accessibility Guide](./design-documentation/accessibility/README.md)

## Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## Support

- **Technical Issues**: Create a GitHub issue
- **Security Concerns**: Email security@berthcare.ca
- **General Inquiries**: Contact support@berthcare.ca

## Roadmap

### Phase 1: MVP (Months 1-3)
- Core mobile app with offline documentation
- Basic backend services and API
- User authentication and authorization

### Phase 2: Enhanced Features (Months 4-6)
- Family portal web application
- Advanced care coordination tools
- Real-time messaging and notifications

### Phase 3: Scale and Optimize (Months 7-9)
- Performance optimization
- Multi-province expansion
- Advanced analytics and reporting

### Phase 4: Innovation (Months 10-12)
- AI-powered documentation assistance
- Predictive care insights
- Integration marketplace

## Team

For questions or support, contact the development team through the appropriate channels defined in [CODEOWNERS](./CODEOWNERS).

---

Built with care for caregivers.
