# MyOdyssey Showcase

A public-facing Next.js application that showcases public cryptocurrency goals from the MyOdyssey platform. This app provides a read-only view of community goals, allowing visitors to explore and discover what others are achieving with their crypto savings.

## 🚀 Quick Start

### Prerequisites

- Node.js (v20 or higher)
- npm or yarn package manager
- Git

### Installation

1. **Clone the repository** (if not already cloned):
   ```bash
   git clone <repository-url>
   cd myOdyssey/services/showcase
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Configuration**:
   Create a `.env.local` file in the showcase directory with the following variables:
   ```env
   NEXT_PUBLIC_API_URL=https://myodyssey.me/api
   # For local development:
   # NEXT_PUBLIC_API_URL=http://localhost:3333/api
   ```

### Development

**Start the development server**:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Build & Deployment

**Build for production**:
```bash
npm run build
```

**Start production server**:
```bash
npm run start
```

**Docker deployment**:
```bash
# Build and run Docker container
docker build -t myodyssey-showcase .
docker run -p 3000:3000 myodyssey-showcase
```

## 🏗️ Architecture

### Tech Stack

- **Frontend Framework**: Next.js 14.2.16 with App Router
- **Runtime**: React 18.3.1 with TypeScript
- **UI Framework**: Material-UI (MUI) 7.3.1 + Emotion
- **Styling**: CSS Modules + MUI System
- **Blockchain Integration**: Ethers.js 6.15.0
- **Real-time Communication**: Socket.io Client 4.8.1
- **Markdown Rendering**: React Markdown 10.1.0

### Project Structure

```
src/app/
├── components/             # Reusable UI components
│   ├── Header.tsx         # Site navigation and branding
│   ├── Footer.tsx         # Site footer with links
│   ├── Hero.tsx           # Landing page hero section
│   ├── GoalCard.tsx       # Individual goal display card
│   ├── GoalFilters.tsx    # Goal filtering and sorting
│   ├── GoalPagination.tsx # Pagination controls
│   ├── GoalsClient.tsx    # Client-side goals management
│   ├── SocialShare.tsx    # Social media sharing component
│   ├── WalletMonitor.tsx  # Wallet balance monitoring
│   └── UserAvatar.tsx     # User profile avatars
├── goals/
│   └── [id]/              # Dynamic goal detail pages
│       └── page.tsx       # Individual goal view
├── shared/
│   └── [shareToken]/      # Shared goal links
├── about/                 # About page
│   └── page.tsx           # Platform information
├── api/                   # API integration
│   ├── goals.ts           # Goals data fetching and transformation
│   └── hello/             # API health check
├── types/                 # TypeScript type definitions
│   ├── goals.ts           # Goal-related types
│   └── public-api.ts      # Public API response types
├── utils/                 # Utility functions
│   └── image.ts           # Image processing utilities
├── config.ts              # Environment configuration
├── providers.tsx          # React context providers
├── layout.tsx             # Root layout component
├── page.tsx               # Home page (goals listing)
└── globals.css            # Global styles
```

### Key Features

#### 🌟 **Public Goal Showcase**
- **Goal Discovery**: Browse public cryptocurrency goals from the community
- **Goal Details**: View comprehensive goal information including:
  - Target amounts and deadlines
  - Current progress and wallet balances
  - Goal descriptions and images
  - Wallet network information

#### 🔍 **Filtering & Search**
- **Category Filters**: Filter goals by category (savings, investment, etc.)
- **Network Filters**: Filter by blockchain network (Ethereum, Polygon, etc.)
- **Sorting Options**: Sort by deadline (ascending/descending)
- **Pagination**: Navigate through large sets of goals

#### 💰 **Blockchain Integration**
- **Multi-Network Support**: Display goals from various blockchain networks
- **Real-time Balances**: Live wallet balance updates
- **USD Conversion**: Real-time USD value calculations
- **Network Icons**: Visual network identification

#### 📱 **Social Features**
- **Social Sharing**: Share goals on social media platforms
- **Shareable Links**: Unique shareable URLs for individual goals
- **Public Profiles**: View goal creator information
- **Goal Images**: Custom goal images and visual content

#### 🎨 **User Experience**
- **Responsive Design**: Mobile-first responsive layout
- **Loading States**: Skeleton loaders for better UX
- **SEO Optimized**: Server-side rendering for search engines
- **Performance**: Optimized images and caching strategies

### Component Architecture

#### **Layout Components**
- **Header**: Navigation with MyOdyssey branding
- **Footer**: Links and additional information
- **Layout**: Root layout with consistent structure

#### **Goal Components**
- **GoalCard**: Individual goal display with progress visualization
- **GoalDetailClient**: Comprehensive goal detail view
- **GoalFilters**: Advanced filtering and sorting options
- **GoalPagination**: Navigation through goal pages

#### **UI Components**
- **Hero**: Landing page hero section
- **WalletMonitor**: Real-time wallet balance display
- **SocialShare**: Social media integration
- **UserAvatar**: User profile image display

### Data Flow

1. **Server-Side Rendering**: Goals are fetched on the server for SEO
2. **Client Hydration**: Interactive features are enabled client-side
3. **Real-time Updates**: Socket.io provides live balance updates
4. **API Integration**: REST API calls to the MyOdyssey backend
5. **Image Optimization**: Next.js image optimization for performance

### API Integration

The showcase app communicates with the MyOdyssey backend through:
- **Public API Endpoints**: Read-only access to public goals
- **Image Assets**: Optimized image serving from uploads directory
- **Real-time Updates**: Socket.io for live data updates
- **CORS Configuration**: Proper cross-origin resource sharing

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `https://myodyssey.me/api` |

