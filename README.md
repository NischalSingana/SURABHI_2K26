# Surabhi 2026 - International Cultural Fest Website

[![Next.js](https://img.shields.io/badge/Next.js-16.1.1-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.3-blue?style=flat&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22.0-2D3748?style=flat&logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)

Official website for **Surabhi 2026**, the flagship international cultural festival of KL University. This platform enables event registration, accommodation booking, ticket management, judging systems, and comprehensive festival information.

## 🌟 Features

### 🎭 Event Management
- **Dynamic Event Catalog**: Browse competitions across multiple categories (Dance, Music, Theatre, Fine Arts, etc.)
- **Individual & Group Registration**: Support for both solo and team-based events
- **College Types**: KL University (free), Other College (India), International Student flows
- **Real-time Availability**: Track participant limits and registration status
- **Event Submissions**: Participants can submit their work/links for events
- **Terms & Conditions**: Mandatory scroll-through acceptance for registrations

### 🔐 Authentication & Authorization
- **Multi-Provider Auth**: Google OAuth and Email/Password login via Better Auth
- **Role-Based Access Control**: USER, ADMIN, JUDGE, MANAGER, and MASTER roles
- **Email Verification**: Secure email verification system
- **Session Management**: Secure session handling with token-based authentication

### 🎫 Ticketing System
- **QR Code Generation**: Automated ticket generation with unique QR codes
- **Pass Management**: Digital passes with expiration and usage tracking
- **Ticket Scanning**: Admin interface for scanning and validating tickets

### 🏨 Accommodation Booking
- **Individual & Group Bookings**: Support for solo and group accommodation
- **Gender-Segregated Rooms**: Separate booking flows for male/female participants
- **Booking Management**: Admin dashboard for managing accommodation requests

### 👨‍⚖️ Judging System
- **Judge Dashboard**: Dedicated interface for event judges
- **Score Submission**: Real-time evaluation and scoring system
- **Participant Tracking**: View and evaluate registered participants
- **Remarks & Feedback**: Detailed feedback mechanism for participants

### 🎨 Interactive UI/UX
- **Circular Gallery**: 3D circular poster gallery with scroll-based navigation (GSAP)
- **Smooth Animations**: Framer Motion animations throughout
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Dark Theme**: Premium dark theme with red accent colors
- **Lenis Smooth Scroll**: Buttery smooth scrolling experience

### 📊 Admin Dashboard
- **User Management**: Approve/reject registrations and manage user roles
- **Event CRUD**: Create, update, and delete events and categories
- **Sponsor Management**: Manage festival sponsors with custom branding
- **Gallery Management**: Upload and organize gallery images by year
- **Contact Coordinators**: Manage contact categories and coordinator information (email only)
- **Schedule Management**: Upload and manage event schedules
- **Registration Approvals**: KL University / Other College sub-pages for Individual & Group (Pending + History)
- **XLSX Export**: Export registrations (International, Individual, Group, Visitor Pass) with filters and auto-filter in Excel
- **Column Filters**: Filter by User, Event, Payment Details, Status, Approved By, Actions

### 🤖 AI Chatbot
- **AI-Powered Assistant**: Natural language responses based on trained fest knowledge (Groq/OpenRouter/Bytez)
- **Trained on Full Website Data**: Events, competitions, registration, accommodation, contact coordinators, sponsors
- **Plain Text Responses**: No markdown clutter; conversational, synthesized answers
- **Context-Aware**: Answers only about Surabhi 2026; redirects off-topic questions
- **Rate Limited**: Spam protection and cooldown for fair usage

### 📱 Additional Features
- **Poster Gallery**: Automated poster gallery from R2 storage
- **Results Page**: Display competition results and winners
- **Sponsors Showcase**: Dynamic sponsor cards with custom gradients
- **Contact Page**: Categorized coordinator contacts (email only)
- **Profile Management**: User profile with registration history
- **Payment Verification**: Admin approval workflow for payments
- **Registration Completion**: Users with missing profile data can complete registration without "already registered" block
- **Virtual & International Support**: Virtual participation for eligible states; international student registration

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 16.1.1 (App Router)
- **UI Library**: React 19.2.3
- **Styling**: Tailwind CSS 4.0
- **Animations**: Framer Motion 12.23.24, GSAP 3.14.2
- **Smooth Scroll**: Lenis 1.3.13
- **3D Graphics**: OGL 1.0.11
- **Icons**: React Icons 5.5.0
- **QR Codes**: QRCode 1.5.4, html5-qrcode 2.3.8

### Backend
- **Runtime**: Node.js
- **Database**: PostgreSQL (via Prisma ORM 5.22.0)
- **Authentication**: Better Auth 1.4.10
- **Password Hashing**: bcryptjs 3.0.3
- **Email**: Nodemailer 7.0.11

### Cloud Services
- **Object Storage**: AWS S3 (Cloudflare R2)
- **Email Service**: AWS SES
- **PDF Generation**: @react-pdf/renderer 4.3.2

### Development
- **Language**: TypeScript 5.9.3
- **Linting**: ESLint 9
- **Code Analysis**: Knip 5.80.0
- **Compiler**: Babel React Compiler 1.0.0


## 🚀 Getting Started

### Prerequisites
- Node.js 20.x or higher
- PostgreSQL database
- AWS S3 (or Cloudflare R2) bucket
- AWS SES for email (or SMTP credentials)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd SurabhiWebsite-2026-
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/surabhi"
   
   # Better Auth
   BETTER_AUTH_SECRET="your-secret-key"
   BETTER_AUTH_URL="http://localhost:3000"
   
   # Google OAuth
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   
   # AWS S3 / Cloudflare R2
   AWS_ACCESS_KEY_ID="your-access-key"
   AWS_SECRET_ACCESS_KEY="your-secret-key"
   AWS_REGION="auto"
   AWS_ENDPOINT="your-r2-endpoint"
   AWS_BUCKET_NAME="your-bucket-name"
   
   # AWS SES
   SES_REGION="your-ses-region"
   SES_FROM_EMAIL="noreply@yourdomain.com"
   
   # App Configuration
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   
   # AI Chatbot (at least one required: Groq, OpenRouter, or Bytez)
   GROQ_API_KEY="optional-groq-api-key"
   OPENROUTER_API_KEY="optional-openrouter-api-key"
   BYTEZ_API_KEY="optional-bytez-api-key"
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

## 📝 Available Scripts

- `npm run dev` - Start development server with Prisma generation
- `npm run build` - Build for production (includes Prisma generation and DB push)
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run knip` - Analyze unused code

## 🗄️ Database Schema

The application uses Prisma ORM with PostgreSQL. Key models include:

- **User** - User accounts with roles and profile information
- **Event** - Cultural fest events and competitions
- **Category** - Event categories (Dance, Music, etc.)
- **GroupRegistration** - Team-based event registrations
- **AccommodationBooking** - Accommodation requests
- **Pass** - Digital passes and tickets
- **Evaluation** - Judge scores and feedback
- **Sponsor** - Festival sponsors
- **GalleryImage** - Photo gallery images
- **ChatbotFAQ** - Admin-managed FAQs (legacy; public chat uses AI model)
- **ContactCoordinator** - Contact information

See [`prisma/schema.prisma`](./prisma/schema.prisma) for the complete schema.

## 🔑 User Roles

| Role | Permissions |
|------|-------------|
| **USER** | Register for events, book accommodation, view profile |
| **ADMIN** | Manage events, users, sponsors, gallery, and all content |
| **JUDGE** | Evaluate participants and submit scores |
| **MANAGER** | Moderate content and manage specific sections |
| **MASTER** | Full system access with all administrative privileges |

## 🎨 Design System

### Color Palette
- **Primary**: Red (#dc2626, #b91c1c)
- **Background**: Dark gradients (#0a0000, #1a0000, #4a0000)
- **Text**: White, Zinc shades
- **Accents**: Orange, Rose, various vibrant colors for clubs

### Typography
- **Primary Font**: Lexend (via CSS variables)
- **Monospace**: Martian Mono (via CSS variables)

### Key Design Features
- Glassmorphism effects
- Gradient overlays
- Smooth animations and transitions
- Bento grid layouts
- Card-based UI components

## 🐳 Docker Deployment

Build and run with Docker:

```bash
# Build the image
docker build -t surabhi-2026 .

# Run the container
docker run -p 3000:3000 --env-file .env surabhi-2026
```

