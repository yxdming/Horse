# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Install envsubst (for environment variable substitution)
RUN apk add --no-cache gettext

# Copy built files from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration and entrypoint script
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.sh /docker-entrypoint.sh

# Set script executable permission
RUN chmod +x /docker-entrypoint.sh

# Expose port
EXPOSE 80

# Define environment variable (default value)
ENV BACKEND_URL=http://backend:8000

# Use entrypoint script
ENTRYPOINT ["/docker-entrypoint.sh"]
