# Stage 1: Build the Angular application
# Use a slim node image for a smaller footprint
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files and install dependencies. `npm ci` is generally faster and more reliable for builds.
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the application's source code.
# Being specific with COPY commands improves Docker's layer caching.
COPY src/ ./src/
COPY public/ ./public/
COPY angular.json .
COPY tsconfig.app.json .
COPY tsconfig.json .

# Run the build script to compile the application.
RUN npm run build

# Stage 2: Serve the application from a lightweight Nginx server
FROM nginx:alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Copy the built application artifacts from the builder stage to the Nginx web root directory.
COPY --from=builder /app/dist/community-service-ui/browser /usr/share/nginx/html

# Copy the custom Nginx configuration file.
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 to allow traffic to the web server.
EXPOSE 80

# Health check to ensure the server is responsive.
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1