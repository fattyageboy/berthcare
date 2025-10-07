# BerthCare - Home Care Documentation Platform

**Version:** 2.0.0  
**Last Updated:** October 7, 2025

## Overview

BerthCare is a mobile-first home care documentation platform designed to eliminate the 50% of shift time wasted on duplicate data entry and after-hours paperwork. Built with an offline-first architecture, BerthCare enables nurses and care aides to document care at the point of service, reducing documentation time from 15-20 minutes per visit to under 10 minutes.

## Philosophy

> "Simplicity is the ultimate sophistication. Start with the user experience, then work backwards to the technology."

BerthCare's architecture is designed to be **invisible**. Nurses shouldn't think about the app—they should think about their patients. Every technical decision traces back to a single question: **Does this help a nurse provide better care?**

## Core Features (MVP)

### 1. Mobile Point-of-Care Documentation
- Smartphone/tablet app for home care nurses and aides
- Document during the visit, not back at office
- Works offline, syncs when connected
- Pre-populated templates for common visit types

### 2. Smart Data Reuse
- "Copy from last visit" button for unchanged information
- Auto-populate vital signs from previous entries
- Template library for common scenarios
- Quick notes shortcuts

### 3. Basic Care Coordination
- Simple shared care plan visible to all team members
- In-app messaging (care team only)
- Care team directory with roles/contact info
- Flagging system for urgent issues

### 4. Simple Family Portal
- Read-only web portal for families
- View visit schedule and completion confirmations
- See care plan summary (plain language)
- Contact care coordinator button

### 5. Electronic Visit Verification
- GPS check-in/out at client location
- Time tracking automatic
- Task checklist for each visit type
- End-of-visit summary auto-generated

### 6. Export/Import Bridge
- Export visit notes as PDF
- Import client roster from CSV
- Daily summary report email to supervisors
- Basic API hooks for future integration

## Technology Stack

### Mobile Application
- **Framework:** React Native 0.73+ with Expo SDK 50+
- **Local Database:** WatermelonDB (SQLite wrapper) for offline-first architecture
- **State Management:** Zustand + React Query

### Backend Services
- **Runtime:** Node.js 20 LTS with Express.js 4.x
- **API Style:** REST (simple, cacheable, well-understood)
- **Real-time:** Socket.io for care coordination alerts

### Data Layer
- **Server Database:** PostgreSQL 15+ (ACID compliance, relational integrity)
- **Mobile Database:** SQLite via WatermelonDB (offline-first, fast queries)
- **Caching:** Redis 7+ (session management, API response caching)
- **File Storage:** AWS S3 (photos, signatures, documents)

### Communication
- **Voice Calls:** Twilio Voice API
- **SMS:** Twilio SMS API (family portal, backup alerts)
- **Push Notifications:** Expo Push Notifications

### Infrastructure
- **Cloud Provider:** AWS (Canadian data residency in ca-central-1)
- **Compute:** ECS Fargate (serverless containers, auto-scaling)
- **CDN:** CloudFront (fast asset delivery, edge caching)
- **Monitoring:** CloudWatch + Sentry

## Project Structure

```
berthcare/
├── mobile/                 # React Native mobile application
├── backend/                # Node.js backend services
├── infrastructure/         # Infrastructure as Code (Terraform)
├── design-documentation/   # UX/UI design specifications
├── project-documentation/  # Architecture and planning docs
└── .claude/               # AI agent configurations
```

## Getting Started

### Prerequisites
- Node.js 20 LTS
- npm or yarn
- Expo CLI
- Docker (for local development)
- AWS CLI (for deployment)

### Local Development Setup

```bash
# Clone the repository
git clone https://github.com/[organization]/berthcare.git
cd berthcare

# Install dependencies
npm install

# Start local development environment
docker-compose up --build

# Run mobile app
cd mobile
npm start
```

## Development Workflow

### Branch Protection
- `main` branch requires 1+ code reviews
- All status checks must pass
- Signed commits required
- No direct pushes to main

### Code Review Process
- See CODEOWNERS file for review assignments
- All PRs require approval from designated code owners
- Automated tests must pass before merge

## Security & Compliance

- **Data Residency:** All data stored in Canadian AWS regions (ca-central-1)
- **Encryption:** End-to-end encryption for all data
- **Compliance:** PIPEDA compliant, SOC 2 pathway
- **Audit Trails:** Comprehensive logging for all data access

## Performance Targets

- **App Launch:** <2 seconds
- **UI Response:** <100ms
- **Auto-save:** <1 second
- **Background Sync:** <30 seconds
- **Alert Delivery:** <15 seconds

## Success Metrics (90-Day Pilot)

### Primary Metrics
- **Documentation time:** Target <10 minutes per visit (from 15-20 minutes)
- **After-hours charting:** Reduce from 3-5 hours/week to <1 hour/week
- **User adoption:** 80%+ of staff using app for majority of visits
- **Family satisfaction:** 70%+ report feeling better informed

## Contributing

Please read our contributing guidelines and code of conduct before submitting pull requests.

## License

See LICENSE file for details.

## Support

For technical support, please contact: support@berthcare.ca

## Documentation

- [Architecture Blueprint](./project-documentation/architecture-output.md)
- [MVP Specification](./project-documentation/mvp.md)
- [Design System](./design-documentation/README.md)
- [Task Plan](./project-documentation/task-plan.md)

---

**Built with ❤️ for home care nurses and the families they serve.**
