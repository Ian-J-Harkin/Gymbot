FROM node:20-bookworm-slim

WORKDIR /usr/src/app

# Install openssl (Prisma) — procps installed at runtime if needed for dev
RUN apt-get update -y && apt-get install -y openssl procps && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy source
COPY . .

# Generate Prisma client
RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "run", "start:dev"]
