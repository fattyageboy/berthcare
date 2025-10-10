# BerthCare Documentation

This directory contains technical documentation, completion summaries, and guides for the BerthCare project.

## Directory Structure

```
docs/
├── README.md                           # This file
├── E1-git-repository-initialization.md # Task E1: Git repository setup
├── E2-ci-pipeline-setup.md            # Task E2: CI/CD pipeline configuration
└── [future completion summaries]       # Additional task documentation
```

## Documentation Types

### Completion Summaries

Task completion summaries follow the naming pattern: `[TaskID]-[descriptive-name].md`

Each summary includes:

- Task overview and objectives
- Deliverables completed
- Verification checklist
- Next steps and dependencies
- Reference documentation

### Technical Guides

Located in `.github/` directory:

- `ci-setup.md` - CI/CD pipeline setup and troubleshooting
- `github-branch-protection-setup.md` - Branch protection configuration

### Architecture Documentation

Located in `project-documentation/` directory:

- `architecture-output.md` - Complete technical architecture
- `mvp.md` - MVP scope and features
- `task-plan.md` - Development task breakdown
- `product-manager-output.md` - Product requirements

### Design Documentation

Located in `design-documentation/` directory:

- Design system components
- Platform-specific guidelines
- Feature designs
- Accessibility standards

## Quick Links

### Setup Guides

- [Git Repository Setup](./E1-git-repository-initialization.md)
- [CI/CD Pipeline Setup](./E2-ci-pipeline-setup.md)
- [CI Configuration Guide](../.github/ci-setup.md)
- [Branch Protection Guide](../.github/github-branch-protection-setup.md)

### Architecture

- [Technical Architecture](../project-documentation/architecture-output.md)
- [MVP Scope](../project-documentation/mvp.md)
- [Task Plan](../project-documentation/task-plan.md)

### Design

- [Design System](../design-documentation/README.md)
- [Style Guide](../design-documentation/design-system/style-guide.md)

## Contributing Documentation

When completing a task, create a completion summary:

1. Use the naming pattern: `[TaskID]-[descriptive-name].md`
2. Include all required sections (see existing summaries as templates)
3. Update this README with a link to the new document
4. Cross-reference related documentation

## Maintenance

- Review and update documentation quarterly
- Archive outdated documentation to `docs/archive/`
- Keep links and references current
- Ensure code examples remain valid

---

**Last Updated**: October 10, 2025  
**Maintained By**: Tech Leads
