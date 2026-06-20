# =============================================================================
# EcoTrace React/Vite Frontend — Production Dockerfile
# Multi-stage build:
#   Stage 1 (node-builder): Compiles TypeScript + bundles with Vite → /dist
#   Stage 2 (nginx-runtime): Serves static assets via nginx alpine (5 MB image)
# =============================================================================

# ──────────────────────────────────────────────────────────────────────────────
# STAGE 1 — node-builder
#   Installs all npm deps and runs `vite build` to produce optimised static files.
#   Node.js (350+ MB) never ships to production — only /dist is copied forward.
# ──────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS node-builder

# Set working directory inside the container
WORKDIR /app

# Copy workspace-level package files first for cache efficiency.
# The monorepo root package.json defines workspaces; we need it for
# npm to correctly resolve the @ecotrace/formulas shared package.
COPY package.json package-lock.json ./

# Copy shared packages that frontend-spa depends on (formulas, config)
COPY packages/ ./packages/

# Copy the frontend-spa package manifest
COPY apps/frontend-spa/package.json ./apps/frontend-spa/

# Install ALL workspace deps in one command so npm resolves the
# @ecotrace/formulas workspace symlink correctly
RUN npm ci --workspace=apps/frontend-spa --include-workspace-root

# Copy the rest of the frontend source code.
# Keeping this AFTER npm ci ensures code changes don't bust the dep cache.
COPY apps/frontend-spa/ ./apps/frontend-spa/

# Build the production bundle.
# VITE_API_BASE_URL is the only build-time variable the frontend needs.
# It tells the browser where to call the API. Set via --build-arg.
ARG VITE_API_BASE_URL=http://localhost:8000/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN npm run build --workspace=apps/frontend-spa


# ──────────────────────────────────────────────────────────────────────────────
# STAGE 2 — nginx-runtime
#   nginx:alpine is ~5 MB. It serves the static /dist files with:
#     • Gzip compression
#     • React Router HTML5 history mode fallback (all routes → index.html)
#     • Long-term asset caching (fingerprinted JS/CSS/fonts)
#     • Security headers (X-Frame-Options, CSP, etc.)
#     • Health check endpoint at /health
# ──────────────────────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS nginx-runtime

# Remove the default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom nginx config
COPY apps/frontend-spa/nginx.conf /etc/nginx/conf.d/ecotrace.conf

# Copy the compiled Vite bundle from the builder stage
COPY --from=node-builder /app/apps/frontend-spa/dist /usr/share/nginx/html

# ── Security: run nginx as non-root ──────────────────────────────────────────
# nginx:alpine already ships with an 'nginx' user (UID 101).
# We adjust the nginx config to bind to port 8080 (non-privileged) instead of 80,
# and configure pid + temp dirs writeable by that user.
RUN chown -R nginx:nginx /usr/share/nginx/html \
    && chown -R nginx:nginx /var/cache/nginx \
    && chown -R nginx:nginx /var/log/nginx \
    && touch /var/run/nginx.pid \
    && chown nginx:nginx /var/run/nginx.pid

USER nginx

EXPOSE 8080

# Health check: nginx responds at /health (defined in our nginx.conf)
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost:8080/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
