# Goals Routes Refactoring

The original `goals.ts` file (nearly 2000 lines) has been refactored into multiple focused modules for better maintainability and organization.

## New File Structure

```
routes/
├── goalsRouter.ts          # Main goals router entry point
├── goals/                  # Goals-related functionality
│   ├── index.ts           # Router combiner for all goals modules
│   ├── core-goals.ts      # Core CRUD operations for goals  
│   ├── wallets.ts         # Wallet-related operations
│   ├── ai-features.ts     # AI functionality (evaluation, insights, completion)
│   ├── sharing.ts         # Public sharing and token management
│   ├── refunds.ts         # Refund processing
│   ├── misc.ts            # Miscellaneous endpoints
│   ├── types.ts           # Common types and interfaces
│   └── README.md          # This documentation
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

## Module Breakdown

### Goals Module (`goals/`)

#### 1. Core Goals (`core-goals.ts`)
**Main CRUD operations for goals**

- `POST /` - Create new goal with wallet
- `GET /all` - Get all active (published) goals
- `GET /` - Get user's goals  
- `GET /:id` - Get single goal by ID
- `PATCH /:id` - Update goal
- `PATCH /:id/status` - Update goal status
- `PATCH /:id/difficulty` - Update goal difficulty
- `DELETE /:id` - Delete goal
- `POST /:id/image` - Upload image for goal

#### 2. Wallets (`wallets.ts`)
**Wallet management and balance operations**

- `POST /:id/update-balance` - Update wallet balance
- `PATCH /:goalId/refund-address` - Update refund address for wallet
- `POST /:goalId/create` - Create additional wallet for goal
- `GET /:id/monitoring-status` - Start/check wallet monitoring

#### 3. AI Features (`ai-features.ts`)
**AI-powered functionality**

- `POST /:id/reevaluate` - Reevaluate goal with AI
- `GET /:id/historical-insights` - Get historical insights for goal
- `POST /:id/mark-complete` - Mark goal as complete with AI validation

#### 4. Sharing (`sharing.ts`)
**Public access and sharing functionality**

- `POST /:id/generate-share-token` - Generate share token for goal
- `GET /shared/:shareToken` - Access goal by share token (public)
- `DELETE /:id/share-token` - Revoke share token

#### 5. Refunds (`refunds.ts`)
**Refund processing**

- `POST /:id/refund` - Process refund for completed goal
- `GET /:id/refund-status` - Get refund status for goal

#### 6. Miscellaneous (`misc.ts`)
**Other utility endpoints**

- `GET /contract-owner-info` - Test contract owner configuration

#### 7. Types (`types.ts`)
**Common interfaces and types**

- `AuthenticatedRequest` - Request interface with user info
- Various response types, filters, and data structures

### Other Modules

#### Users Module (`users/`)
- User authentication and profile management
- User settings and preferences

#### Tasks Module (`tasks/`)
- Task creation and management
- Task completion tracking

#### Public Module (`public/`)
- Public price cache endpoints
- Public goals browsing (without authentication)

## Route Mounting

The main routers are organized as follows:

### Goals Router (`goals/index.ts`)
```typescript
router.use('/', coreGoalsRouter);           // Core CRUD operations
router.use('/wallet', walletsRouter);       // Wallet operations  
router.use('/', aiFeaturesRouter);          // AI features
router.use('/', sharingRouter);             // Sharing functionality
router.use('/', refundsRouter);             // Refund operations
router.use('/', miscRouter);                // Misc endpoints
```

### Public Router (`public/index.ts`)
```typescript
router.use('/price-cache', priceCacheRouter);
router.use('/goals', publicGoalsRouter);
```

## Import Structure

Each folder has an `index.ts` file that serves as the entry point:

```typescript
// From main application
import goalsRouter from './routes/goalsRouter';
import usersRouter from './routes/users';
import tasksRouter from './routes/tasks';
import publicRouter from './routes/public';

// Usage in main app
app.use('/api/goals', goalsRouter);
app.use('/api/users', usersRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/public', publicRouter);
```

## Benefits of This Structure

1. **Modularity** - Each functional area is self-contained
2. **Maintainability** - Easy to find and modify specific functionality
3. **Scalability** - New features can be added to appropriate modules
4. **Team Development** - Different teams can work on different modules
5. **Testing** - Individual modules can be tested in isolation
6. **Code Organization** - Clear separation of concerns
7. **Reusability** - Common types and utilities are shared appropriately

## Migration Notes

- All existing endpoint paths remain the same
- No breaking changes to the API
- Original functionality is preserved
- Error handling and validation remain intact
- All middleware and dependencies are properly imported
- Main entry point changed from `goals.ts` to `goalsRouter.ts`

## Future Improvements

- Add proper TypeScript types to eliminate linter errors
- Implement unit tests for each module
- Add API documentation with OpenAPI/Swagger
- Consider adding middleware for common validations
- Implement rate limiting per module if needed
- Add request/response validation schemas
- Implement proper error handling middleware for each module 