# FitBot Admin Portal

A React-based admin portal for configuring and managing your gym's FitBot chatbot assistant.

## Features

### 🔐 Authentication System
- **Secure login and registration** with email/password
- **JWT token management** with automatic refresh handling
- **Protected routes** preventing unauthorized access
- **Form validation** using react-hook-form and Zod schemas

### 🎨 Chatbot Configuration Dashboard
- **Visual color picker** with preset gym-themed colors
- **Live preview** showing real-time chatbot appearance
- **FAQ data management** via expandable textarea
- **OpenAI API key configuration** with secure masked input
- **Auto-save functionality** with debounced updates
- **Activation toggle** to enable/disable the chatbot

### 🚀 Technical Stack
- **Frontend**: React 18 with TypeScript
- **Routing**: React Router v6 with protected routes
- **Forms**: react-hook-form with Zod validation
- **Styling**: Tailwind CSS with custom design system
- **HTTP Client**: Axios with automatic token injection
- **Icons**: Lucide React for consistent iconography
- **Build Tool**: Vite for fast development and building

## Project Structure

```
src/
├── features/
│   ├── auth/                    # Authentication module
│   │   ├── components/          # Login/Register forms, layouts
│   │   ├── context/             # Auth context provider
│   │   ├── pages/               # Login/Register pages
│   │   ├── schemas/             # Zod validation schemas
│   │   └── services/            # Auth API calls
│   └── dashboard/               # Dashboard module
│       ├── components/          # Configuration form, preview
│       ├── pages/               # Dashboard page
│       ├── schemas/             # Configuration validation
│       └── services/            # Configuration API calls
├── services/                    # Shared API configuration
├── types/                       # TypeScript type definitions
└── App.tsx                      # Main app with routing
```

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- FitBot API running on `http://localhost:3000`

### Installation

1. **Install dependencies**
   ```bash
   cd fitbot-admin
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your API URL if different from default
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   Navigate to `http://localhost:3001`

## API Integration

The admin portal expects the following API endpoints:

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration  
- `GET /api/auth/validate` - Token validation

### Configuration
- `GET /api/configurations/me` - Get user's configuration
- `PUT /api/configurations/me` - Update configuration
- `POST /api/configurations` - Create new configuration

## Environment Variables

```bash
VITE_API_URL=http://localhost:3000/api  # Backend API URL
VITE_APP_NAME=FitBot Admin Portal       # App display name
VITE_APP_VERSION=1.0.0                  # App version
```

## Key Features Implementation

### Protected Routes
Uses React Router's `Outlet` pattern with JWT token validation:
```typescript
<Route element={<ProtectedRoute />}>
  <Route path="/dashboard" element={<DashboardPage />} />
</Route>
```

### Form Validation
Robust validation using Zod schemas:
```typescript
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
```

### Live Preview
Real-time chatbot preview updates as you modify colors and settings, showing exactly how the widget will appear on your website.

### Color Presets
Pre-configured gym-themed colors:
- Bold Red (#DC2626)
- Electric Blue (#2563EB) 
- Slate Gray (#475569)
- Orange Energy (#EA580C)
- Green Power (#16A34A)
- Purple Strength (#9333EA)

## Development Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production  
npm run preview  # Preview production build
npm run lint     # Run ESLint checks
```

## Security Features

- **JWT tokens** stored in localStorage with automatic cleanup
- **API key masking** - OpenAI keys are never fully displayed
- **HTTPS enforcement** in production builds
- **XSS protection** through React's built-in sanitization
- **CSRF protection** via token-based authentication

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Production Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Deploy the `dist` folder** to your web server
3. **Configure environment variables** for your production API
4. **Ensure HTTPS** is enabled for token security

For more details on the backend API, see the [FitBot API documentation](../fitbot-api/README.md).