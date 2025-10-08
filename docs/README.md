# BerthCare Documentation

This directory contains technical documentation for the BerthCare project.

## Quick Links

### Getting Started
- **[Quick Start Guide](quick-start.md)** - Get up and running quickly with the CI pipeline

### CI/CD Pipeline (Task E2)
- **[CI Setup Documentation](ci-setup.md)** - Complete CI pipeline documentation
- **[GitHub Branch Protection Setup](github-branch-protection-setup.md)** - Step-by-step guide for branch protection
- **[E2 Completion Summary](E2-completion-summary.md)** - Task E2 deliverables and status

### Project Documentation
- **[Architecture Blueprint](../project-documentation/architecture-output.md)** - Complete technical architecture
- **[Task Plan](../project-documentation/task-plan.md)** - Implementation roadmap
- **[MVP Specification](../project-documentation/mvp.md)** - MVP requirements

### Design Documentation
- **[Design System](../design-documentation/design-system/)** - UI/UX design system
- **[Feature Specifications](../design-documentation/features/)** - Feature-specific designs

## Documentation Structure

```
docs/
├── README.md                              # This file
├── quick-start.md                         # Quick start guide
├── ci-setup.md                            # CI pipeline documentation
├── github-branch-protection-setup.md      # Branch protection guide
└── E2-completion-summary.md               # Task E2 summary

project-documentation/
├── architecture-output.md                 # Technical architecture
├── task-plan.md                           # Implementation plan
├── mvp.md                                 # MVP specification
└── product-manager-output.md              # Product requirements

design-documentation/
├── design-system/                         # Design system
│   ├── components/                        # Component specifications
│   ├── tokens/                            # Design tokens
│   └── platform-adaptations/              # Platform-specific guidelines
├── features/                              # Feature designs
└── accessibility/                         # Accessibility guidelines
```

## For Developers

### First Time Setup
1. Read [Quick Start Guide](quick-start.md)
2. Install dependencies: `npm ci`
3. Run checks: `npm run lint && npm test`

### Before Every Commit
1. Format code: `npm run format`
2. Fix linting: `npm run lint -- --fix`
3. Run tests: `npm test`

### Creating Pull Requests
1. Create feature branch
2. Make changes
3. Run all checks locally
4. Push and create PR
5. Wait for CI to pass
6. Request review

## For DevOps Engineers

### CI/CD Setup
- [CI Setup Documentation](ci-setup.md) - Complete pipeline setup
- [Branch Protection Guide](github-branch-protection-setup.md) - GitHub configuration

### Infrastructure Tasks
- E1: Initialize Git repository ✅
- E2: Set up CI bootstrap ✅
- E3: Configure monorepo structure (next)
- E4: Set up local development environment (next)
- E5: Configure AWS infrastructure (next)
- E6: Set up monitoring & observability (next)

## For Project Managers

### Project Status
- **Current Phase**: E - Environment & Tooling
- **Completed Tasks**: E1, E2
- **Next Tasks**: E3, E4, E5, E6
- **Timeline**: See [Task Plan](../project-documentation/task-plan.md)

### Key Documents
- [Architecture Blueprint](../project-documentation/architecture-output.md) - Technical decisions
- [MVP Specification](../project-documentation/mvp.md) - Product scope
- [Task Plan](../project-documentation/task-plan.md) - Implementation roadmap

## For Designers

### Design Resources
- [Design System](../design-documentation/design-system/) - Complete design system
- [Style Guide](../design-documentation/design-system/style-guide.md) - Visual design guidelines
- [Components](../design-documentation/design-system/components/) - Component specifications
- [Accessibility](../design-documentation/accessibility/) - WCAG compliance

## Contributing

### Documentation Standards
- Use Markdown for all documentation
- Include code examples where relevant
- Keep documentation up to date with code changes
- Link to related documents

### File Naming
- Use kebab-case: `my-document.md`
- Be descriptive: `ci-setup.md` not `setup.md`
- Include task IDs where relevant: `E2-completion-summary.md`

### Document Structure
1. Title and overview
2. Prerequisites (if applicable)
3. Main content with clear sections
4. Examples and code snippets
5. Troubleshooting (if applicable)
6. References and links

## Need Help?

- **CI/CD Issues**: See [CI Setup](ci-setup.md) troubleshooting section
- **Development Setup**: See [Quick Start Guide](quick-start.md)
- **Architecture Questions**: See [Architecture Blueprint](../project-documentation/architecture-output.md)
- **Design Questions**: See [Design Documentation](../design-documentation/)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Oct 7, 2025 | Initial documentation for E2 completion |

## References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Jest Documentation](https://jestjs.io/)
- [ESLint Documentation](https://eslint.org/)
- [Prettier Documentation](https://prettier.io/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
