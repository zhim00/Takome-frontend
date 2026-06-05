# Takome Frontend

Takome Frontend 是 Takome 小说阅读平台的前端仓库，使用 pnpm workspace 和 Turbo 管理多个 Vue 应用。

## 应用

- `apps/portal`：Takome 门户站点，展示平台入口。
- `apps/novel`：小说阅读站点，包含首页、书库、排行榜、详情页、阅读器、书架、个人中心和 AI 阅读助手。
- `packages/shared-auth`：共享鉴权工具包。

## 技术栈

- Vue 3
- TypeScript
- Vite
- Pinia
- Vue Router
- UnoCSS
- Tailwind CSS
- pnpm
- Turbo
- ESLint / oxlint / Prettier

## 环境要求

- Node.js `^20.19.0` 或 `>=22.12.0`
- pnpm `10.x`

## 安装

```powershell
corepack enable
pnpm install
```

## 配置

前端通过 `VITE_API_BASE_URL` 访问 Spring Boot 后端。

```powershell
$env:VITE_API_BASE_URL="http://localhost:8888"
```

如果未设置，默认使用：

```text
http://localhost:8888
```

## 本地开发

启动所有前端应用：

```powershell
pnpm dev
```

只启动门户站点：

```powershell
pnpm dev:portal
```

只启动小说站点：

```powershell
pnpm dev:novel
```

Vite 默认从 `5173` 开始分配端口；同时启动多个应用时通常会使用 `5173`、`5174`。后端 CORS 默认允许这两个本地端口。

## 常用命令

```powershell
pnpm lint
pnpm type-check
pnpm build
pnpm preview
```

针对单个应用：

```powershell
pnpm lint:portal
pnpm type-check:portal
pnpm build:portal
pnpm preview:portal

pnpm lint:novel
pnpm type-check:novel
pnpm build:novel
pnpm preview:novel
```

## 主要页面

小说站点：

- `/`：首页
- `/library`：书库
- `/rankings`：排行榜
- `/books/:id`：小说详情
- `/news/:id`：资讯详情
- `/reader/:chapterId`：阅读器
- `/bookshelf`：书架，需要登录
- `/profile`：个人中心，需要登录

门户站点：

- `/`：门户首页
- `/novel`：小说平台入口
- `/comic`：漫画平台入口
- `/writer`：作家专区入口

## 后端接口

默认后端地址：

```text
http://localhost:8888
```

主要接口前缀：

```text
/api/front/home
/api/front/news
/api/front/book
/api/front/user
/api/front/resource
/api/front/search
/api/front/ai
```

AI 阅读助手使用 SSE：

```text
POST /api/front/ai/chat/stream
```

前端会通过登录 token 访问后端，由后端再转发到独立的 `Takome-agent` 服务。

## Docker

仓库内提供小说站点 Dockerfile：

```powershell
docker build -f Dockerfile.novel --build-arg VITE_API_BASE_URL=http://localhost:8888 -t takome-novel-web .
```

镜像使用 Caddy 托管 `apps/novel/dist`。

## 目录结构

```text
Takome-frontend/
├─ apps/
│  ├─ portal/
│  └─ novel/
├─ packages/
│  └─ shared-auth/
├─ package.json
├─ pnpm-workspace.yaml
├─ turbo.json
└─ Dockerfile.novel
```

## 注意事项

- 不要在前端仓库中保存后端内部 token、JWT 密钥或 DeepSeek API Key。
- 生产环境需要把 `VITE_API_BASE_URL` 指向真实后端域名。
- AI agent 不由前端直接访问，前端只访问 Spring Boot 后端。
