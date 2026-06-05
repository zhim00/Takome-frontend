# Takome Frontend

Takome Frontend 是 Takome 项目的前端仓库，使用 pnpm workspace + Turbo 管理多个 Vue 应用。目前包含 Takome 门户站点、小说阅读站点和共享认证包。

在线演示网站: [Takome 书屋](https://takome.top)，目前仅部署了小说阅读站点

## 相关仓库

- Frontend: [zhim00/Takome-frontend](https://github.com/zhim00/Takome-frontend)
- Backend: [zhim00/Takome-backend](https://github.com/zhim00/Takome-backend)
- Agent: [zhim00/Takome-agent](https://github.com/zhim00/Takome-agent)

## 功能

- 门户首页，展示 Takome 书屋、漫画、作家专区等平台入口
- 小说首页、书库、排行榜、小说详情、资讯详情
- 阅读器、章节目录、上一章/下一章导航
- 登录状态、用户资料、书架、阅读历史、评论和反馈
- AI 阅读助手面板，支持 SSE 流式回复、工具调用状态展示和 Markdown 渲染
- 跨应用共享认证状态

## 技术栈

- Vue 3
- TypeScript
- Vite
- Vue Router
- Pinia
- UnoCSS
- Tailwind CSS
- pnpm `10.x`
- Turbo
- ESLint / oxlint / Prettier

## 项目结构

```text
Takome-frontend/
├─ apps/
│  ├─ portal/         # Takome 门户
│  └─ novel/          # 小说阅读站点
├─ packages/
│  └─ shared-auth/    # 共享认证状态
├─ package.json
├─ pnpm-workspace.yaml
├─ turbo.json
└─ Dockerfile.novel
```

## 运行要求

- Node.js `^20.19.0` or `>=22.12.0`
- pnpm `10.x`
- Takome Backend，默认 `http://localhost:8888`

## 配置

前端通过 `VITE_API_BASE_URL` 访问 Backend：

```bash
VITE_API_BASE_URL=http://localhost:8888
```

Windows PowerShell:

```powershell
$env:VITE_API_BASE_URL="http://localhost:8888"
```

未配置时默认使用 `http://localhost:8888`。

## 本地开发

安装依赖：

```bash
corepack enable
pnpm install
```

启动小说站点：

```bash
pnpm dev:novel
```

启动门户站点：

```bash
pnpm dev:portal
```

同时启动所有前端应用：

```bash
pnpm dev
```

Vite 默认从 `5173` 开始分配端口；同时运行多个应用时，通常会使用 `5173`、`5174`。Backend CORS 默认允许这些本地端口。

## 脚本

```bash
pnpm lint
pnpm type-check
pnpm build
pnpm preview
```

单独处理门户站点：

```bash
pnpm lint:portal
pnpm type-check:portal
pnpm build:portal
pnpm preview:portal
```

单独处理小说站点：

```bash
pnpm lint:novel
pnpm type-check:novel
pnpm build:novel
pnpm preview:novel
```

## 路由

Portal:

```text
/          门户首页
/novel     Takome 书屋入口
/comic     Takome 漫画入口
/writer    作家专区入口
```

Novel:

```text
/                  首页
/library           书库
/rankings          排行榜
/books/:id         小说详情
/news/:id          资讯详情
/reader/:chapterId 阅读器
/bookshelf         书架，需要登录
/profile           个人中心，需要登录
```

## 后端 API

主要请求前缀：

```text
/api/front/home
/api/front/news
/api/front/book
/api/front/user
/api/front/resource
/api/front/search
/api/front/ai
```

AI 阅读助手接口：

```text
POST /api/front/ai/chat/stream
Accept: text/event-stream
```

前端只访问 Backend。DeepSeek API Key 和 Agent 内部 token 不应出现在前端仓库或浏览器环境中。

## Docker

`Dockerfile.novel` 用于构建小说站点，并通过 Caddy 提供静态文件服务。

```bash
docker build -f Dockerfile.novel \
  --build-arg VITE_API_BASE_URL=https://api.example.com \
  -t takome-novel-web .
```

```bash
docker run --rm -p 8080:80 takome-novel-web
```
