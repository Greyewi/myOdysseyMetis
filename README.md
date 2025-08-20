Services layout:
- backend: Express + Prisma + Postgres (docker-compose provided)
- showcase: Next.js public site (uses NEXT_PUBLIC_API_URL)
- frontend: Vite React SPA (uses VITE_BACKEND_URL)

Secrets: put per-service .env files; example templates provided as .env.example
EOF
