FROM node:24-bullseye-slim AS build

# Install packages, build and keep only prod packages
WORKDIR /app
COPY *.json ./
COPY ./src ./src
COPY ./src ./src
COPY ./prisma ./prisma
RUN npm ci --ignore-scripts && \
    npm run build

FROM node:24-bullseye-slim AS dependencies

# Install packages, build and keep only prod packages
WORKDIR /app
COPY *.json ./
RUN npm ci --omit=dev --ignore-scripts

# Deployment container
FROM gcr.io/distroless/nodejs24-debian13:nonroot
ENV NODE_ENV=production
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=build /app/node_modules/prisma ./node_modules/prisma
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./

# Port and health check
EXPOSE 3001

HEALTHCHECK \
  --interval=30s \
  --timeout=3s \
  --start-period=10s \
  --retries=3 \
  CMD ["/nodejs/bin/node", "/app/dist/healthcheck.js"]

# Start up command with 100MB of heap size, each application needs to determine what is the best value. DONT use default as it is 4GB.
CMD ["--max-old-space-size=100", "/app/dist/api/server.js"]

