FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json tsconfig.build.json ./
COPY src/ ./src/
RUN npm run build

FROM node:22-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force
COPY --from=builder /app/dist ./dist
RUN mkdir /downloads && chown node:node /downloads

USER node
ENV STOCK_IMAGES_DOWNLOAD_DIR=/downloads
ENTRYPOINT ["node", "dist/index.js"]
