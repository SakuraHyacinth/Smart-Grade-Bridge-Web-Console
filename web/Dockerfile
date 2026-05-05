FROM node:20 AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install --include=dev
COPY . .
RUN npx vite build

FROM node:20
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY server.js .
COPY package*.json ./
RUN npm install --omit=dev

EXPOSE 5173
CMD ["node", "server.js"]