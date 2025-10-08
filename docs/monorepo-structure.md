# BerthCare Monorepo Structure

This document describes the Nx monorepo structure for the BerthCare project.

## Workspace Structure

```
berthcare/
├── apps/
│   ├── mobile/          # React Native mobile app (iOS/Android)
│   └── backend/         # Node.js/Express backend API
├── libs/
│   └── shared/          # Shared types, utilities, and constants
├── docs/                # Project documentation
├── nx.json              # Nx workspace configuration
├── tsconfig.json        # Root TypeScript configuration
└── package.json         # Root package.json with workspace scripts
```

## Applications

### Mobile App (`apps/mobile`)
- React Native application using Expo
- Offline-first architecture with SQLite
- Targets iOS and Android platforms
- To be implemented in Phase M

### Backend API (`apps/backend`)
- Node.js/Express REST API
- PostgreSQL database with Redis caching
- AWS S3 for file storage
- To be implemented in Phase B

## Libraries

### Shared Library (`libs/shared`)
- Shared TypeScript types and interfaces
- Common utility functions
- Constants and configuration
- Used by both mobile and backend apps

## Nx Commands

### Run tasks across all projects
```bash
npm run lint              # Lint all projects
npm run type-check        # Type-check all projects
npm run test              # Test all projects
npm run build             # Build all projects
```

### Run tasks on affected projects only
```bash
npm run lint:affected         # Lint only affected projects
npm run type-check:affected   # Type-check only affected projects
npm run test:affected         # Test only affected projects
npm run build:affected        # Build only affected projects
```

### Run tasks for specific projects
```bash
nx lint backend           # Lint backend only
nx test mobile            # Test mobile only
nx build shared           # Build shared library only
```

### Run multiple tasks in parallel
```bash
nx run-many -t lint test  # Run lint and test on all projects
```

## Path Aliases

The monorepo uses TypeScript path aliases for clean imports:

```typescript
// Import from shared library
import { User, Client } from '@berthcare/shared';
```

## Caching

Nx provides intelligent caching for all tasks:
- Build outputs are cached locally
- Test results are cached
- Lint results are cached
- Remote caching available via Nx Cloud (optional)

## Task Dependencies

Tasks are configured with proper dependencies:
- `build` depends on building dependencies first
- `test` uses production builds of dependencies
- `lint` and `type-check` run independently

## Adding New Projects

To add a new app or library:

1. Create the project directory under `apps/` or `libs/`
2. Add `project.json` with task configuration
3. Add `tsconfig.json` extending root config
4. Add `.eslintrc.json` extending root config
5. Add `jest.config.js` if needed
6. Update path aliases in root `tsconfig.json` if needed

## Best Practices

1. **Keep shared code in libs**: Common types, utilities, and constants belong in `libs/shared`
2. **Use path aliases**: Import from `@berthcare/shared` instead of relative paths
3. **Run affected commands**: Use `affected` commands in CI to only test changed code
4. **Leverage caching**: Nx caching speeds up repeated builds and tests
5. **Tag projects**: Use tags in `project.json` for better organization and constraints

## Next Steps

- **Phase E4**: Set up local development environment with Docker Compose
- **Phase B**: Implement backend core infrastructure
- **Phase M**: Implement mobile app with React Native/Expo
