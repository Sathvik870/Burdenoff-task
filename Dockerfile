FROM oven/bun:1

WORKDIR /app

COPY package.json bun.lock ./

RUN bun install --frozen-lockfile

COPY . .

ENV DATABASE_URL="postgresql://document_vault:build@localhost:5432/document_vault"

RUN bun run gendb

EXPOSE 4000

CMD ["sh", "-c", "bunx prisma migrate deploy && bun run src/server.ts"]