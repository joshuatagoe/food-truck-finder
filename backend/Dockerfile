# ---- build stage ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./tsconfig.json
COPY src ./src
RUN npm run build

# ---- runtime stage ----
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# runtime artifacts
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package*.json ./

# ✅ ADD RUNTIME DATA *HERE* (before USER app)
RUN mkdir -p /app/data
# adjust left paths to where these files live in your repo (relative to build context)
COPY data/Mobile_Food_Facility_Permit.csv /app/data/
# if your .sql are at repo root:
COPY src/db/*.sql /app/db/
# or if they’re under backend/sql:
# COPY sql/*.sql /app/data/

# permissions & user
RUN addgroup -S app && adduser -S app -G app && chown -R app:app /app
USER app

EXPOSE 3000
CMD ["node", "dist/index.js"]