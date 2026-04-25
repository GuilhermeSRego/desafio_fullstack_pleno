FROM node:22-slim

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /usr/src/app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npx prisma@5.20.0 generate

RUN npm run build

EXPOSE 3001

# The start command ensures the db schema is up to date and seeded
CMD npx prisma db push && npm run seed && npm start
