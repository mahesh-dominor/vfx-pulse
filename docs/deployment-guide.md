# Deployment Guide

## 1. Prerequisites
- Node.js 22
- PostgreSQL 16
- Environment variables configured from .env.example

## 2. Build and migrate
1. npm ci
2. npm run prisma:generate
3. npm run prisma:migrate -- --name production
4. npm run build

## 3. Start
- npm run start

## 4. Docker deployment
1. docker compose build
2. docker compose up -d
3. docker compose exec app npm run prisma:migrate -- --name production

## 5. Smoke checks
- Open /login
- Validate /dashboard loads
- Validate /api/dashboard/stats returns 200 for authenticated user
