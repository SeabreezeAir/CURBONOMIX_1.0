# ---- build API ----
FROM node:20-alpine AS api-build
WORKDIR /app
COPY packages ./packages
COPY apps/api/package.json apps/api/tsconfig.json apps/api/src ./apps/api/
RUN npm --prefix apps/api install
RUN npm --prefix apps/api run build

# ---- build web ----
FROM node:20-alpine AS web-build
WORKDIR /app
COPY apps/customer-portal/package.json apps/customer-portal/index.html apps/customer-portal/tsconfig*.json apps/customer-portal/vite.config.ts apps/customer-portal/src ./apps/customer-portal/
RUN npm --prefix apps/customer-portal install
RUN npm --prefix apps/customer-portal run build

# ---- API runtime ----
FROM node:20-alpine AS api
WORKDIR /app
ENV HOST=0.0.0.0 PORT=3000
COPY --from=api-build /app/apps/api/dist ./apps/api/dist
COPY --from=api-build /app/apps/api/package.json ./apps/api/package.json
COPY --from=api-build /app/packages ./packages
EXPOSE 3000
CMD ["node","apps/api/dist/main.js"]

# ---- Web runtime ----
FROM caddy:2-alpine AS web
COPY infra/caddy/Caddyfile /etc/caddy/Caddyfile
COPY --from=web-build /app/apps/customer-portal/dist /srv/customer
COPY --from=web-build /app/apps/customer-portal/dist /srv/shop
