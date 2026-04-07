# Production stage
FROM nginx:alpine AS production

RUN apk update && apk upgrade

# 1. Copy your hardcoded config directly to the final destination
# We skip /etc/nginx/template.conf entirely
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 2. Remove the envsubst installation and the complex CMD
# (You don't need gettext anymore)

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# 3. Use the standard Nginx entrypoint
CMD ["nginx", "-g", "daemon off;"]