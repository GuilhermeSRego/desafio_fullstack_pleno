FROM node:22-slim

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

# Set default env variable for build (can be overridden at runtime, but Next.js bakes NEXT_PUBLIC at build time)
ENV NEXT_PUBLIC_API_URL=http://localhost:3001

RUN npm run build

EXPOSE 3000

CMD npm start
