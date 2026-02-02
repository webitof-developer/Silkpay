# Production Deployment Guide

**SilkPay Payout Platform - Complete Deployment Checklist**

---

## Pre-Deployment Checklist

### 1. Code Review
- [ ] All production checklist items completed ([`server/PRODUCTION_CHECKLIST.md`](../server/PRODUCTION_CHECKLIST.md))
- [ ] Code cleanup completed ([`server/CLEANUP_CHECKLIST.md`](../server/CLEANUP_CHECKLIST.md))
- [ ] All tests passing
- [ ] Security audit completed
- [ ] Performance testing done

### 2. Environment Configuration
- [ ] Production `.env` files configured
- [ ] SSL certificates obtained
- [ ] Domain DNS configured
- [ ] CDN setup (if applicable)

### 3. Database
- [ ] MongoDB Atlas production cluster created
- [ ] Backups configured
- [ ] Indexes created
- [ ] Connection string updated

### 4. Third-Party Services
- [ ] SilkPay production credentials obtained
- [ ] Email service configured (SendGrid/AWS SES)
- [ ] Monitoring tools setup (Sentry, CloudWatch)

---

## Backend Deployment (PM2)

**PM2** is the recommended process manager for production deployment. It provides:
- Automatic restarts on crashes
- Clustering for multi-core CPUs
- Log management
- Zero-downtime reloads

### 1. Install PM2

```bash
npm install -g pm2
```

### 2. Create PM2 Configuration

Create `ecosystem.config.js` in `/server` directory:

```javascript
module.exports = {
  apps: [
    {
      name: 'silkpay-api',
      script: './server.js',
      instances: 2,              // Use 2 CPU cores
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    },
    {
      name: 'payout-sync-worker',
      script: './workers/payout-sync.worker.js',
      instances: 1,
      env_production: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'balance-sync-worker',
      script: './workers/balance-sync.worker.js',
      instances: 1,
      env_production: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'email-worker',
      script: './workers/email.worker.js',
      instances: 1,
      env_production: {
        NODE_ENV: 'production'
      }
    }
  ]
};
```

### 3. Deploy

```bash
cd server

# Install dependencies (production only)
npm install --production

# Start all processes
pm2 start ecosystem.config.js --env production

# Save process list (survives reboots)
pm2 save

# Setup auto-restart on server reboot
pm2 startup
# Follow the instructions printed
```

### 4. Monitor

```bash
# View status of all processes
pm2 status

# View logs (all processes)
pm2 logs

# View logs (specific process)
pm2 logs silkpay-api

# Real-time monitoring dashboard
pm2 monit

# Restart specific process
pm2 restart silkpay-api

# Stop all processes
pm2 stop all
```

---

## Frontend Deployment

### Option 1: Standalone Server (with PM2)

**1. Build for Production:**
```bash
cd client
npm run build
```

**2. Start with PM2:**

Add to `/server/ecosystem.config.js`:
```javascript
{
  name: 'silkpay-frontend',
  script: 'npm',
  args: 'start',
  cwd: '../client',
  env_production: {
    NODE_ENV: 'production',
    PORT: 3000
  }
}
```

**3. Deploy:**
```bash
pm2 start ecosystem.config.js --env production
```

### Option 2: Vercel (Easiest)

Vercel is optimized for Next.js and handles everything automatically:

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy from client folder
cd client
vercel --prod
```

**Configure environment variables in Vercel dashboard:**
- `NEXT_PUBLIC_API_URL` = Your production API URL

---

## Environment Variables

### Backend (`.env`)

```env
# CRITICAL: Change these!
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/silkpay
JWT_SECRET=<64-char-random-string>
ENCRYPTION_KEY=<64-hex-chars>

# SilkPay Production
SILKPAY_API_URL=https://api.silkpay.ai
SILKPAY_MERCHANT_ID=<production-merchant-id>
SILKPAY_SECRET_KEY=<production-secret-key>

# Frontend
FRONTEND_URL=https://yourdomain.com
BACKEND_URL=https://api.yourdomain.com
CORS_ORIGINS=https://yourdomain.com

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=<sendgrid-api-key>
EMAIL_FROM=noreply@yourdomain.com

# Logging
LOG_LEVEL=info
```

### Frontend (`.env.local` or `.env.production`)

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
NEXT_PUBLIC_APP_NAME=SilkPay Payout Platform
```

---

## Nginx Configuration

**Reverse Proxy Setup:**

```nginx
# Backend API
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3001;
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

# Frontend
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name yourdomain.com api.yourdomain.com;
    return 301 https://$host$request_uri;
}
```

---

## Database Setup (MongoDB Atlas)

