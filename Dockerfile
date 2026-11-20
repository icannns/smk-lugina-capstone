FROM node:24-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates openssl \
    && rm -rf /var/lib/apt/lists/*

FROM base AS dependencies
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund

FROM dependencies AS build
COPY . .
RUN npm run build

FROM base AS local
RUN install -d -m 0700 -o node -g node /run/bojong/db-auth /run/bojong/app-auth /var/lib/bojong/attachments
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json /app/prisma.config.ts /app/next.config.ts /app/tsconfig.json ./
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/src ./src
COPY --from=build /app/public ./public
COPY --from=build /app/docker ./docker
COPY --from=build --chown=node:node /app/.next ./.next
USER node
CMD ["node", "docker/local.mjs", "start"]
