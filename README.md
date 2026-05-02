# NOCCA Stories

A web application for NOCCA (New Orleans Center for Creative Arts) alumni to collect, share, and celebrate stories, photos, and testimonials. Built with Next.js, TypeScript, and Tailwind CSS.

## Features

- 📝 **Story Submissions** - Alumni can share their post-graduation journeys with photos and detailed narratives
- 💬 **Testimonials** - Brief testimonials for marketing and social media campaigns
- 🎨 **Stories Gallery** - Browse and discover stories from the alumni community
- 👥 **Alumni Directory** - Connect and network with other alumni members
- 🔐 **User Accounts** - Secure authentication and personalized dashboards
- ⭐ **Content Curation** - Admin approval system for stories and testimonials

## Tech Stack

- **Frontend**: Next.js 15+ with TypeScript
- **UI**: Tailwind CSS
- **Database**: SQLite (Prisma ORM) - easily switchable to PostgreSQL
- **Authentication**: NextAuth.js (to be implemented)
- **Deployment**: Vercel-ready

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

\`\`\`bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Set up database
npx prisma migrate dev --name init

# Start development server
npm run dev
\`\`\`

Visit [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

\`\`\`
app/
├── page.tsx                 # Landing page
├── dashboard/               # User dashboard
├── stories/
│   ├── new/                # Submit new story
│   └── gallery/            # View all stories
├── testimonials/
│   └── new/                # Submit testimonial
├── alumni/                  # Alumni directory
├── login/                   # Login page
├── signup/                  # Registration page
└── api/
    ├── auth/               # Authentication endpoints
    ├── stories/            # Stories API
    └── testimonials/       # Testimonials API
prisma/
└── schema.prisma          # Database schema
\`\`\`

## Key Pages

- **Home** (\`/\`) - Landing page with features overview
- **Dashboard** (\`/dashboard\`) - User's main hub for all features
- **Submit Story** (\`/stories/new\`) - Form to submit a story with photos
- **Submit Testimonial** (\`/testimonials/new\`) - Quick testimonial submission
- **Stories Gallery** (\`/stories/gallery\`) - Browse approved stories
- **Alumni Directory** (\`/alumni\`) - Find and connect with alumni
- **Login** (\`/login\`) - User authentication
- **Sign Up** (\`/signup\`) - New account registration

## Next Steps

1. Implement NextAuth.js for full authentication
2. Integrate Prisma migrations and database operations
3. Add image upload functionality (Cloudinary or similar)
4. Create admin dashboard for content moderation
5. Add email notifications
6. Implement alumni search and filtering
7. Add messaging/direct connect features
8. Setup CI/CD pipeline

## Database Schema

### User
- Email, name, graduation year
- Bio and profile image
- Relationships: stories, testimonials, connections

### Story
- Title, content, media (array of image URLs)
- Author reference
- Approval status
- Timestamps

### Testimonial  
- Content (max 500 chars)
- Author reference
- Approval status
- Timestamps

### Connection
- Follower relationships between users
- Enable networking and alumni discovery

## License

MIT
