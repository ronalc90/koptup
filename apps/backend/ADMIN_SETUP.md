# Admin Setup Guide

## Setting a User as Admin

### Development (Local)

To set a user as admin in development:

```bash
cd apps/backend
MONGODB_URI="your-mongodb-uri" npx tsx src/scripts/set-admin.ts <email>
```

Example:
```bash
MONGODB_URI="mongodb://mongo:QTaKycIfxXPWhlXWuRkzTzHxtCFBreSM@trolley.proxy.rlwy.net:11709/koptup?authSource=admin" npx tsx src/scripts/set-admin.ts dirox7@gmail.com
```

### Production (Railway)

Option 1: Run via Railway CLI
```bash
railway run npx tsx src/scripts/set-admin.ts <email>
```

Option 2: Set via MongoDB directly
```bash
# Connect to MongoDB and run:
db.users.updateOne(
  { email: "dirox7@gmail.com" },
  { $set: { role: "admin" } }
)
```

## Notes

- The user must have logged in at least once before setting them as admin
- The script will fail if the user doesn't exist in the database
- Admin users will automatically be redirected to `/admin` instead of `/dashboard`
- Admin users will only see the admin module, not the regular dashboard

## Current Admin Users

- dirox7@gmail.com (set on 2025-12-13)
