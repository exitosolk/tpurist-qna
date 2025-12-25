# OneCeylon - Travel Q&A Platform 🌴

Your **StackOverflow for travelers** exploring Sri Lanka! Built with Next.js 15, TypeScript, and PostgreSQL.

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd oneceylon
npm install
```

### 2. Set Up Database

Create a PostgreSQL database:

```bash
createdb oneceylon
psql -d oneceylon -f database/schema.sql
```

Or use a cloud database (Supabase, Neon, Railway).

### 3. Configure Environment

Create `.env.local`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/oneceylon
NEXTAUTH_SECRET=your-random-secret-here
NEXTAUTH_URL=http://localhost:3000
```

Generate NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## ✨ Features

- 🔐 **Authentication** - Secure login with NextAuth.js
- ❓ **Q&A System** - Ask and answer travel questions
- 🗳️ **Voting** - Upvote helpful content
- 🏷️ **Tags** - Categorize by destinations
- 👤 **User Profiles** - Reputation and badges
- 💬 **Comments** - Discuss questions and answers
- ✅ **Accepted Answers** - Mark best solutions
- 🔍 **Search & Filter** - Find relevant content

## 📁 Project Structure

```
oneceylon/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/         # NextAuth endpoints
│   │   ├── questions/    # Questions CRUD
│   │   ├── votes/        # Voting system
│   │   └── signup/       # User registration
│   ├── questions/        # Questions pages
│   │   ├── [id]/        # Question detail
│   │   └── ask/         # Ask question
│   ├── login/           # Login page
│   ├── signup/          # Registration page
│   └── layout.tsx       # Root layout
├── components/          # Reusable components
├── database/           # Database schema
├── lib/               # Utilities
│   ├── db.ts         # Database connection
│   └── utils.ts      # Helper functions
├── public/           # Static assets
└── DEPLOYMENT.md    # Deployment guide
```

## 🗄️ Database Schema

- **users** - User accounts and profiles
- **questions** - Travel questions
- **answers** - Question responses
- **votes** - Upvotes/downvotes
- **tags** - Topic categorization
- **comments** - Discussion threads
- **badges** - User achievements

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** PostgreSQL
- **ORM:** pg (native PostgreSQL)
- **Auth:** NextAuth.js
- **UI Components:** Radix UI
- **Icons:** Lucide React
- **Markdown:** react-markdown
- **Date Formatting:** date-fns

## 🌐 Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions for:
- Vercel (Recommended)
- VPS (DigitalOcean, AWS, etc.)
- Docker

Quick deploy to Vercel:
```bash
vercel
```

## 📝 Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## 🔒 Security

- Passwords hashed with bcrypt
- SQL injection protection with parameterized queries
- CSRF protection with NextAuth
- Environment variables for secrets
- Secure session management

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file

## 🆘 Support

For issues or questions:
- Check [DEPLOYMENT.md](DEPLOYMENT.md)
- Review database schema in `database/schema.sql`
- Check environment variables in `.env.local`

## 🎯 Roadmap

- [ ] Email notifications
- [ ] Rich text editor
- [ ] Image uploads
- [ ] Advanced search
- [ ] Mobile app
- [ ] Multilingual support
- [ ] Travel itineraries
- [ ] Photo galleries
- [ ] Maps integration

## 🌟 Built for OneCeylon.space

A community platform connecting travelers exploring Sri Lanka's beautiful destinations!

---

Made with ❤️ for travelers worldwide
