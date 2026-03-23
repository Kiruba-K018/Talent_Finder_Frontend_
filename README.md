# Talent Finder - Frontend

Resume sourcing and shortlisting application. A modern, responsive React-based web application for recruiters to manage job postings, search candidates, create shortlists, and orchestrate the recruitment workflow.

## Project Overview

The Talent Finder Frontend is a comprehensive recruitment management interface that enables recruiters to:

- **Job Management**: Create, edit, and manage job postings
- **Candidate Search**: Search and filter candidates across multiple attributes
- **Candidate Sourcing**: Trigger LinkedIn sourcing and manage sourced candidates
- **Shortlist Management**: Create and manage candidate shortlists per job
- **Candidate Profiles**: View detailed candidate information and resumes
- **Admin Dashboard**: System administration and user management
- **Real-time Notifications**: Stay updated on sourcing jobs and matches

### Key Features

- **Responsive Design**: Mobile-friendly UI with Tailwind CSS
- **Modern Tech Stack**: React 18, TypeScript, Vite
- **State Management**: Redux for predictable state management
- **API Integration**: Axios with custom interceptors for backend communication
- **Authentication**: JWT-based auth with secure token management
- **Role-Based Access Control**: Different views for Admin, Recruiter, and ViewOnly roles
- **Dark Mode Support**: Theme switching capability
- **Real-time Updates**: WebSocket support for live notifications
- **Form Validation**: Client-side validation with Pydantic-style schemas
- **Error Handling**: Comprehensive error handling with user feedback

### Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite (lightning-fast dev server and builds)
- **Styling**: Tailwind CSS with PostCSS
- **HTTP Client**: Axios with custom interceptors
- **State Management**: Redux Toolkit
- **UI Components**: Custom React components
- **Development**: Node.js 18+, npm 9+
- **Linting**: ESLint, Prettier
- **Testing**: Vitest, React Testing Library (optional)

## Setup Instructions

### Prerequisites

- **Node.js**: 18.0.0 or higher
- **npm**: 9.0.0 or higher (or yarn/pnpm)
- **Git**: For version control
- **Backend Services**: Running Core and Sourcing services

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Talent_Finder_FrontEnd/Talent_Finder_Frontend_
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Verify installation**
   ```bash
   npm run build
   ```

### Troubleshooting Installation

```bash
# Clear npm cache if dependencies fail
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Update npm to latest version
npm install -g npm@latest
```

## Environment Variables

### API Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend Core service URL | `http://localhost:8000` |
| `VITE_SOURCING_API_URL` | Sourcing service URL | `http://localhost:8001` |
| `VITE_API_TIMEOUT` | API request timeout (ms) | `30000` |

### Authentication

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_JWT_STORAGE_KEY` | LocalStorage key for JWT token | `talent_finder_token` |
| `VITE_AUTH_REDIRECT_URI` | Auth redirect after login | `/dashboard` |
| `VITE_LOGIN_ROUTE` | Login page route | `/login` |

### Feature Flags

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_ENABLE_SOURCING` | Enable LinkedIn sourcing feature | `true` |
| `VITE_ENABLE_DARK_MODE` | Enable dark mode theme | `true` |
| `VITE_ENABLE_WEBSOCKET` | Enable real-time updates | `false` |
| `VITE_ENABLE_ANALYTICS` | Enable Google Analytics | `false` |

### Logging & Debugging

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_LOG_LEVEL` | Console log level (debug/info/warn/error) | `info` |
| `VITE_DEBUG_MODE` | Enable debug mode in console | `false` |

### Third-Party Services

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_GOOGLE_ANALYTICS_ID` | Google Analytics tracking ID | `G-XXXXX` |
| `VITE_SENTRY_DSN` | Sentry error tracking DSN | `https://key@sentry.io/project` |

### Example `.env.local`

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8000
VITE_SOURCING_API_URL=http://localhost:8001
VITE_API_TIMEOUT=30000

# Authentication
VITE_JWT_STORAGE_KEY=talent_finder_token
VITE_AUTH_REDIRECT_URI=/dashboard
VITE_LOGIN_ROUTE=/login

# Features
VITE_ENABLE_SOURCING=true
VITE_ENABLE_DARK_MODE=true
VITE_ENABLE_WEBSOCKET=false
VITE_ENABLE_ANALYTICS=false

# Debugging
VITE_LOG_LEVEL=info
VITE_DEBUG_MODE=false
```

## Running Development Server

### Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (Vite default port)

### Development Server Features

- **Hot Module Replacement (HMR)**: Changes instantly reflect in browser
- **Fast Refresh**: React component updates without full page reload
- **Source Maps**: Debug TypeScript with original source code
- **Network Tab**: Inspect API requests and responses

### Customize Dev Server Port

```bash
# Change port
npm run dev -- --port 3000

