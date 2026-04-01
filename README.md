# devin-task-board

Next.js 16 + PostgreSQL + Prisma + Tailwind CSS v4 のタスク管理アプリ。

## Tech Stack

- Next.js 16.2（App Router）+ React 19 + TypeScript
- PostgreSQL 16 + Prisma ORM
- Tailwind CSS v4
- Docker Compose

## Setup (Docker)

```bash
cp .env.example .env
docker compose up --build
```

- アプリ: http://localhost:3000
- DB: localhost:5432

初回起動時に Prisma migration が自動適用されます。

## Setup (Local)

```bash
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

## Documentation

- [ER図（Mermaid）](docs/erd.md)
- [OpenAPI 仕様](docs/openapi.yaml)
- [仕様書](docs/spec.md)
- [ユーザーストーリー](docs/user-stories.md)
- [Issue 計画](docs/issue.md)

## Project Structure

```
src/app/layout.tsx       # ルートレイアウト
src/app/page.tsx         # トップページ
src/app/globals.css      # Tailwind CSS
src/lib/prisma.ts        # Prisma シングルトン
prisma/schema.prisma     # DB スキーマ
docker-compose.yml       # app + db
Dockerfile               # Node.js 22 Alpine
```
