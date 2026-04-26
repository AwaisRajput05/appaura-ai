FROM node:20-alpine AS builder
WORKDIR /app

# Copy only package files first for better caching
COPY package.json package-lock.json ./

# Install dependencies in the Alpine environment
RUN npm ci

# Copy the rest of the app
COPY . .

# Run the build
RUN npm run build

# Production stage for static serving
FROM nginx:alpine

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Nginx runs by default on port 80
CMD ["nginx", "-g", "daemon off;"]