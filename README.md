# POS Shop Application

A Point of Sale (POS) shop application built with React 19, TypeScript, and Vite.

## Features

- User authentication with Supabase
- Item management (CRUD operations with image uploads)
- Shopping cart and checkout functionality
- Transaction history and details
- Responsive design with Tailwind CSS

## Technology Stack

- **Framework**: React 19 + TypeScript + Vite
- **Routing**: React Router 7
- **State Management**: React Context (AuthContext, AppContext)
- **Backend**: Supabase (PostgreSQL, Authentication, Storage)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Utilities**: UUID, Bcryptjs, QR Code React

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- Supabase account and project

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example` with your Supabase credentials
4. Start the development server:
   ```bash
   npm run dev
   ```

## Available Scripts

- `npm run dev` - Start Vite development server
- `npm run build` - **Non-standard**: removes node_modules, reinstalls, type-checks, then builds for production
- `npm run lint` - Run ESLint for code quality
- `npm run preview` - Build then run Cloudflare Wrangler dev server
- `npm run deploy` - Build then deploy to Cloudflare Workers/Pages
- `npm run test` - Run Vitest in watch mode
- `npm run test:run` - Run tests once
- `npm run test:coverage` - Run tests with coverage report

## Project Structure

- `src/pages/` - Application pages (Login, ItemList, ItemManagement, Checkout, Transactions)
- `src/context/` - React context providers (AuthContext, AppContext)
- `src/lib/` - Supabase client and helper functions
- `src/components/` - Reusable UI components

## Supabase Integration

- Authentication handled via Supabase Auth
- Data stored in Supabase tables: items, users, transactions, transaction_items
- Image storage using Supabase Storage bucket with `uploadImage` and `deleteImage` functions
- Order flow: `AppContext.completeOrder()` inserts into `transactions` then `transaction_items`

## Important Notes

- Build process explicitly cleans and reinstalls node_modules before building (`npm run build`)
- Type checking is part of the build process (`tsc -b`)
- Environment variables loaded from `.env` (gitignored)
- Uses Cloudflare Wrangler for preview/deploy commands