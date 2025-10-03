# BerthCare Documentation

This directory contains all project documentation organized by category.

## 📁 Directory Structure

```
docs/
├── README.md                    # This file
├── architecture-living.md       # Living architecture documentation
├── setup/                       # Environment and infrastructure setup
├── guides/                      # How-to guides and references
├── tasks/                       # Task completion reports
└── pull-requests/              # PR descriptions and merge reports
```

## 📂 Categories

### 🔧 Setup (`/setup`)
Environment configuration, infrastructure setup, and initial project configuration.

- **E3_COMPLETION_REPORT.md** - Local development environment setup (Docker, PostgreSQL, Redis, MinIO)
- **E4_COMPLETION_REPORT.md** - Auth0 development tenant configuration
- **GITHUB-SETUP.md** - GitHub repository and CI/CD setup
- **LOCAL_DEVELOPMENT.md** - Local development guide and troubleshooting

### 📖 Guides (`/guides`)
How-to guides, quick starts, and reference documentation.

- **TASK_B18_QUICK_START.md** - Quick start guide for photo upload feature
- **SEED_DATA_GUIDE.md** - Database seeding guide
- **QUICK_REFERENCE.md** - Quick reference for common commands and operations
- **PROJECT_STRUCTURE.txt** - Project directory structure overview
- **NEXT_STEPS_BACKEND_SCAFFOLD.md** - Next steps after backend scaffold

### ✅ Tasks (`/tasks`)
Completion reports and summaries for implemented tasks.

- **B5_SEED_DATA_COMPLETION.md** - Seed data implementation (Task B5)
- **TASK_B8_COMPLETION_SUMMARY.md** - Backend scaffold completion (Task B8)
- **TASK_B9_RBAC_IMPLEMENTATION_SUMMARY.md** - RBAC implementation (Task B9)
- **TASK_B10_COMPLETION_SUMMARY.md** - User service completion (Task B10)
- **TASK_B11_USER_AUTH_COMPLETION_REPORT.md** - User authentication (Task B11)
- **TASK_B18_PHOTO_UPLOAD_COMPLETION_REPORT.md** - Photo upload to S3 (Task B18)

### 🔀 Pull Requests (`/pull-requests`)
PR descriptions and merge completion reports.

- **PR_DESCRIPTION_BACKEND_SCAFFOLD.md** - Backend scaffold PR description
- **PR_DESCRIPTION_USER_AUTH.md** - User authentication PR description
- **MERGE_COMPLETION_REPORT.md** - Merge completion report

## 🏗️ Architecture

- **architecture-living.md** - Living architecture document (updated as system evolves)
- See also: `/project-documentation/architecture-output.md` for full architecture specification

## 🔍 Finding Documentation

### By Topic

**Getting Started:**
- Setup: `setup/LOCAL_DEVELOPMENT.md`
- Quick Reference: `guides/QUICK_REFERENCE.md`

**Features:**
- Photo Upload: `guides/TASK_B18_QUICK_START.md` + `tasks/TASK_B18_PHOTO_UPLOAD_COMPLETION_REPORT.md`
- User Authentication: `tasks/TASK_B11_USER_AUTH_COMPLETION_REPORT.md`
- RBAC: `tasks/TASK_B9_RBAC_IMPLEMENTATION_SUMMARY.md`

**Infrastructure:**
- Docker Setup: `setup/E3_COMPLETION_REPORT.md`
- Auth0 Setup: `setup/E4_COMPLETION_REPORT.md`
- GitHub/CI: `setup/GITHUB-SETUP.md`

**Database:**
- Seed Data: `guides/SEED_DATA_GUIDE.md` + `tasks/B5_SEED_DATA_COMPLETION.md`

### By Task ID

| Task | Document | Location |
|------|----------|----------|
| E3 | Local Development Environment | `setup/E3_COMPLETION_REPORT.md` |
| E4 | Auth0 Configuration | `setup/E4_COMPLETION_REPORT.md` |
| B5 | Seed Data | `tasks/B5_SEED_DATA_COMPLETION.md` |
| B8 | Backend Scaffold | `tasks/TASK_B8_COMPLETION_SUMMARY.md` |
| B9 | RBAC Implementation | `tasks/TASK_B9_RBAC_IMPLEMENTATION_SUMMARY.md` |
| B10 | User Service | `tasks/TASK_B10_COMPLETION_SUMMARY.md` |
| B11 | User Authentication | `tasks/TASK_B11_USER_AUTH_COMPLETION_REPORT.md` |
| B18 | Photo Upload to S3 | `tasks/TASK_B18_PHOTO_UPLOAD_COMPLETION_REPORT.md` |

## 📝 Documentation Standards

### Task Completion Reports
Each task completion report should include:
- Task overview and requirements
- Implementation summary
- Files created/modified
- Testing instructions
- Known limitations
- Next steps

### Guides
Guides should be:
- Action-oriented with clear steps
- Include code examples
- Provide troubleshooting tips
- Reference related documentation

### PR Descriptions
PR descriptions should include:
- Summary of changes
- Testing performed
- Breaking changes (if any)
- Related issues/tasks

## 🔗 Related Documentation

- **Project Documentation**: `/project-documentation/` - Product specs, architecture, planning
- **Design Documentation**: `/design-documentation/` - Design artifacts (if any)
- **Backend README**: `/backend/README.md` - Backend-specific documentation
- **Service READMEs**: `/backend/src/services/*/README.md` - Individual service documentation

## 📊 Documentation Status

| Category | Files | Status |
|----------|-------|--------|
| Setup | 4 | ✅ Complete |
| Guides | 5 | ✅ Complete |
| Tasks | 6 | ✅ Complete |
| Pull Requests | 3 | ✅ Complete |

**Last Updated**: 2025-10-02

---

For questions or suggestions about documentation, please contact the development team.