# Open browser automatically
npm run dev -- --open

# Use specific host
npm run dev -- --host 0.0.0.0
```

### Additional Commands

```bash
# Run with debug logging
DEBUG=* npm run dev

# Run with source maps
npm run dev -- --sourcemap

# Type checking while developing
npm run type-check -- --watch
```

## Building for Production

### Create Production Build

```bash
npm run build
```

Optimized build output will be in the `dist/` directory:
- Minified JavaScript bundles
- CSS optimization and purging
- Static asset optimization
- Source maps (optional)

### Preview Production Build

```bash
npm run preview
```

Local preview at `http://localhost:4173`

### Build Optimization Tips

```bash
# Analyze bundle size
npm run build -- --analyze

# Build with detailed logs
npm run build -- --debug

# Disable minification (for debugging)
npm run build -- --minify=false
```

### Production Build Output

```
dist/
├── index.html           # Main HTML file
├── assets/
│   ├── index-[hash].js  # Main bundle
│   ├── index-[hash].css # Main styles
│   └── ...              # Other assets
└── manifest.json        # Asset manifest
```

### Deployment

```bash
# Build for staging
VITE_API_BASE_URL=https://staging-api.example.com npm run build

# Build for production
VITE_API_BASE_URL=https://api.example.com npm run build

# Deploy to server
scp -r dist/* user@server:/var/www/html/
```

## Project Structure

```
Talent_Finder_Frontend_/
├── src/
│   ├── api/                      # API integration layer
│   │   ├── axiosInstance.ts      # Axios configuration
│   │   └── index.ts              # API client functions
│   │
│   ├── components/               # Reusable UI components
│   │   ├── Badge.tsx             # Badge component
│   │   ├── Button.tsx            # Button component
│   │   ├── Card.tsx              # Card component
│   │   └── ...                   # Other components
│   │
│   ├── features/                 # Feature-based modules
│   │   ├── admin/                # Admin dashboard feature
│   │   ├── auth/                 # Authentication feature
│   │   ├── candidates/           # Candidate management
│   │   ├── jobs/                 # Job management
│   │   ├── shortlists/           # Shortlist management
│   │   └── sourcing/             # Sourcing orchestration
│   │
│   ├── hooks/                    # Custom React hooks
│   │   ├── useAuth.ts            # Auth state hook
│   │   ├── useFetch.ts           # Data fetching hook
│   │   └── ...
│   │
│   ├── redux/                    # State management
│   │   ├── slices/               # Redux slices
│   │   ├── store.ts              # Redux store setup
│   │   └── hooks.ts              # Redux hooks
│   │
│   ├── types/                    # TypeScript type definitions
│   │   ├── candidate.ts
│   │   ├── job.ts
│   │   ├── shortlist.ts
│   │   └── ...
│   │
│   ├── utils/                    # Utility functions
│   │   ├── formatters.ts         # Data formatting
│   │   ├── validators.ts         # Form validation
│   │   └── ...
│   │
│   ├── App.tsx                   # Root component
│   ├── App.css                   # Global styles
│   ├── main.tsx                  # Entry point
│   ├── index.css                 # Global CSS
│   └── vite-env.d.ts             # Vite type definitions
│
├── public/                       # Static assets
│   └── ...
│
├── .env.example                  # Environment template
├── .env.local                    # Local environment (not committed)
├── .eslintrc.json                # ESLint configuration
├── .prettierrc                   # Prettier configuration
├── index.html                    # HTML template
├── package.json                  # Dependencies and scripts
├── postcss.config.js             # PostCSS configuration
├── tailwind.config.js            # Tailwind configuration
├── tsconfig.json                 # TypeScript configuration
├── vite.config.mts               # Vite configuration
└── README.md                     # This file
```

### Key Directories

- **`src/api/`**: All API communication with backend services
- **`src/components/`**: Reusable UI components (buttons, cards, modals)
- **`src/features/`**: Feature-based modules with pages and logic
- **`src/hooks/`**: Custom React hooks for reusable logic
- **`src/redux/`**: Redux store and state management
- **`src/types/`**: TypeScript interface definitions
- **`src/utils/`**: Helper functions and utilities

## Available Scripts

### Development

```bash
# Start development server with HMR
npm run dev

# Type-check TypeScript
npm run type-check

# Type-check in watch mode
npm run type-check -- --watch

# Run linter
npm run lint

# Fix linting issues
npm run lint -- --fix

# Format code with Prettier
npm run format
```

### Build & Deploy

```bash
# Create production build
npm run build

# Preview production build locally
npm run preview

# Build and analyze bundle size
npm run build -- --analyze
```

### Testing (Optional)

