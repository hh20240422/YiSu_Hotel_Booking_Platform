# 易宿酒店管理平台 v2 · 重构版

## 项目结构

```
hotel-v2/
├── backend/                   # Node.js + Express API 服务
│   ├── server.js              # 路由、中间件、数据库逻辑
│   └── package.json
│
└── frontend/                  # React + Vite 前端
    ├── index.html             # HTML 入口
    ├── vite.config.js         # Vite 配置（含 API 代理）
    ├── package.json           # 依赖：React Router v6、Redux Toolkit、Axios
    └── src/
        ├── main.jsx           # 挂载 React + Redux Provider
        ├── App.jsx            # 根组件，接入 RouterProvider
        │
        ├── api/               # Axios 封装（网络请求层）
        │   ├── axiosInstance.js   # 配置 baseURL、JWT拦截器、错误处理
        │   ├── auth.js            # login / register 接口
        │   └── hotels.js          # 酒店 CRUD + 审核接口
        │
        ├── store/             # Redux Toolkit 状态管理
        │   ├── index.js           # configureStore，合并所有 reducer
        │   ├── authSlice.js       # 登录/注册 async thunk，用户状态
        │   ├── hotelsSlice.js     # 酒店列表、增删改查 async thunk
        │   └── uiSlice.js         # Toast 通知队列
        │
        ├── router/            # React Router v6 路由配置
        │   └── index.jsx          # 路由表 + RequireAuth/RequireGuest 守卫
        │
        ├── layouts/           # 页面框架
        │   └── MainLayout.jsx     # 侧边栏 + <Outlet />（子路由渲染位置）
        │
        ├── pages/             # 页面级组件（每个路由对应一个）
        │   ├── DashboardPage.jsx
        │   ├── auth/
        │   │   ├── LoginPage.jsx
        │   │   └── RegisterPage.jsx
        │   └── hotels/
        │       └── HotelsPage.jsx
        │
        ├── components/        # 可复用 UI 组件
        │   ├── common/
        │   │   ├── StatusBadge.jsx    # 酒店状态标签
        │   │   ├── StarDisplay.jsx    # 星级展示 + 选择器
        │   │   └── Toast.jsx          # 全局通知（读 Redux ui.toasts）
        │   └── hotel/
        │       ├── HotelFormDrawer.jsx    # 酒店录入/编辑表单
        │       └── HotelDetailDrawer.jsx  # 酒店详情 + 审核操作
        │
        └── styles/
            └── global.css         # 全局样式变量和组件样式
```

---

## 快速启动

### 1. 启动后端
```bash
cd backend
npm install
node server.js        # http://localhost:3001
```

### 2. 启动前端
```bash
cd frontend
npm install
npm run dev           # http://localhost:5173
```

> Vite 的 proxy 会自动将 `/api/*` 转发到 `localhost:3001`，无需手动改跨域配置。

---

## 技术栈说明

| 库 | 作用 |
|----|------|
| **React Router v6** | 声明式路由、`<Outlet>` 嵌套布局、路由守卫 |
| **Redux Toolkit** | 全局状态管理；`createSlice` 简化 reducer；`createAsyncThunk` 处理异步请求 |
| **Axios** | HTTP 请求；拦截器统一注入 JWT token 和处理 401 |
| **Express** | 后端路由框架；中间件（CORS、JSON解析、JWT验证） |
| **better-sqlite3** | 同步 SQLite 驱动，适合 Node.js 小型应用 |
| **Vite** | 极速开发服务器，生产构建打包 |

---

## 测试账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | admin123 |
| 商户 | merchant1 | merchant123 |
