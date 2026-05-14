# Dance Calendar

A mobile-first dance event calendar website where event organizers can add their events and dancers can discover what's happening in their area.

## Features

- **Mobile-First Design**: Swipeable calendar with week and month views optimized for touch
- **Event Management**: Organizers can create, edit, and manage dance events
- **Conflict Detection**: Real-time warnings when events overlap in the same city/venue
- **Recurring Events**: Support for daily, weekly, bi-weekly, and monthly recurring events
- **Email Notifications**: Automated notifications for new events and reminders
- **Admin Approval**: Organizer accounts require admin approval before posting
- **PWA Support**: Install as an app with offline access

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS 4, shadcn/ui
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (Vercel Postgres)
- **Authentication**: NextAuth.js v5
- **Email**: Resend
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd dance-calendar
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
RESEND_API_KEY="re_..."
EMAIL_FROM="Dance Calendar <noreply@yourdomain.com>"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
CRON_SECRET="your-cron-secret"
```

4. Set up the database:
```bash
npx prisma db push
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment to Vercel

1. Push your code to GitHub

2. Import the project in Vercel

3. Add environment variables in Vercel dashboard:
   - `DATABASE_URL` - Your Vercel Postgres connection string
   - `DIRECT_URL` - Direct database connection (for migrations)
   - `NEXTAUTH_URL` - Your production URL
   - `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`
   - `RESEND_API_KEY` - From Resend dashboard
   - `EMAIL_FROM` - Your verified sender email
   - `NEXT_PUBLIC_APP_URL` - Your production URL
   - `CRON_SECRET` - Generate a secure random string

4. Deploy!

## Creating an Admin User

After deployment, create your first admin user:

1. Register a new account
2. Connect to your database and run:
```sql
UPDATE "User" SET role = 'ADMIN', verified = true WHERE email = 'your@email.com';
```

## Project Structure

```
dance-calendar/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── (auth)/         # Authentication pages
│   │   ├── (dashboard)/    # Protected dashboard pages
│   │   ├── api/            # API routes
│   │   └── event/          # Public event pages
│   ├── components/         # React components
│   │   ├── calendar/       # Calendar components
│   │   ├── events/         # Event-related components
│   │   ├── layout/         # Layout components
│   │   ├── pwa/            # PWA components
│   │   ├── providers/      # Context providers
│   │   └── ui/             # shadcn/ui components
│   └── lib/                # Utility functions
│       ├── auth.ts         # NextAuth configuration
│       ├── conflicts.ts    # Conflict detection
│       ├── email.ts        # Email templates
│       ├── prisma.ts       # Database client
│       ├── recurrence.ts   # Recurring events
│       └── types.ts        # TypeScript types
├── prisma/
│   └── schema.prisma       # Database schema
└── public/
    ├── icons/              # PWA icons
    ├── manifest.json       # PWA manifest
    └── sw.js               # Service worker
```

## API Routes

- `GET /api/events` - List approved events
- `POST /api/events` - Create new event (organizers only)
- `GET /api/events/[id]` - Get event details
- `PATCH /api/events/[id]` - Update event
- `DELETE /api/events/[id]` - Delete event
- `POST /api/events/conflicts` - Check for conflicts
- `POST /api/auth/register` - Register new user
- `GET /api/admin/users` - List organizers (admin only)
- `POST /api/admin/users/[id]/approve` - Approve organizer
- `GET /api/subscriptions` - Get user subscription
- `POST /api/subscriptions` - Create/update subscription

## License

MIT
