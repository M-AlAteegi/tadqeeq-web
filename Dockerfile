# syntax=docker/dockerfile:1.7
#
# Two-stage build for the tadqeeq-web React app.
# - Stage 1 (node) installs deps + runs `tsc && vite build` to produce
#   a static dist/ directory.
# - Stage 2 (nginx) serves dist/ + proxies /api + /health to the backend
#   service. The runtime image carries no Node, npm, or source — just
#   nginx + the static bundle.

# ---- Stage 1: builder ----------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /build

# Install deps in a dedicated layer so an unchanged package*.json hits the
# npm cache when only src/ moves.
COPY package.json package-lock.json ./
RUN npm ci

# Source — split from the deps layer so editing a component doesn't
# invalidate node_modules. .dockerignore keeps node_modules / dist /
# editor cruft out of the build context.
COPY tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts eslint.config.js ./
COPY index.html ./
COPY public ./public
COPY src ./src

RUN npm run build

# ---- Stage 2: runtime (nginx) -------------------------------------------
FROM nginx:1.27-alpine AS runtime

# Drop nginx's default conf so our template owns the only server block.
RUN rm /etc/nginx/conf.d/default.conf

# Default BACKEND_URL points at the conventional docker-compose service
# name so a co-located stack (web + backend on one host) works out of the
# box. Override via the container env when web is on a separate host /
# behind a different reverse proxy.
ENV BACKEND_URL=http://tadqeeq-backend:8765

# nginx:alpine's entrypoint runs envsubst over /etc/nginx/templates/*.template
# at container start and writes the result into /etc/nginx/conf.d/. That's
# the official way to inject env vars into nginx config.
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template

# Static bundle from the builder stage.
COPY --from=builder /build/dist /usr/share/nginx/html

EXPOSE 80

# Liveness probe hits the dedicated /_nginx_health route in the template
# (not /, which would log a request per check and might 404 if the bundle
# isn't there for any reason).
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q -O- http://127.0.0.1/_nginx_health >/dev/null || exit 1

# nginx:alpine's entrypoint already invokes `nginx -g 'daemon off;'` after
# template processing, so no CMD override needed.
