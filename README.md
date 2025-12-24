# OneCeylon - Tourist Q&A Platform

A modern Next.js application with authentication, built for oneceylon.space.

## Features

- ✅ User authentication (signup, login, logout)
- ✅ JWT-based session management
- ✅ MySQL database integration
- ✅ Secure password hashing with bcrypt
- ✅ Responsive UI with Tailwind CSS
- ✅ Server-side API routes

## Tech Stack

- **Framework**: Next.js 16.1 (App Router)
- **Language**: JavaScript
- **Database**: MySQL
- **Auth**: JWT + bcryptjs
- **Styling**: Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+ installed
- MySQL server running
- npm or yarn

### Installation

1. **Clone or download the project**

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   
   Run the SQL schema in your MySQL server:
   ```bash
   mysql -u root -p < database/schema.sql
   ```
   
   Or manually create the database and table using the schema in `database/schema.sql`

4. **Configure environment variables**
   
   Create `.env.local` file in the root directory:
   ```env
   DB_HOST=localhost
   DB_USER=your_mysql_user
   DB_PASSWORD=your_mysql_password
   DB_NAME=touristqna
   JWT_SECRET=your_random_secret_key_here
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:3000](http://localhost:3000)

6. **Build for production**
   ```bash
   npm run build
   npm start
   ```

## Project Structure

```
oneceylon/
├── app/
│   ├── api/
│   │   ├── login/route.js      # Login endpoint
│   │   ├── logout/route.js     # Logout endpoint
│   │   ├── profile/route.js    # User profile endpoint
│   │   └── signup/route.js     # Signup endpoint
│   ├── login/page.js           # Login page
│   ├── signup/page.js          # Signup page
│   ├── profile/page.js         # User profile page
│   ├── layout.js               # Root layout
│   └── page.js                 # Home page
├── lib/
│   └── db.js                   # Database connection pool
├── database/
│   └── schema.sql              # MySQL database schema
├── .env.local                  # Environment variables (create this)
└── package.json
```

## API Endpoints

### POST `/api/signup`
Create a new user account
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword"
}
```

### POST `/api/login`
Login and receive JWT token in cookie
```json
{
  "email": "john@example.com",
  "password": "securepassword"
}
```

### GET `/api/profile`
Get current user profile (requires authentication)

### POST `/api/logout`
Logout and clear authentication cookie

## Deployment to VPS (oneceylon.space)

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

## License

MIT
