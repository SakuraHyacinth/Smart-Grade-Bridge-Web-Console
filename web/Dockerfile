FROM node:20-slim AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
RUN npm install --save-dev @types/node
COPY . .
RUN node node_modules/vite/bin/vite.js build

FROM node:20-slim
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY server.js .
COPY package*.json ./
RUN npm install --omit=dev

EXPOSE 5173
CMD ["node", "server.js"]