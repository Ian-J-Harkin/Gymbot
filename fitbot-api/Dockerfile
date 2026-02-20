FROM node:20-alpine

WORKDIR /usr/src/app

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Generate Prisma client
RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "run", "start:dev"]
