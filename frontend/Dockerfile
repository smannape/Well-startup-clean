## ---- build stage ----
FROM node:20-alpine AS build
WORKDIR /app

# Install deps first (better layer caching)
COPY package.json ./
RUN npm install --no-audit --no-fund

# Copy source — Vite automatically copies public/ into dist/
COPY . .
RUN npm run build

## ---- serve stage ----
FROM nginx:1.27-alpine
# Compiled app (includes everything from public/ — data.json, workovers.json, etc.)
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
