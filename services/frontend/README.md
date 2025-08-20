# MyOdyssey Frontend

A React-based web application for setting and tracking cryptocurrency goals with blockchain integration. Users can create goals, fund them with cryptocurrency, track progress, and interact with smart contracts on supported blockchain networks.

## 🚀 Quick Start

### Prerequisites

- Node.js (v20 or higher)
- npm or yarn package manager
- Git

### Installation

1. **Clone the repository** (if not already cloned):
   ```bash
   git clone <repository-url>
   cd myOdyssey/services/frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Configuration**:
   Create a `.env` file in the frontend directory with the following variables:
   ```env
   VITE_BACKEND_URL=http://localhost:3333
   ```

### Development

**Start the development server**:
```bash
npm run dev
```

The application will be available at `http://localhost:4200`

### Build & Deployment

**Build for production**:
```bash
npm run build
```

**Preview production build**:
```bash
npm run preview
```

**Docker deployment**:
```bash
# Build the application first
npm run build

# Build and run Docker container
docker build -t myodyssey-frontend .
docker run -p 4200:4200 myodyssey-frontend
```

## 🏗️ Architecture

### Tech Stack

- **Frontend Framework**: React 18.3.1 with TypeScript
- **Build Tool**: Vite 6.3.4
- **UI Framework**: Material-UI (MUI) 7.3.1 + Styled Components
- **State Management**: TanStack React Query 5.67.1
- **Blockchain Integration**: 
  - Wagmi 2.15.3 (Ethereum wallet integration)
  - Viem 2.29.4 (Ethereum client)
  - Reown AppKit 1.7.5 (Wallet connection UI)
- **Real-time Communication**: Socket.io Client 4.8.1
- **Routing**: React Router DOM

### Project Structure

```
src/
├── app/                    # Main application setup
│   ├── components/         # Shared app-level components
│   ├── api/               # API integration layer
│   ├── config.ts          # Blockchain and wallet configuration
│   ├── providers.tsx      # React providers setup
│   ├── theme.ts           # MUI theme configuration
│   └── app.tsx            # Main App component with routing
├── pages/                 # Page components (route handlers)
│   ├── Goals/             # Goals listing and public view
│   ├── MyGoals/           # User's personal goals
│   ├── NewGoal/           # Goal creation wizard
│   ├── GoalDetails/       # Goal management and tracking
│   ├── Profile/           # User profile management
│   └── HowItWorks/        # Information/onboarding pages
├── components/            # Reusable UI components
├── hooks/                 # Custom React hooks
│   ├── useWallet.ts       # Wallet connection and blockchain interactions
│   └── usePrices.ts       # Cryptocurrency price data
├── provider/              # Context providers
│   └── goalProvider.tsx   # Goals state management
├── services/              # External service integrations
├── types/                 # TypeScript type definitions
├── utils/                 # Utility functions
│   ├── contract.ts        # Smart contract interactions
│   ├── imageCompression.ts # Image processing utilities
│   ├── networkFilter.ts   # Blockchain network utilities
│   └── deviceDetection.ts # Device/platform detection
├── config.ts              # Environment configuration
└── main.tsx               # Application entry point
```

### Key Features

#### 🎯 Goal Management
- **Create Goals**: Set cryptocurrency savings targets with deadlines
- **Track Progress**: Real-time progress monitoring with AI assistance
- **Goal Categories**: Organize goals by type (savings, investment, etc.)
- **Image Support**: Custom goal images with compression

#### 💰 Blockchain Integration
- **Supported Networks**: 
  - Metis Hyperion Testnet (primary)
  - Mainnet, Polygon, Arbitrum, Optimism (configurable)
- **Wallet Support**: Multiple wallet providers via Reown AppKit
- **Smart Contracts**: Goal funding and management through blockchain
- **Real-time Price Data**: Live cryptocurrency price tracking

#### 🤖 AI Features
- **Goal Evaluation**: AI-powered goal assessment and recommendations
- **Progress Analysis**: Intelligent progress tracking and insights
- **Task Generation**: AI-generated tasks to help achieve goals

#### 🔄 Real-time Features
- **Live Updates**: Socket.io integration for real-time goal updates
- **Price Monitoring**: Continuous cryptocurrency price tracking
- **Notifications**: Real-time progress and milestone notifications

### Component Architecture

#### Core Components
- **Header**: Navigation and wallet connection
- **GoalCard**: Goal display and interaction
- **WalletConnect**: Blockchain wallet integration
- **SignTransaction**: Transaction signing interface

#### Page Components
- **Goals**: Public goals showcase and discovery
- **MyGoals**: Personal goal dashboard
- **GoalDetails**: Comprehensive goal management with tabs:
  - Info: Goal details and progress
  - Wallets: Funding wallet management
  - Tasks: AI-generated task tracking
  - Edit: Goal modification
  - AI: AI evaluation and insights

### State Management

- **React Query**: Server state and caching
- **GoalsProvider**: Global goals state management
- **Wagmi**: Blockchain/wallet state
- **Local State**: Component-specific state with React hooks

### API Integration

The frontend communicates with the backend API through:
- RESTful endpoints for CRUD operations
- Socket.io for real-time updates
- Blockchain RPC calls via wagmi/viem

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_BACKEND_URL` | Backend API URL | `http://localhost:3333` |

## 🔧 Development Workflow

### Code Structure Guidelines

- **Pages**: Route components in `src/pages/`
- **Components**: Reusable UI components in `src/components/`
- **Hooks**: Custom React hooks in `src/hooks/`
- **Utils**: Pure utility functions in `src/utils/`
- **Types**: TypeScript definitions in `src/types/`

### Styling

- Material-UI components with custom theme
- Styled-components for component-specific styling
- CSS-in-JS approach for maintainable styles

## 🌐 Blockchain Networks

Currently configured for:
- **Metis Hyperion Testnet** (Chain ID: 133717)
- Additional networks can be enabled in `src/app/config.ts`

## 📱 Mobile Support

- Responsive design for mobile devices
- Mobile wallet detection and integration
- Touch-optimized interactions

## 🚀 Deployment

The application can be deployed using:
- **Static hosting** (Vercel, Netlify, etc.)
- **Docker containers**
- **Traditional web servers** with the built static files

## 🛠️ Troubleshooting

### Common Issues

1. **Wallet Connection Issues**:
   - Ensure MetaMask or supported wallet is installed
   - Check network configuration matches supported chains

2. **API Connection**:
   - Verify `VITE_BACKEND_URL` environment variable
   - Ensure backend service is running

3. **Build Issues**:
   - Clear node_modules and reinstall dependencies
   - Check Node.js version compatibility

### Development Tips

- Use browser dev tools for wallet debugging
- Check console for blockchain transaction logs
- Use React Query DevTools for API state inspection