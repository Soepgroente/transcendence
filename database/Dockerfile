# backend/Dockerfile
FROM node:22-alpine

RUN apk update && apk upgrade

# Install tini for proper signal handling
RUN apk add --no-cache tini

# Create group and user for non-root access
RUN addgroup -g 1001 -S appgroup
RUN adduser -S appuser -u 1001 -G appgroup

WORKDIR /app

# Install dependencies including Drizzle ORM
COPY ./src/package*.json ./
RUN npm install

COPY ./src/*.ts ./
COPY ./src/drizzle.config.ts ./
COPY ./src/src/ ./
RUN npm run build

RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "--"]

CMD ["npm", "start"]
