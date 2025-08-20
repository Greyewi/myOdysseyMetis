# Routes Usage Examples

This file contains practical examples of how to use the new organized routes structure.

## Basic Setup in Main Application

### Method 1: Using the Facade (Recommended)

```typescript
// main.ts or app.ts
import express from 'express';
import routes from './routes';

const app = express();

// Add middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount all routes at once with '/api' prefix
app.use('/api', routes);

// This creates the following endpoints:
// /api/goals/*     - All goal-related endpoints
// /api/users/*     - All user-related endpoints  
// /api/tasks/*     - All task-related endpoints
// /api/public/*    - All public endpoints

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### Method 2: Individual Router Mounting

```typescript
// main.ts or app.ts
import express from 'express';
import { goalsRouter, usersRouter, tasksRouter, publicRouter } from './routes';

const app = express();

// Add middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount routers individually (useful for different middleware per router)
app.use('/api/goals', goalsRouter);
app.use('/api/users', usersRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/public', publicRouter);

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

## Available Endpoints

### Goals Module (`/api/goals`)

```
POST   /api/goals                          # Create new goal
GET    /api/goals                          # Get user's goals
GET    /api/goals/all                      # Get all active goals
GET    /api/goals/:id                      # Get specific goal
PATCH  /api/goals/:id                      # Update goal
PATCH  /api/goals/:id/status               # Update goal status
PATCH  /api/goals/:id/difficulty           # Update goal difficulty
DELETE /api/goals/:id                      # Delete goal
POST   /api/goals/:id/image                # Upload goal image

# Wallet operations
POST   /api/goals/wallet/:id/update-balance    # Update wallet balance
PATCH  /api/goals/wallet/:goalId/refund-address # Update refund address
POST   /api/goals/wallet/:goalId/create        # Create additional wallet
GET    /api/goals/wallet/:id/monitoring-status # Start wallet monitoring

# AI features
POST   /api/goals/:id/reevaluate               # Reevaluate goal with AI
GET    /api/goals/:id/historical-insights      # Get historical insights
POST   /api/goals/:id/mark-complete            # Mark goal complete with AI

# Sharing
POST   /api/goals/:id/generate-share-token     # Generate share token
GET    /api/goals/shared/:shareToken           # Access shared goal (public)
DELETE /api/goals/:id/share-token              # Revoke share token

# Refunds
POST   /api/goals/:id/refund                   # Process refund
GET    /api/goals/:id/refund-status            # Get refund status

# Misc
GET    /api/goals/contract-owner-info          # Contract owner info
```

### Users Module (`/api/users`)

```
# User management endpoints (depends on user.ts implementation)
POST   /api/users/register                 # User registration
POST   /api/users/login                    # User login
GET    /api/users/profile                  # Get user profile
PATCH  /api/users/profile                  # Update user profile
```

### Tasks Module (`/api/tasks`)

```
# Task management endpoints (depends on tasks.ts implementation)
POST   /api/tasks                          # Create task
GET    /api/tasks                          # Get user's tasks
GET    /api/tasks/:id                      # Get specific task
PATCH  /api/tasks/:id                      # Update task
DELETE /api/tasks/:id                      # Delete task
```

### Public Module (`/api/public`)

```
# Public endpoints (no authentication required)
GET    /api/public/price-cache/*           # Price cache endpoints
GET    /api/public/goals/*                 # Public goals browsing
```

## Development Examples

### Adding a New Route to Existing Module

```typescript
// Add to goals/core-goals.ts
router.get('/:id/stats', authMiddleware, async (req: AuthenticatedRequest, res, next) => {
  try {
    const goalId = parseInt(req.params.id, 10);
    const userId = req.user?.id;
    
    // Your logic here
    const stats = await getGoalStats(goalId, userId);
    
    res.status(200).json(stats);
  } catch (err) {
    next(err);
  }
});
```

### Creating a New Module in Goals

```typescript
// Create goals/analytics.ts
import express, { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';

const router: Router = express.Router();

router.get('/:id/analytics', authMiddleware, async (req, res, next) => {
  // Your analytics logic
});

export default router;
```

Then add to `goals/index.ts`:
```typescript
import analyticsRouter from './analytics';

// In the main router setup
router.use('/', analyticsRouter);
```

### Creating a New Domain Module

1. Create new directory: `routes/notifications/`
2. Create `routes/notifications/index.ts`
3. Create specific files like `routes/notifications/email.ts`
4. Add to main `routes/index.ts`:

```typescript
import notificationsRouter from './notifications';

router.use('/notifications', notificationsRouter);

export {
  goalsRouter,
  usersRouter,
  tasksRouter,
  publicRouter,
  notificationsRouter
};
```

## Testing Examples

### Testing Individual Modules

```typescript
// tests/routes/goals/core-goals.test.ts
import request from 'supertest';
import express from 'express';
import coreGoalsRouter from '../../../src/routes/goals/core-goals';

const app = express();
app.use(express.json());
app.use('/goals', coreGoalsRouter);

describe('Core Goals Routes', () => {
  test('GET /goals should return user goals', async () => {
    const response = await request(app)
      .get('/goals')
      .set('Authorization', 'Bearer valid-token');
      
    expect(response.status).toBe(200);
  });
});
```

### Testing the Complete Routes Facade

```typescript
// tests/routes/index.test.ts
import request from 'supertest';
import express from 'express';
import routes from '../../src/routes';

const app = express();
app.use(express.json());
app.use('/api', routes);

describe('Routes Integration', () => {
  test('All endpoints should be accessible', async () => {
    // Test that all main routes are mounted
    const endpoints = ['/api/goals', '/api/users', '/api/tasks', '/api/public'];
    
    for (const endpoint of endpoints) {
      const response = await request(app).get(endpoint);
      expect(response.status).not.toBe(404);
    }
  });
});
```

## Migration Guide

### From Old Structure
```typescript
// OLD WAY
import goalsRouter from './routes/goals';
app.use('/api/goals', goalsRouter);
```

### To New Structure
```typescript
// NEW WAY - Method 1 (Recommended)
import routes from './routes';
app.use('/api', routes);

// NEW WAY - Method 2 (Granular control)
import { goalsRouter } from './routes';
app.use('/api/goals', goalsRouter);
```

The new structure maintains complete backward compatibility while providing better organization and development experience. 