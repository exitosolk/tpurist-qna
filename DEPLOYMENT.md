# Deployment Guide for OneCeylon on VPS (oneceylon.space)

This guide covers deploying the Next.js application to a VPS running Ubuntu/Debian with Nginx.

## Prerequisites on VPS

- Ubuntu 20.04+ or Debian 11+
- Root or sudo access
- Domain: oneceylon.space pointed to VPS IP

## Step 1: Install Node.js

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

## Step 2: Install and Configure MySQL

```bash
# Install MySQL
sudo apt install -y mysql-server

# Secure MySQL installation
sudo mysql_secure_installation

# Login to MySQL
sudo mysql

# Create database and user
CREATE DATABASE touristqna;
CREATE USER 'nupus'@'localhost' IDENTIFIED BY '@2025Nupus!2';
GRANT ALL PRIVILEGES ON touristqna.* TO 'nupus'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Import schema
mysql -u nupus -p touristqna < /path/to/database/schema.sql
```

## Step 3: Install PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

## Step 4: Deploy Application

```bash
# Create app directory
sudo mkdir -p /var/www/oneceylon
sudo chown -R $USER:$USER /var/www/oneceylon

# Upload your code or clone from git
# Example with git:
cd /var/www/oneceylon
# git clone <your-repo-url> .

# Or use SCP/SFTP to upload files from your local machine:
# scp -r /path/to/oneceylon/* user@your-vps-ip:/var/www/oneceylon/

# Install dependencies
cd /var/www/oneceylon
npm install

# Create production .env file
nano .env.local
```

**Add the following to `.env.local`:**
```env
DB_HOST=localhost
DB_USER=nupus
DB_PASSWORD=@2025Nupus!2
DB_NAME=touristqna
JWT_SECRET=generate_random_32_character_secret_here
NEXT_PUBLIC_APP_URL=https://oneceylon.space
NODE_ENV=production
```

**Generate a secure JWT secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

```bash
# Build the application
npm run build

# Start with PM2
pm2 start npm --name "oneceylon" -- start

# Save PM2 process list and enable startup
pm2 save
pm2 startup
# Follow the output instructions to enable PM2 on boot
```

## Step 5: Install and Configure Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx config
sudo nano /etc/nginx/sites-available/oneceylon.space
```

**Add the following configuration:**
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
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/oneceylon.space /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Enable Nginx on boot
sudo systemctl enable nginx
```

## Step 6: Install SSL Certificate (HTTPS)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain and install SSL certificate
sudo certbot --nginx -d oneceylon.space -d www.oneceylon.space

# Follow the prompts and select option 2 to redirect HTTP to HTTPS

# Test auto-renewal
sudo certbot renew --dry-run
```

## Step 7: Configure Firewall

```bash
# Allow SSH, HTTP, and HTTPS
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable

# Check status
sudo ufw status
```

## Useful Commands

### PM2 Process Management
```bash
# View logs
pm2 logs oneceylon

# Restart app
pm2 restart oneceylon

# Stop app
pm2 stop oneceylon

# Delete app from PM2
pm2 delete oneceylon

# Monitor all processes
pm2 monit
```

### Application Updates
```bash
# Navigate to app directory
cd /var/www/oneceylon

# Pull latest code (if using git)
git pull

# Install any new dependencies
npm install

# Rebuild
npm run build

# Restart with PM2
pm2 restart oneceylon
```

### Database Backup
```bash
# Backup database
mysqldump -u nupus -p touristqna > backup_$(date +%Y%m%d).sql

# Restore database
mysql -u nupus -p touristqna < backup_20231224.sql
```

### Nginx
```bash
# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# View error logs
sudo tail -f /var/log/nginx/error.log

# View access logs
sudo tail -f /var/log/nginx/access.log
```

## Security Recommendations

1. **Change default MySQL password** in production
2. **Use a strong JWT_SECRET** (minimum 32 characters)
3. **Enable automatic security updates:**
   ```bash
   sudo apt install unattended-upgrades
   sudo dpkg-reconfigure -plow unattended-upgrades
   ```
4. **Set up regular database backups** (cron job)
5. **Monitor application logs** regularly
6. **Keep Node.js and dependencies updated**

## Troubleshooting

### Application won't start
- Check PM2 logs: `pm2 logs oneceylon`
- Verify `.env.local` exists and has correct values
- Ensure MySQL is running: `sudo systemctl status mysql`
- Check port 3000 is available: `sudo lsof -i :3000`

### Database connection errors
- Verify MySQL credentials in `.env.local`
- Check MySQL user permissions
- Ensure database exists: `mysql -u nupus -p -e "SHOW DATABASES;"`

### Nginx 502 Bad Gateway
- Check if Next.js app is running: `pm2 status`
- Verify proxy_pass URL in Nginx config
- Check Nginx error logs: `sudo tail -f /var/log/nginx/error.log`

### SSL Certificate Issues
- Renew certificate: `sudo certbot renew`
- Check certificate status: `sudo certbot certificates`

## Performance Optimization

1. **Enable Nginx caching** for static assets
2. **Use Redis** for session storage (optional upgrade)
3. **Enable gzip compression** in Nginx
4. **Set up CDN** for static assets (Cloudflare)
5. **Monitor with tools** like PM2 Plus or New Relic

## Support

For issues or questions, check:
- Application logs: `pm2 logs oneceylon`
- Nginx logs: `/var/log/nginx/`
- MySQL logs: `/var/log/mysql/`

---

**Your application should now be live at https://oneceylon.space!**