1. **Create Cluster:**
   - Go to https://cloud.mongodb.com
   - Create new M10+ cluster (production tier)
   - Choose region closest to your users

2. **Configure Security:**
   - Database Access: Create user with strong password
   - Network Access: Whitelist application servers IPs
   - Enable encryption at rest

3. **Get Connection String:**
   ```
   mongodb+srv://<username>:<password>@cluster.mongodb.net/silkpay?retryWrites=true&w=majority
   ```

4. **Backups:**
   - Enable automated backups (daily snapshots)
   - Configure retention policy (7-30 days)

---

## Monitoring & Logging

### 1. Application Monitoring

**Sentry (Error Tracking):**
```bash
npm install @sentry/node
```

```javascript
// server.js
const Sentry = require('@sentry/node');
Sentry.init({ dsn: process.env.SENTRY_DSN });
```

### 2. Server Monitoring

**PM2 Plus (Keymetrics):**
```bash
pm2 plus
pm2 link <secret> <public>
```

### 3. Log Management

**Winston + CloudWatch (AWS):**
```bash
npm install winston-cloudwatch
```

---

## SSL/TLS Certificate

### Option 1: Let's Encrypt (Free)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com

# Auto-renewal (cron job)
0 0 * * * /usr/bin/certbot renew --quiet
```

### Option 2: Cloudflare (Free + CDN)

1. Point DNS to Cloudflare
2. Enable "Full (strict)" SSL mode
3. Origin certificates auto-generated

---

## Backup & Recovery

### Database Backups

**Automated (MongoDB Atlas):**
- Continuous backups enabled by default
- Point-in-time recovery available

**Manual Backup:**
```bash
mongodump --uri="mongodb+srv://..." --out=/backup/$(date +%Y%m%d)
```

### Application Backups

**Code:** Git repository (already backed up)

**Environment Files:**
- Store encrypted `.env` in secure vault (1Password, AWS Secrets Manager)

**Restore Procedure:**
1. Clone repository
2. Restore `.env` from vault
3. Restore database from backup
4. Deploy as normal

---

## Health Checks & Uptime Monitoring

### Add Health Endpoint (if not exists)

```javascript
// server/src/app.js
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

### Monitoring Services

**UptimeRobot:** https://uptimerobot.com
- Monitor: `https://api.yourdomain.com/health`
- Alert: Email, Slack, SMS on downtime

---

## Post-Deployment

### 1. Smoke Tests

```bash
# Health check
curl https://api.yourdomain.com/health

# Login test
curl -X POST https://api.yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

### 2. Monitor Logs

```bash
pm2 logs --lines 100
```

### 3. Performance Check

- Response times < 200ms
- Memory usage stable
- CPU usage < 70%

---

## Rollback Plan

**If deployment fails:**

1. **PM2:**
```bash
pm2 stop all
git checkout <previous-commit>
npm install
pm2 restart all
```

2. **Database:**
```bash
mongorestore --uri="mongodb+srv://..." /path/to/backup
```

3. **DNS:** Revert to previous server IPs

---

## Security Hardening

### 1. Firewall Rules

```bash
# Allow SSH, HTTP, HTTPS only
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### 2. Fail2Ban (Protect SSH)

```bash
sudo apt-get install fail2ban
sudo systemctl enable fail2ban
```

### 3. Update Dependencies

```bash
npm audit fix --force
```

---

## Cost Optimization

| Service | Tier | Monthly Cost (est.) |
|---------|------|---------------------|
| MongoDB Atlas | M10 | $60 |
| VPS (2 CPU, 4GB RAM) | DigitalOcean | $24 |
| SSL Certificate | Let's Encrypt | FREE |
| CDN | Cloudflare | $0-20 |
| Email (SendGrid) | Free tier | $0 |
| **Total** | | **$84-104/month** |

---

## Troubleshooting

**Issue:** PM2 app crashed
```bash
pm2 logs --err
pm2 restart silkpay-api
```

**Issue:** High memory usage
```bash
pm2 restart all  # Restart all apps
```

**Issue:** Database connection timeout
- Check network access whitelist in MongoDB Atlas
- Verify connection string

---

## Final Checklist

- [ ] Backend deployed and running
- [ ] Frontend deployed and accessible
- [ ] SSL certificate installed
- [ ] Environment variables set correctly
- [ ] Database backups configured
- [ ] Monitoring enabled
- [ ] Logs aggregated
- [ ] Health checks passing
- [ ] Test merchant account created
- [ ] Documentation updated
- [ ] Team trained on new deployment

---

**Deployment Complete! 🎉**

**Next:** Monitor for 24-48 hours, then schedule go-live announcement.

---

**Last Updated:** 2026-01-29  
**Version:** 1.0
