# OneCeylon Deployment Guide

## Deploying to oneceylon.space

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database set up
- Domain: oneceylon.space configured

### Deployment Options

## Option 1: Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin master
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Configure environment variables:
     - `DATABASE_URL`
     - `NEXTAUTH_SECRET`
     - `NEXTAUTH_URL` (https://oneceylon.space)
     - Optional OAuth credentials

3. **Set up Database**
   - Use Vercel Postgres or external PostgreSQL service (e.g., Supabase, Neon, Railway)
   - Run the schema from `database/schema.sql`

4. **Custom Domain**
   - In Vercel project settings, add `oneceylon.space`
   - Update DNS records as instructed by Vercel

## Option 2: VPS (DigitalOcean, AWS, etc.)

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install PM2 for process management
sudo npm install -g pm2
```

### 2. Database Setup

```bash
# Access PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE oneceylon;
CREATE USER oneceylon_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE oneceylon TO oneceylon_user;
\q

# Import schema
psql -U oneceylon_user -d oneceylon -f database/schema.sql
```

### 3. Application Deployment

```bash
# Clone repository
git clone https://github.com/yourusername/oneceylon.git
cd oneceylon

# Install dependencies
npm install

# Create .env.local
cat > .env.local << EOF
DATABASE_URL=postgresql://oneceylon_user:your_secure_password@localhost:5432/oneceylon
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=https://oneceylon.space
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM="OneCeylon" <noreply@oneceylon.space>
EOF

# Build application
npm run build

# Start with PM2
pm2 start npm --name "oneceylon" -- start
pm2 save
pm2 startup
```

### 4. Nginx Configuration

```bash
# Install Nginx
sudo apt install nginx -y

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/oneceylon
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name oneceylon.space www.oneceylon.space;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/oneceylon /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 5. SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get certificate
sudo certbot --nginx -d oneceylon.space -d www.oneceylon.space
```

## Environment Variables

Required variables:

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Authentication
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=https://oneceylon.space

# Email Configuration (Required for email verification and password reset)
# For Gmail: Enable 2FA and generate App Password at https://myaccount.google.com/apppasswords
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password-here
SMTP_FROM="OneCeylon" <noreply@oneceylon.space>

# OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

## Database Services (Alternative)

### Supabase
1. Create project at [supabase.com](https://supabase.com)
2. Copy connection string
3. Run schema in SQL Editor

### Neon
1. Create project at [neon.tech](https://neon.tech)
2. Copy connection string
3. Run schema using psql or their dashboard

### Railway
1. Create project at [railway.app](https://railway.app)
2. Add PostgreSQL service
3. Deploy from GitHub

## Post-Deployment

1. **Test the application**
   - Create a test account
   - Post a question
   - Test voting and answering

2. **Monitor logs**
   ```bash
   pm2 logs oneceylon
   ```

3. **Set up backups**
   ```bash
   # Database backup script
   pg_dump -U oneceylon_user oneceylon > backup-$(date +%Y%m%d).sql
   ```

4. **Configure analytics** (optional)
   - Google Analytics
   - Plausible
   - Umami

## Troubleshooting

- **Database connection issues**: Check DATABASE_URL format and credentials
- **NextAuth errors**: Verify NEXTAUTH_SECRET is set and NEXTAUTH_URL matches your domain
- **Build failures**: Clear `.next` folder and rebuild
- **502 Bad Gateway**: Check if Next.js is running on port 3000

## Updates

```bash
git pull origin master
npm install
npm run build
pm2 restart oneceylon
```

## Support

For issues, check the logs:
- PM2: `pm2 logs oneceylon`
- Nginx: `sudo tail -f /var/log/nginx/error.log`
- PostgreSQL: `sudo tail -f /var/log/postgresql/postgresql-*.log`