## 🔧 Development Workflow

### Code Structure Guidelines

- **Pages**: Route components in `src/app/` following Next.js App Router
- **Components**: Reusable UI components in `src/app/components/`
- **Types**: TypeScript definitions in `src/app/types/`
- **Utils**: Pure utility functions in `src/app/utils/`
- **API**: Data fetching logic in `src/app/api/`

### Styling Approach

- **CSS Modules**: Component-scoped styles with `.module.css` files
- **Material-UI**: Consistent design system with MUI components
- **Emotion**: CSS-in-JS for dynamic styling
- **Responsive Design**: Mobile-first approach with breakpoints

### Performance Optimizations

- **Server-Side Rendering**: Initial page load optimization
- **Image Optimization**: Next.js automatic image optimization
- **Caching**: Strategic caching headers for static assets
- **Code Splitting**: Automatic code splitting by Next.js

## 🌐 Deployment

### Production Configuration

- **Static Generation**: Pre-generated pages where possible
- **CDN Integration**: Optimized for CDN deployment
- **SEO Optimization**: Meta tags and structured data
- **Performance Monitoring**: Core Web Vitals optimization

### Deployment Options

- **Vercel**: Recommended for Next.js applications
- **Docker**: Containerized deployment with provided Dockerfile
- **Static Hosting**: Can be deployed as static site in some configurations
- **Traditional Servers**: Node.js server deployment

## 🔗 Integration

### Backend Dependencies

- Requires the MyOdyssey backend API running
- Fetches data from `/api/goals/public` endpoints
- Uses image assets from `/uploads/` directory
- Connects to Socket.io for real-time updates

### Content Management

- Goals are managed through the main MyOdyssey frontend app
- Showcase displays only public goals (marked as shareable)
- Real-time synchronization with the main platform
- Automatic content updates when goals are published

## 🛠️ Troubleshooting

### Common Issues

1. **API Connection Issues**:
   - Verify `NEXT_PUBLIC_API_URL` environment variable
   - Ensure backend API is accessible and running
   - Check CORS configuration in backend

2. **Image Loading Issues**:
   - Verify image domains in `next.config.js`
   - Check upload directory permissions
   - Ensure proper image URL construction

3. **Build Issues**:
   - Clear `.next` directory and rebuild
   - Check Node.js version compatibility
   - Verify all dependencies are installed

### Development Tips

- Use Next.js DevTools for debugging
- Check browser console for API errors
- Monitor network requests for data fetching issues
- Use React Developer Tools for component debugging
