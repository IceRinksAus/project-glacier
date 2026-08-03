# Local Development

## Start API
```bash
cd ~/Documents/project-glacier/apps/api
npm run start:dev
```

## Prisma
```bash
npx prisma studio
npx prisma format
npx prisma migrate dev --name <name>
npx prisma generate
```

Expected environment variables:
- `DATABASE_URL`
- `JWT_SECRET`

Never commit real secrets.
