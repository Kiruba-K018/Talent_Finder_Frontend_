FROM node:18-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json* yarn.lock* ./
RUN npm install || npm ci
COPY . .
RUN npm run build

FROM nginx:alpine

# Remove all default configs
RUN rm -rf /etc/nginx/conf.d /etc/nginx/nginx.conf
RUN rm -rf /usr/share/nginx/html/*

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]