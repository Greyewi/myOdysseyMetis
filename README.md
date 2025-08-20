Services layout:
- backend: Express + Prisma + Postgres (docker-compose provided)
- showcase: Next.js public site (uses NEXT_PUBLIC_API_URL) launch via Docker
- frontend: Vite React SPA (uses VITE_BACKEND_URL) launch via Docker

Secrets: put per-service .env files; example templates provided as .env.example
EOF
