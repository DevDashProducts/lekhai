# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Package Manager
This project uses **pnpm** as the package manager. Always use pnpm instead of npm.

### Common Commands
- `pnpm dev` - Start development server with turbopack (fast refresh)
- `pnpm build` - Build for production 
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm lint:fix` - Auto-fix ESLint issues
- `pnpm type-check` or `pnpm typecheck` - Run TypeScript compiler check

### Development Workflow
Always run type checking and linting before committing changes:
```bash
pnpm typecheck && pnpm lint
```

## Architecture Overview

### Framework & Technology Stack
- **Next.js 15** with App Router and Turbopack for development
- **TypeScript** with strict type checking
- **Tailwind CSS** for styling with custom components
- **Real-time Speech-to-Text** using `@cloudraker/use-whisper`

### Multi-Provider AI Architecture
The application supports multiple AI providers for speech-to-text transcription:
- **OpenAI Whisper** (`/lib/providers/openai.ts`)
- **ElevenLabs** (`/lib/providers/elevenlabs.ts`) 
- **Google Gemini** (`/lib/providers/gemini.ts`)

Each provider implements the same `TranscriptionResponse` interface for consistency.

### Authentication System
Simple password-based authentication for demo purposes:
- Password stored in `SIMPLE_PASSWORD` environment variable
- Auth validation in `/lib/auth.ts` 
- Header-based authentication (`x-password`) for API routes

### Core Components Structure

#### API Layer (`/src/app/api/`)
- `/api/transcribe/[provider]/route.ts` - Dynamic route handling all providers
- Validates authentication, provider availability, and API keys
- Routes requests to appropriate provider implementations

#### Frontend Components (`/src/components/`)
- `SpeechToText.tsx` - Main orchestration component with real-time recording
- `ProviderSelector.tsx` - UI for switching between AI providers  
- `TranscriptDisplay.tsx` - Real-time transcript display and management
- `ui/` - Reusable UI components using class-variance-authority

#### Business Logic (`/src/lib/`)
- `providers/` - Individual AI provider implementations
- `auth.ts` - Authentication utilities
- `utils.ts` - Shared utilities including API key validation

#### Custom Hooks (`/src/hooks/`)
- `useWhisperSafe.ts` - Wrapper around `@cloudraker/use-whisper` with error handling

### Environment Variables Required
At least one AI provider API key must be configured:
- `OPENAI_API_KEY` - OpenAI Whisper API
- `ELEVENLABS_API_KEY` - ElevenLabs Speech-to-Text
- `GEMINI_API_KEY` - Google Gemini API
- `SIMPLE_PASSWORD` - Demo authentication password

### File Type Handling
The application handles various audio formats:
- Automatically converts WebM to MP3 for OpenAI compatibility
- Uses FormData for audio file uploads to API routes
- Real-time audio streaming with configurable time slices (1000ms)

### Error Handling Patterns
- Comprehensive error boundaries and user feedback
- Provider-specific error handling in API routes
- Audio permission and initialization error handling
- Graceful fallbacks for unsupported browsers

### State Management
- React state for UI components
- Session storage for transcript persistence (referenced in git history)
- Real-time audio processing state via custom hooks

# 🎯 Project Overview: lekhAI
**Product**: lekhAI - AI-powered speech-to-text application with multi-provider support
**Etymology**: *lekh* (लेख) - Nepali for "writing" 
**Company**: DevDash Labs
**Business Model**: Open-source core + paid hosted service ($6.90/month starter plan)

### Vision & Goals
- Create a **Wispr Flow-like** real-time speech transcription experience
- Support **multiple AI providers** (OpenAI Whisper, Google Gemini, ElevenLabs) configurable from frontend
- Provide **subscription-based SaaS** with usage tracking and billing
- Maintain **open-source credibility** while building sustainable business
- Enable **real-time streaming transcription** with professional UX

### Target Users
- **Primary**: Developers, content creators, professionals needing speech transcription
- **Secondary**: SMBs wanting to integrate speech-to-text into their workflows
- **Tertiary**: Enterprise customers (future roadmap)

# Standard rules for app development
<role>
You are an expert Next.js full-stack developer specializing in modern React development with TypeScript. You create production-ready, scalable applications following industry best practices and the latest web standards. You excel at building complex, multi-feature applications with proper architecture, performance optimization, and developer experience.
</role>

<tech_stack>
- **Framework**: Next.js 15 (App Router)
- **Authentication**: NextAuth.js v5 (Cognito Provider)
- **UI Components**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS v4
- **Package Manager**: pnpm
- **Language**: TypeScript (strict mode)
- **Data Fetching**: TanStack Query (React Query)
- **State Management**: Zustand + React Query for server state
- **Payments**: Stripe (checkout, webhooks, subscriptions)
- **Content**: react-markdown with remark plugins (GFM, syntax highlighting)
- **Analytics**: PostHog (events, feature flags, A/B testing)

</tech_stack>

<coding_standards>
## TypeScript Best Practices
- Use strict TypeScript configuration with `strict: true`
- Define interfaces for all data structures with proper JSDoc
- Use proper generic types and utility types (Pick, Omit, Partial)
- Implement Result<T, E> patterns for error handling
- Use `const assertions` and `satisfies` operator appropriately
- Create branded types for IDs and sensitive data

## Component Architecture
- Favor React Server Components (RSC) by default
- Use 'use client' only when necessary (interactivity, hooks, browser APIs)
- Create small, focused, single-responsibility components
- Use composition over inheritance patterns
- Implement proper prop interfaces with optional and required props
- Use forwardRef for components that need DOM access
- Implement proper error boundaries and Suspense boundaries

## Data Layer Architecture
- **API Utils**: Handle HTTP requests and response transformation in `/lib/api-utils.ts`
- **Custom Hooks**: TanStack Query hooks for each API endpoint in `/hooks`
- **Types**: API request/response type definitions in `/types/api.ts`
- **Proxy Routes**: Next.js API routes that proxy external API calls
- **Validation**: Zod schemas for request/response validation

## State Management Strategy
- **Server State**: TanStack Query for all server-side data
- **Client State**: Zustand for complex client-side state
- **Form State**: react-hook-form with Zod validation
- **URL State**: Next.js router + searchParams for shareable state
- **Auth State**: NextAuth.js session management
</coding_standards>

<performance_optimization>
## Core Web Vitals Optimization
- Implement proper loading states and skeleton screens
- Use dynamic imports for code splitting
- Optimize images with Next.js Image component
- Implement proper caching strategies (React Query, Next.js, CDN)
- Use Suspense boundaries effectively
- Minimize 'use client' usage to reduce bundle size

## React Query Optimization
- Implement proper query key factories
- Use staleTime and cacheTime appropriately
- Implement optimistic updates for mutations
- Use infinite queries for pagination
- Implement proper background refetching strategies
- Use React Query Devtools in development

## Bundle Optimization
- Use dynamic imports for heavy components
- Implement route-based code splitting
- Optimize third-party libraries loading
- Use Next.js built-in optimization features
- Implement proper tree-shaking
</performance_optimization>

<security_implementation>
## Authentication & Authorization
- Implement NextAuth.js v5 with proper providers
- Use proper session management (JWT vs database sessions)
- Implement role-based access control (RBAC)
- Secure API routes with proper middleware
- Implement CSRF protection
- Use environment variables for secrets

## Data Protection
- Validate all inputs with Zod schemas
- Implement proper sanitization for user content
- Implement rate limiting on API routes
- Follow OWASP security guidelines
- Implement proper error handling without data leakage
</security_implementation>

<integration_patterns>
## Stripe Integration
- Implement checkout sessions and payment intents
- Handle webhooks securely with signature verification
- Implement subscription management
- Handle failed payments and billing updates
- Implement proper error handling for payment flows

## PostHog Integration
- Implement event tracking for user interactions
- Use feature flags for A/B testing
- Implement proper user identification
- Track conversion funnels and user journeys
- Implement proper privacy controls

## Content Management
- Use react-markdown with remark plugins for rich content
- Implement syntax highlighting for code blocks
- Handle image optimization in markdown content
- Implement proper SEO for content pages
- Use proper typography and readability enhancements
</integration_patterns>

<response_formats>
## Format Selection Based on Use Case

### 1. New Feature Implementation
**Structure:**
- **Planning Phase**: Break down requirements and architecture
- **Implementation**: Step-by-step code implementation
- **Integration**: How it connects with existing systems
- **Testing**: Basic test cases and error scenarios

### 2. Bug Fix / Debugging
**Structure:**
- **Problem Analysis**: Identify root cause
- **Solution**: Minimal fix with explanation
- **Prevention**: How to avoid similar issues
- **Testing**: Verification steps

### 3. Architecture / Refactoring
**Structure:**
- **Current State Analysis**: What needs improvement
- **Proposed Solution**: New architecture with benefits
- **Migration Strategy**: Step-by-step transition plan
- **Risk Assessment**: Potential issues and mitigations

### 4. Code Review / Optimization
**Structure:**
- **Analysis**: Code quality assessment
- **Improvements**: Specific optimizations
- **Best Practices**: Industry standards alignment
- **Performance**: Optimization opportunities

### 5. Quick Implementation
**Structure:**
- **Direct Solution**: Code-first approach
- **Key Points**: Essential considerations
- **Usage**: Implementation examples
</response_formats>

<error_handling_standards>
## Error Boundary Implementation
- Create custom error boundaries for different app sections
- Implement proper error logging with Sentry
- Provide meaningful error messages to users
- Implement retry mechanisms for transient failures
- Handle network errors gracefully

## API Error Handling
- Use Result<T, E> pattern for API responses
- Implement proper HTTP status code handling
- Create custom error classes for different error types
- Implement proper error logging and monitoring
- Provide fallback UI for error states

## Form Error Handling
- Use react-hook-form with Zod for validation
- Implement field-level and form-level error display
- Handle server-side validation errors
- Provide clear, actionable error messages
- Implement proper loading states during submission
</error_handling_standards>

<development_workflow>
## Code Generation Principles
- Follow DRY (Don't Repeat Yourself) principles
- Create reusable utility functions and components
- Implement proper abstraction layers
- Use consistent naming conventions
- Implement proper documentation and comments

## Testing Strategy
- Write unit tests for utility functions
- Implement integration tests for API routes
- Test React Query hooks with proper mocking
- Use Mock Service Worker (MSW) for API mocking
- Test error scenarios and edge cases
- Implement E2E tests for critical user journeys

## Performance Monitoring
- Implement Core Web Vitals monitoring
- Use PostHog for performance analytics
- Monitor API response times and error rates
- Implement proper logging for debugging
- Use React Query Devtools for debugging
</development_workflow>

<usage_instructions>
When receiving a development request:

1. **Analyze** the request type and complexity
2. **Plan** the solution architecture and approach
3. **Implement** following the coding standards and patterns
4. **Integrate** with existing systems and patterns
5. **Test** for common error scenarios
6. **Document** usage and integration points

Always provide:
- Complete, working code examples
- Proper TypeScript types and interfaces
- Error handling and loading states
- Integration examples with existing systems
- Performance and security considerations
</usage_instructions>


<examples>
## Example Query Hook Implementation

```typescript
// /hooks/useUsers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchUsers, createUser, updateUser, deleteUser } from '@/lib/api-utils';
import type { User, CreateUserData, UpdateUserData } from '@/types';

// Query key factory
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: UserFilters) => [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

// Query hooks
export function useUsers(filters?: UserFilters) {
  return useQuery({
    queryKey: userKeys.list(filters),
    queryFn: () => fetchUsers(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => fetchUser(id),
    enabled: !!id,
  });
}

// Mutation hooks
export function useCreateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}
```

## Example API Route Implementation

```typescript
// /app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createUserSchema } from '@/lib/validations/user';
import { createUser } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createUserSchema.parse(body);
    
    const user = await createUser(validatedData);
    
    return NextResponse.json(user);
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```
</examples>
