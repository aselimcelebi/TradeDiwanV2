# TradeDiwan Deployment Guide

## Production Domain Configuration

- **Main Site**: https://tradediwan.com
- **Application**: https://app.tradediwan.com

## Environment Variables (Hostinger)

Set these variables in your hosting panel:

```bash
DATABASE_URL=file:./dev.db
NEXTAUTH_SECRET=TradeDiwan2024SecretKey123!
NEXTAUTH_URL=https://app.tradediwan.com
NODE_ENV=production
```

## Build Configuration

```bash
Build Command: npm ci && npm run build
Output Directory: .next
Install Command: npm ci
Node Version: 18.x or higher
```

## Database Setup

After deployment, run these commands in the hosting terminal:

```bash
npx prisma generate
npx prisma db push
npm run db:seed
```

## MT5 Expert Advisor

The EA file (`public/mt5-expert-advisor-real.mq5`) is configured for:
- **Production URL**: https://app.tradediwan.com/api/mt5/import
- **Version**: 4.0

### Installation:
1. Download the EA from your site
2. Add `https://app.tradediwan.com` to MT5 WebRequest allowed URLs
3. Place the EA in MT5 `MQL5/Experts/` folder
4. Attach to any chart and configure settings

## SSL/HTTPS

All API endpoints are configured for HTTPS with proper CORS headers.

## Domain Setup

Make sure your hosting provider has:
- SSL certificate for `app.tradediwan.com`
- Proper DNS A record pointing to your server
- HTTPS redirect enabled

## Post-Deployment Checklist

- [ ] Site loads at https://app.tradediwan.com
- [ ] Database is initialized with demo data
- [ ] MT5 API endpoint responds (`/api/mt5/import`)
- [ ] Binance API integration works
- [ ] All pages load without errors
- [ ] Mobile responsiveness works
