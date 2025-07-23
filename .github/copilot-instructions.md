<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Personal Finance Manager Project Instructions

This is a full-stack personal finance management application built with:

## Frontend:
- React 18 with TypeScript
- Vite for fast development and building
- Tailwind CSS for styling with dark mode support
- React Router for navigation
- PWA capabilities using vite-plugin-pwa

## Backend:
- Express.js with TypeScript
- SQLite database with .db file
- RESTful API design
- CORS enabled for frontend communication

## Key Features:
- Dashboard with financial overview
- Expense and income tracking
- Financial goals management
- Loan/debt tracking
- Recurring transactions
- Dark/light mode toggle
- Responsive design
- Offline support (PWA)

## File Structure:
- `src/components/` - Reusable UI components
- `src/pages/` - Route-specific page components
- `src/services/` - API calls and data management
- `src/utils/` - Helper functions and utilities
- `src/types/` - TypeScript type definitions
- `src/hooks/` - Custom React hooks
- `backend/src/` - Express server with controllers, routes, and database

## Development Guidelines:
- Use TypeScript for type safety
- Follow React functional components with hooks pattern
- Use Tailwind CSS utility classes for styling
- Implement responsive design (mobile-first)
- Use proper error handling and loading states
- Follow RESTful API conventions
- Use SQLite with prepared statements for security

## Code Style:
- Use camelCase for variables and functions
- Use PascalCase for components and types
- Use snake_case for database columns
- Add proper TypeScript types for all props and functions
- Include proper error boundaries and fallback UI
