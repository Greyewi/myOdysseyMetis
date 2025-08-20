# Routes Structure

This directory contains all API route handlers organized by functional domains for better maintainability and scalability.

## Directory Structure

```
routes/
├── index.ts                # Main router facade - combines all routers
├── README.md               # This file - overall documentation
├── goals/                  # Goals-related functionality
│   ├── index.ts           # Router combiner for all goals modules
│   ├── core-goals.ts      # Core CRUD operations for goals  
│   ├── wallets.ts         # Wallet-related operations
│   ├── ai-features.ts     # AI functionality (evaluation, insights, completion)
│   ├── sharing.ts         # Public sharing and token management
│   ├── refunds.ts         # Refund processing
│   ├── misc.ts            # Miscellaneous endpoints
│   ├── types.ts           # Common types and interfaces
│   └── README.md          # Goals module detailed documentation
├── users/                  # User-related functionality
│   ├── index.ts           # User router entry point
│   └── user.ts            # User management endpoints
├── tasks/                  # Task-related functionality
│   ├── index.ts           # Tasks router entry point
│   └── tasks.ts           # Task management endpoints
└── public/                 # Public endpoints
    ├── index.ts           # Public router entry point
    ├── priceCache.ts      # Price cache endpoints
    └── publicGoals.ts     # Public goals endpoints
```

## API Endpoints Overview

### Goals (`/api/goals`)
Comprehensive goal management system with wallet integration, AI features, and sharing capabilities.
- **Core Operations**: Create, read, update, delete goals
- **Wallet Management**: Balance tracking, refund addresses, monitoring
- **AI Features**: Goal evaluation, insights, completion validation
- **Sharing**: Public goal sharing with tokens
- **Refunds**: Processing refunds for completed goals

### Users (`/api/users`)
User authentication, profile management, and user-related operations.
- User registration and login
- Profile management
- User preferences and settings

### Tasks (`/api/tasks`)
Task management system for goals.
- Task creation and management
- Task completion tracking
- Task prioritization and sequencing

### Public (`/api/public`)
Public endpoints that don't require authentication.
- **Price Cache**: Token price information
- **Public Goals**: Browse goals without authentication

## Route Organization Principles

### 1. Domain-Driven Structure
Routes are organized by business domain (goals, users, tasks, public) rather than by technical concerns.

### 2. Hierarchical Organization
Complex domains (like goals) are further subdivided into functional modules:
- Core operations
- Related functionality (wallets, AI features)
- Cross-cutting concerns (sharing, refunds)

### 3. Index Files
Each directory has an `index.ts` that serves as the main entry point and combines sub-modules.

### 4. Facade Pattern
The main `index.ts` serves as a facade that combines all domain routers into a single entry point.

### 5. Shared Resources
Common types, interfaces, and utilities are co-located with their primary domain.

## Usage in Main Application

### Simple Usage (Recommended)
```typescript
import express from 'express';
import routes from './routes';

const app = express();

// Mount all routes at once
app.use('/api', routes);
```

### Granular Usage (If needed)
```typescript
import express from 'express';
import { goalsRouter, usersRouter, tasksRouter, publicRouter } from './routes';

const app = express();

// Mount individual routers
app.use('/api/goals', goalsRouter);
app.use('/api/users', usersRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/public', publicRouter);
```

## Router Facade Structure

The main `index.ts` combines all routers:

```typescript
import express, { Router } from 'express';
import goalsRouter from './goals';
import usersRouter from './users';
import tasksRouter from './tasks';
import publicRouter from './public';

const router: Router = express.Router();

// Mount all routers
router.use('/goals', goalsRouter);
router.use('/users', usersRouter);
router.use('/tasks', tasksRouter);
router.use('/public', publicRouter);

export default router;

// Export individual routers for direct access if needed
export {
  goalsRouter,
  usersRouter,
  tasksRouter,
  publicRouter
};
```

## Development Guidelines

### Adding New Routes

1. **Determine Domain**: Identify which functional domain the new route belongs to
2. **Choose Location**: 
   - Add to existing module if it fits naturally
   - Create new module within domain if it's a new functional area
   - Create new domain directory if it's entirely new business functionality
3. **Update Facade**: Add new domain router to main `index.ts` if creating new domain
4. **Follow Patterns**: Use existing modules as templates for structure and organization
5. **Update Documentation**: Update relevant README files

### Module Structure

Each route module should follow this pattern:

```typescript
// Imports
import express, { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
// ... other imports

// Types and interfaces (or import from types.ts)
interface AuthenticatedRequest extends Request {
  user?: { id: number, address: string };
}

// Router setup
const router: Router = express.Router();

// Route handlers
router.get('/', handler);
router.post('/', handler);
// ... other routes

// Export
export default router;
```

### Best Practices

1. **Single Responsibility**: Each module should have a clear, focused purpose
2. **Consistent Error Handling**: Use consistent error response formats
3. **Input Validation**: Validate all inputs using Joi or similar
4. **Authentication**: Apply appropriate authentication middleware
5. **Documentation**: Keep README files updated with any changes
6. **Testing**: Write tests for each module independently
7. **Facade Usage**: Use the main facade for standard application setup

## Benefits

- **Maintainability**: Easy to find and modify specific functionality
- **Scalability**: New features can be added without affecting other areas
- **Team Development**: Multiple developers can work on different modules simultaneously
- **Testing**: Individual modules can be tested in isolation
- **Code Organization**: Clear separation of concerns
- **Reusability**: Shared utilities and types are easily accessible
- **Simple Integration**: Single entry point for the entire routing system

## Migration from Legacy Structure

The original monolithic route files have been refactored into this modular structure while maintaining:
- All existing API endpoints and paths
- Backward compatibility
- Original functionality and behavior
- Existing authentication and authorization
- Error handling patterns
- Simplified integration through facade pattern 