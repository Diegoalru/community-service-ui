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
COPY tailwind.config.mjs .
COPY postcss.config.js .

# Run the build script to compile the application.
RUN npm run build

# Stage 2: Serve the application from a lightweight Nginx server
FROM nginx:alpine

# Install curl for health checks and gettext for envsubst
RUN apk add --no-cache curl gettext

# Copy the built application artifacts from the builder stage to the Nginx web root directory.
COPY --from=builder /app/dist/community-service-ui/browser /usr/share/nginx/html

# Copy the custom Nginx configuration template.
COPY nginx/nginx.conf.template /etc/nginx/conf.d/default.conf.template

# Expose port 80 to allow traffic to the web server.
EXPOSE 80

# Health check to ensure the server is responsive.
HEALTHCHECK --interval=1m --timeout=20s --start-period=30s --retries=5 \
  CMD curl -f http://localhost/ || exit 1

# When the container starts, substitute the environment variables in the template
# and start Nginx.
CMD ["/bin/sh", "-c", "envsubst '${BACKEND_URL}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