```bash
# Run unit tests
npm run test

# Run tests in watch mode
npm run test -- --watch

# Generate coverage report
npm run test -- --coverage
```

## Contributing Guidelines

### Code Style & Standards

We follow strict code quality standards to maintain consistency:

- **TypeScript**: All code must be properly typed
- **ESLint**: Follow ESLint rules configured in `.eslintrc.json`
- **Prettier**: Auto-format code to maintain consistent style
- **Component Naming**: Use PascalCase for React components
- **File Naming**: Use kebab-case for file names, except components

### Before Contributing

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up pre-commit hooks**
   ```bash
   # Optional: Install husky for pre-commit linting
   npm install husky --save-dev
   npx husky install
   ```

### Development Workflow

1. **Write your code**
   - Use TypeScript with proper type annotations
   - Follow the project structure
   - Keep components small and focused

2. **Lint and format**
   ```bash
   npm run lint -- --fix
   npm run format
   ```

3. **Type-check**
   ```bash
   npm run type-check
   ```

4. **Test your changes**
   ```bash
   # Verify the dev server works
   npm run dev
   
   # Build and preview
   npm run build
   npm run preview
   ```

### Component Best Practices

```typescript
// ✅ GOOD: Proper TypeScript with types
interface ButtonProps {
  label: string;
  onClick: (event: React.MouseEvent) => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onClick,
  variant = 'primary',
  disabled = false,
}) => {
  return (
    <button
      className={`btn btn-${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
};

// ❌ AVOID: Implicit any types
function Button({ label, onClick }) {
  return <button onClick={onClick}>{label}</button>;
}
```

### API Integration Best Practices

```typescript
// ✅ GOOD: Use custom hooks for data fetching
function useCandidates(filters?: CandidateFilters) {
  const [data, setData] = React.useState<Candidate[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const response = await api.candidates.list(filters);
        setData(response);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [filters]);

  return { data, loading, error };
}
```

### Redux State Management Best Practices

```typescript
// ✅ GOOD: Use Redux slices for organized state
import { createSlice } from '@reduxjs/toolkit';

const candidateSlice = createSlice({
  name: 'candidates',
  initialState: {
    items: [],
    loading: false,
    error: null as string | null,
  },
  reducers: {
    setCandidates: (state, action) => {
      state.items = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const { setCandidates, setLoading, setError } = candidateSlice.actions;
```

### Commit Message Guidelines

Follow conventional commits format:

```
type(scope): brief description

Longer explanation if needed.

Fixes #issue-number
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, semicolons)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Test additions/updates
- `chore`: Dependency updates, build changes

**Examples**:
```
feat(candidates): add search filters for candidate list
fix(shortlist): resolve duplicate candidates in shortlist
docs: update installation instructions
```

### Pull Request Process

1. **Create a descriptive PR**
   ```
   Title: [Feature/Fix] Brief description
   
   Description:
   - What problem does this solve?
   - How were the changes tested?
   - Any breaking changes?
   ```

2. **Self-review before requesting review**
   - Code follows project standards
   - No console errors or warnings
   - TypeScript types are correct
   - All tests pass

3. **Request review from maintainers**

4. **Address feedback and update PR**

5. **Merge after approval**

### Testing Guidelines

```typescript
// ✅ GOOD: Test user interactions
import { render, screen, fireEvent } from '@testing-library/react';

test('Button component has correct label', () => {
  const handleClick = jest.fn();
  render(
    <Button label="Click me" onClick={handleClick} />
  );
  
  const button = screen.getByText('Click me');
  fireEvent.click(button);
  
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

### Documentation

- Update README for major features
- Add JSDoc comments for complex functions
- Document API integration changes
- Update type definitions when adding features

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 5173
lsof -i :5173
kill -9 <PID>

# Or use different port
npm run dev -- --port 3000
```

### CORS Errors

```bash
# Ensure VITE_API_BASE_URL matches backend
# Check backend CORS configuration
# Verify backend is running
```

### Build Fails

```bash
# Clear cache and reinstall
rm -rf node_modules dist
npm install

# Check for type errors
npm run type-check

# Run build with verbose output
npm run build -- --debug
```

### API Requests Failing

```bash
# Check API base URL in .env.local
grep VITE_API_BASE_URL .env.local

# Verify backend services are running
curl http://localhost:8000/health
curl http://localhost:8001/health

# Check browser console for errors (F12)
```

## Related Documentation

- [Core Backend Service](../../Talent_Finder_Backend/Talent_Finder_Backend_Core/README.md)
- [Sourcing Service](../../Talent_Finder_Backend/Talent_Finder_Backend_Sourcing_/README.md)
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [Redux Toolkit Documentation](https://redux-toolkit.js.org)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
