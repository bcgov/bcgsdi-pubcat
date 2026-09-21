# Build static files
FROM node:24-alpine AS build
WORKDIR /app
COPY . .
RUN npm ci --ignore-scripts && \
  npm install -g @angular/cli && \
  npm run build

# Build custom Caddy binary with Coraza WAF plugin
FROM caddy:2.11.4-builder AS caddy
# Install CA certificates for Go module downloads; libcap for setcap
RUN apk add --no-cache ca-certificates libcap
RUN xcaddy build \
    --with github.com/corazawaf/coraza-caddy/v2
# Strip file capabilities here so the final image does not need libcap
RUN setcap -r /usr/bin/caddy

# Deploy: use Alpine (not caddy:x.y.z-alpine) because we use our own custom Caddy
# binary from the caddy stage—we never use the Caddy image's binary. Plain Alpine
# keeps dependencies explicit and avoids coupling to the Caddy image's layout.
FROM alpine:3.23.3
RUN apk add --no-cache ca-certificates

# Copy custom Caddy binary (capabilities already stripped in caddy stage; satisfies KSV022)
COPY --from=caddy /usr/bin/caddy /usr/bin/caddy

# Copy static files, Coraza config
COPY --from=build /app/dist/frontend-public/browser /srv
COPY Caddyfile /etc/caddy/Caddyfile
COPY coraza.conf /etc/caddy/coraza.conf

# Set permissions for static files (OpenShift-compatible)
# OpenShift uses random UIDs but assigns them to root group (GID 0)
RUN chown -R 1001:0 /srv && \
    chmod -R 755 /srv

# Create directories for Coraza WAF with restricted permissions
RUN mkdir -p /tmp/coraza && \
    chown -R 1001:0 /tmp/coraza && \
    chmod -R 770 /tmp/coraza

# Prevents ~/.config and ~/.local writes to /
ENV HOME=/tmp
ENV XDG_CONFIG_HOME=/tmp/caddy/config
ENV XDG_DATA_HOME=/tmp/caddy/data

RUN mkdir -p /tmp/caddy/config /tmp/caddy/data && \
    chown -R 1001:0 /tmp && \
    chmod -R g=u /tmp

    
RUN /usr/bin/caddy fmt --overwrite /etc/caddy/Caddyfile

EXPOSE 3000 3001
# OpenShift ignores HEALTHCHECK; kept for Trivy/Docker best practices. Uses busybox wget (no curl).
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q -O /dev/null http://127.0.0.1:3001/health || exit 1

USER 1001
ENTRYPOINT ["/usr/bin/caddy"]
CMD ["run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]