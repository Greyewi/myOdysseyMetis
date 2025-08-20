FROM node:20-alpine AS base
WORKDIR /app

# Install deps
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN npm ci || npm install

# Copy source
COPY . .

# Build TS
RUN npm run build || true
RUN npx tsc-alias -p tsconfig.json || true

EXPOSE 3333
CMD ["npm", "run", "start"]
