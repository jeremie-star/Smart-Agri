# Copilot Instructions for Smart Irrigation Assistant Frontend

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview
This is a Next.js 14+ frontend application for the Smart Irrigation Assistant, built with TypeScript, Tailwind CSS, and modern React patterns.

## Tech Stack
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **HTTP Client**: Axios
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React
- **Maps**: React Leaflet
- **Charts**: Chart.js with react-chartjs-2
- **Internationalization**: react-i18next
- **Notifications**: Sonner / React Hot Toast

## Backend Integration
The backend API is located at `http://localhost:8000` and provides the following endpoints:
- Auth: `/api/auth/*` (register, login, verify)
- Farms: `/api/farms/*`
- Irrigation: `/api/irrigation/*`
- Chat: `/api/chat/*`
- Weather: `/api/weather/*`
- Notifications: `/api/notifications/*`
- Admin: `/api/admin/*`

## Code Style Guidelines
- Use TypeScript strict mode
- Prefer functional components with hooks
- Use `async/await` for asynchronous operations
- Implement proper error boundaries
- Use Tailwind utility classes over custom CSS
- Follow the `src/` directory structure
- Use `@/` import alias for absolute imports
- Implement loading and error states for all async operations
- Add proper TypeScript types for all props and state
- Use Framer Motion for smooth animations and transitions

## Design Principles
- Mobile-first responsive design
- Clean, modern agricultural aesthetic (greens, earth tones)
- Smooth animations and micro-interactions
- Accessible components (WCAG AA)
- Optimized for low-bandwidth contexts
- Support for English, Swahili, and Kinyarwanda languages

## Authentication Flow
- JWT tokens stored in httpOnly cookies or secure storage
- Automatic token refresh
- Protected route guards
- Redirect to login for unauthorized access

## Component Patterns
- Server Components by default
- Client Components for interactivity (`'use client'`)
- Shared layout components in `src/components/layout/`
- Reusable UI components in `src/components/ui/`
- Feature-specific components in `src/components/features/`
- Custom hooks in `src/hooks/`
- API services in `src/services/`
- Type definitions in `src/types/`
- Utilities in `src/lib/`

## Animation Guidelines
- Page transitions: subtle fade + slide
- Button interactions: scale on press
- Card hovers: gentle lift with shadow
- Loading states: skeleton placeholders
- Success states: checkmark animations
- Toast notifications: slide-in from top-right

## Best Practices
- Always validate user input
- Handle loading and error states
- Implement optimistic UI updates where appropriate
- Use React Query for caching and automatic retries
- Lazy load heavy components (maps, charts)
- Optimize images and assets
- Implement proper SEO metadata
- Add proper aria labels for accessibility
