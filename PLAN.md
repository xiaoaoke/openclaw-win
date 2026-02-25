# 🦞 OpenClaw GUI 封装方案

## 一、项目背景与目标

### 1.1 现状问题

OpenClaw 是一个强大的开源个人 AI 助手，但目前的操作完全依赖命令行（CLI），存在以下痛点：

| 痛点 | 描述 |
|------|------|
| 🔧 安装复杂 | 需要手动运行 `npm install -g openclaw@latest` 或从源码构建 |
| ⚙️ 配置繁琐 | 配置文件 `~/.openclaw/openclaw.json` 需要手动编辑 JSON5，字段众多 |
| 📲 渠道接入困难 | 每个消息渠道（WhatsApp/Telegram/Discord/Slack 等）的配置都需要终端操作 |
| 🤖 模型管理不直观 | 模型选择、API Key 管理、故障转移策略都是命令行参数 |
| 📊 状态监控缺失 | 需要通过 `openclaw gateway status` 和 `openclaw doctor` 手动查看 |
| 🔐 安全配置复杂 | DM 策略、沙箱模式、权限白名单需要理解复杂的配置结构 |
| 🛠 技能管理不便 | 技能安装、工作区管理都是文件级操作 |

### 1.2 目标

构建一个 **桌面端 GUI 应用**，将 OpenClaw 的所有 CLI 操作封装为可视化界面，让非技术用户也能轻松：

- ✅ 一键安装和启动 OpenClaw
- ✅ 图形化配置所有参数
- ✅ 可视化管理消息渠道
- ✅ 直观管理 AI 模型和 API Keys
- ✅ 实时监控 Gateway 状态
- ✅ 安全策略可视化配置
- ✅ 技能市场浏览与安装

---

## 二、OpenClaw 核心架构分析

### 2.1 系统架构

```
消息渠道 (WhatsApp / Telegram / Slack / Discord / Signal / iMessage / Teams / WebChat)
                    │
                    ▼
         ┌─────────────────────┐
         │      Gateway        │
         │   (控制平面)         │
         │  ws://127.0.0.1:18789│
         └──────────┬──────────┘
                    │
         ┌──────────┼──────────┐
         │          │          │
    Pi Agent    CLI 工具    WebChat UI
    (RPC)    (openclaw …)
         │
    ┌────┼────┐
    │    │    │
 macOS  iOS  Android
  App  Node  Node
```

### 2.2 核心组件

| 组件 | 说明 | GUI 需要封装的操作 |
|------|------|-------------------|
| **Gateway** | WebSocket 控制平面，管理会话、渠道、工具、事件 | 启动/停止/重启/状态监控 |
| **Agent** | Pi agent 运行时，RPC 模式，工具流和块流 | 模型配置/会话管理/thinking 级别 |
| **渠道系统** | 15+ 消息平台连接器 | 登录/配置/白名单/DM 策略 |
| **工具系统** | 浏览器/Canvas/节点/Cron/Sessions | 启用/禁用/配置 |
| **技能系统** | 捆绑/托管/工作区技能 + ClawHub | 浏览/安装/卸载/管理 |
| **安全系统** | 沙箱/DM 策略/配对认证 | 策略选择/白名单管理 |
| **配置系统** | JSON5 配置文件 + 环境变量 | 可视化编辑所有字段 |

### 2.3 关键 CLI 命令映射

```
openclaw onboard              → GUI 引导安装向导
openclaw gateway               → Gateway 管理面板
openclaw gateway status        → 状态仪表板
openclaw doctor                → 健康检查面板
openclaw config get/set        → 配置编辑器
openclaw channels login        → 渠道登录向导
openclaw message send          → 消息发送界面
openclaw agent --message       → 对话界面
openclaw pairing approve       → 配对管理界面
openclaw update                → 更新管理器
openclaw dashboard             → 内嵌 Control UI
openclaw nodes                 → 设备节点管理
```

---

## 三、技术选型

### 3.1 框架选择：**Electron + React + TypeScript**

| 考量维度 | 选择理由 |
|----------|---------|
| **跨平台** | Electron 支持 Windows/macOS/Linux，覆盖 OpenClaw 所有目标平台 |
| **技术统一** | OpenClaw 本身 85.2% TypeScript，GUI 使用同技术栈降低维护成本 |
| **系统集成** | Electron 可直接调用 Node.js API，执行 CLI 命令，读写配置文件 |
| **WebSocket 原生支持** | 可直接连接 Gateway 的 `ws://127.0.0.1:18789` |
| **生态丰富** | React 组件库丰富，适合构建复杂的管理界面 |
| **安装包分发** | electron-builder 支持 dmg/exe/AppImage 等主流安装格式 |

### 3.2 技术栈详情

```
前端 UI 框架:      React 19 + TypeScript 5.x
桌面框架:          Electron 34+
构建工具:          Vite + electron-vite
状态管理:          Zustand (轻量)
样式方案:          CSS Modules + CSS 变量 (设计系统)
UI 组件库:         自建设计系统 (OpenClaw 品牌风格)
图标:              Lucide Icons
图表:              Recharts (用量统计)
终端模拟:          xterm.js (内嵌终端)
WebSocket:         原生 ws (连接 Gateway)
进程管理:          Node.js child_process (管理 openclaw CLI)
配置解析:          JSON5 (与 OpenClaw 配置格式一致)
打包分发:          electron-builder
自动更新:          electron-updater
```

---

## 四、功能模块规划

### 4.1 整体功能架构图

```
┌──────────────────────────────────────────────────────────────────┐
│                    OpenClaw Desktop GUI                          │
├──────────┬───────────┬──────────┬──────────┬──────────┬─────────┤
│  安装向导  │  仪表盘    │  渠道管理  │  模型管理  │  技能市场  │  设置    │
│          │           │          │          │          │         │
│ • 环境检测 │ • 状态概览  │ • 渠道列表 │ • 模型列表 │ • 浏览    │ • 常规   │
│ • 一键安装 │ • 会话监控  │ • 快速连接 │ • API密钥  │ • 安装    │ • 安全   │
│ • 配置引导 │ • 用量统计  │ • 白名单   │ • 故障转移 │ • 管理    │ • 高级   │
│ • 渠道接入 │ • 健康检查  │ • DM策略   │ • 自定义源 │ • 更新    │ • 关于   │
│ • 完成验证 │ • 日志查看  │ • 群组配置 │ • 别名设置 │ • 创建    │ • 更新   │
└──────────┴───────────┴──────────┴──────────┴──────────┴─────────┘
```

### 4.2 模块详细设计

---

#### 📦 模块 1：安装引导向导 (Onboarding Wizard)

**目标**：替代 `openclaw onboard` 命令，提供图形化安装流程

**页面流程**：

```
欢迎页 → 环境检查 → 安装OpenClaw → 模型选择 → API密钥 → 渠道选择 → 渠道配置 → 完成
  [1]      [2]        [3]          [4]        [5]       [6]        [7]       [8]
```

| 步骤 | 功能描述 | 封装的 CLI 操作 |
|------|---------|---------------|
| 1. 欢迎页 | 项目介绍、功能预览 | 无 |
| 2. 环境检查 | 检测 Node.js ≥22、npm/pnpm、网络连通性 | `node --version` |
| 3. 安装 | 进度条显示安装过程 | `npm install -g openclaw@latest` |
| 4. 模型选择 | 卡片式展示支持的模型，选择主模型 | 写入配置文件 |
| 5. API 密钥 | 安全输入框，支持 OAuth 和 API Key | 写入环境变量 |
| 6. 渠道选择 | 图标网格选择要接入的消息平台 | 准备配置 |
| 7. 渠道配置 | 针对每个渠道的分步配置 | `openclaw channels login` 等 |
| 8. 完成 | 启动 Gateway，发送测试消息 | `openclaw gateway --install-daemon` |

---

#### 📊 模块 2：仪表盘 (Dashboard)

**目标**：实时展示 OpenClaw 系统状态，替代 `openclaw gateway status` / `openclaw doctor`

**子功能**：

| 子功能 | 描述 | 数据来源 |
|--------|------|---------|
| **状态概览卡片** | Gateway 运行状态、连接渠道数、活跃会话数、节点数 | Gateway WebSocket |
| **活跃会话列表** | 当前所有会话，支持查看历史 | `sessions_list` / `sessions_history` |
| **用量统计图表** | Token 消耗、API 调用次数、成本估算 | Usage tracking API |
| **健康检查** | 环境、配置、渠道连接的诊断结果 | `openclaw doctor` |
| **实时日志** | 滚动日志流，支持过滤和搜索 | `openclaw logs` / Gateway events |
| **快捷操作区** | 重启 Gateway、重载配置、发送测试消息 | 对应 CLI 命令 |

**界面布局**：

```
┌──────────────────────────────────────────────┐
│  🟢 Gateway Running    ⟳ Restart    ⚙ Config │
├──────────────────────────────────────────────┤
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐         │
│ │渠道  │ │会话  │ │ Token │ │ 节点  │         │
│ │ 5/8  │ │  12  │ │ 45.2k│ │  3   │         │
│ └──────┘ └──────┘ └──────┘ └──────┘         │
├──────────────────────┬───────────────────────┤
│   活跃会话列表        │    用量趋势图         │
│                      │                       │
│  📱 WhatsApp:main    │    ████▓▓▓░░░         │
│  💬 Telegram:group1  │    Token / 小时        │
│  🎮 Discord:dm       │                       │
├──────────────────────┴───────────────────────┤
│   实时日志流                                  │
│   [INFO] Gateway started on :18789           │
│   [INFO] WhatsApp channel connected          │
│   [WARN] Telegram rate limit approaching     │
└──────────────────────────────────────────────┘
```

---

#### 📲 模块 3：渠道管理 (Channel Manager)

**目标**：可视化管理所有消息渠道连接

**支持的渠道**：

| 渠道 | 配置方式 | GUI 封装 |
|------|---------|---------|
| WhatsApp | Baileys (设备链接) | 二维码扫描 + 白名单管理 |
| Telegram | Bot Token | Token 输入 + Webhook 配置 |
| Discord | Bot Token | Token 输入 + Guild 配置 |
| Slack | Bot Token + App Token | OAuth 登录流程 |
| Signal | signal-cli | 安装引导 + 注册流程 |
| BlueBubbles | Server URL + Password | 连接配置 |
| iMessage | macOS 原生 | 权限授权引导 |
| Microsoft Teams | Bot Framework | 应用注册引导 |
| Google Chat | Chat API | API 配置引导 |
| Matrix | Extension | 服务器配置 |
| WebChat | Gateway 内建 | 自动可用 |

**每个渠道的管理功能**：

- 🔌 **连接/断开** - 一键切换
- ⚙️ **配置编辑** - 表单化编辑渠道参数
- 👥 **白名单管理** - 添加/移除允许通信的联系人
- 🔒 **DM 策略** - 下拉选择：pairing / allowlist / open / disabled
- 👥 **群组配置** - 群组白名单、@提及门控
- 📋 **配对请求** - 查看待审批的配对码，一键批准/拒绝
- 📊 **渠道统计** - 该渠道的消息量、活跃度

---

#### 🤖 模块 4：模型管理 (Model Manager)

**目标**：可视化管理 AI 模型配置，替代手动编辑配置文件

**子功能**：

| 子功能 | 描述 |
|--------|------|
| **模型列表** | 卡片展示已配置模型，显示提供商、别名、状态 |
| **主模型选择** | 拖拽排序或下拉选择主模型 |
| **故障转移链** | 可视化编排 fallback 顺序 |
| **API 密钥管理** | 安全存储/编辑各提供商的 API Key / OAuth |
| **自定义提供商** | 添加自托管或第三方模型 API 端点 |
| **模型目录** | 浏览所有支持的模型，带能力标签（视觉/长上下文/编码等） |
| **Thinking 级别** | 滑块选择：off → minimal → low → medium → high → xhigh |

**支持的模型提供商**：

```
Anthropic (Claude Opus/Sonnet/Haiku)
OpenAI (GPT-5.2/Codex)
Google (Gemini)
DeepSeek
OpenRouter (聚合)
自定义端点
```

---

#### 🧩 模块 5：技能市场 (Skills Hub)

**目标**：连接 ClawHub 技能注册表，提供 GUI 化的技能管理

**子功能**：

| 子功能 | 描述 |
|--------|------|
| **浏览市场** | 搜索、分类浏览 ClawHub 上的技能 |
| **技能详情** | 描述、截图、评分、安装量 |
| **一键安装** | 安装到 `~/.openclaw/workspace/skills/` |
| **已安装管理** | 启用/禁用/卸载/更新已安装技能 |
| **技能编辑器** | 简单的 SKILL.md 编辑器，用于自定义技能 |
| **工作区管理** | 管理 AGENTS.md / SOUL.md / TOOLS.md |

---

#### ⚙️ 模块 6：设置中心 (Settings)

**目标**：替代直接编辑 `~/.openclaw/openclaw.json`

**设置分类**：

| 分类 | 包含的配置项 |
|------|------------|
| **常规** | 工作区路径、语言、主题(深色/浅色)、启动行为 |
| **Gateway** | 端口、绑定地址、认证模式(none/password/token) |
| **Agent** | 默认模型、thinking level、verbose、heartbeat 间隔 |
| **安全** | 沙箱模式、工具白名单/黑名单、DM 全局策略 |
| **Tailscale** | 模式(off/serve/funnel)、密码认证 |
| **自动化** | Cron 任务管理、Webhook 配置、Gmail Pub/Sub |
| **浏览器** | 启用/禁用、Chrome/Chromium 路径、颜色主题 |
| **环境变量** | .env 文件管理、变量编辑器 |
| **高级** | 配置文件原始 JSON5 编辑器(带语法高亮和校验) |
| **更新** | 当前版本、更新通道(stable/beta/dev)、一键更新 |

---

#### 💬 模块 7：内嵌对话界面 (Chat)

**目标**：提供类似 WebChat 的对话体验，无需打开浏览器

**功能**：

- 直接通过 Gateway WebSocket 与 Agent 对话
- 支持 Markdown 渲染
- 支持图片/文件发送和接收
- 会话列表和历史记录
- 聊天命令快捷输入（/status, /new, /think 等）
- Agent-to-Agent 会话视图

---

#### 🖥 模块 8：内嵌终端 (Terminal)

**目标**：为高级用户保留 CLI 操作能力

**功能**：

- 内嵌 xterm.js 终端
- 预填充 `openclaw` 命令路径
- 命令历史和自动补全
- 支持同时运行多个终端标签

---

## 五、UI/UX 设计规范

### 5.1 设计语言

| 属性 | 规范 |
|------|------|
| **设计风格** | 现代扁平化 + 微玻璃态（Glassmorphism），科技感强 |
| **主题** | 深色模式为主（匹配开发者偏好），支持浅色模式 |
| **主色调** | 🦞 龙虾红 `#FF4500` (OpenClaw 品牌色) + 深海蓝 `#0A1628` |
| **强调色** | 翠绿 `#00E676` (成功/在线), 琥珀 `#FFB300` (警告), 红 `#FF5252` (错误) |
| **字体** | Inter (UI) + JetBrains Mono (代码/终端) |
| **圆角** | 组件 8px, 卡片 12px, 按钮 8px |
| **动效** | 微动效，状态切换 200ms ease，页面切换 300ms |
| **图标** | Lucide Icons (与 OpenClaw 生态一致) |

### 5.2 布局结构

```
┌──────────────────────────────────────────────────┐
│  □ OpenClaw Desktop              ─ □ ✕           │  ← 标题栏 (自定义)
├────────┬─────────────────────────────────────────┤
│        │  🏠 仪表盘  >  概览                      │  ← 面包屑导航
│  🏠    ├─────────────────────────────────────────┤
│  📲    │                                         │
│  🤖    │           主内容区域                      │
│  🧩    │                                         │
│  💬    │                                         │
│  ⚙️    │                                         │
│        │                                         │
│        │                                         │
├────────┼─────────────────────────────────────────┤
│ 🟢 在线 │  Gateway: Running | Port: 18789 | v2026│  ← 状态栏
└────────┴─────────────────────────────────────────┘
  ↑ 侧边导航 (可折叠)
```

---

## 六、与 OpenClaw 的集成方式

### 6.1 集成层次

GUI 通过 **三层方式** 与 OpenClaw 交互：

```
┌─────────────────────────────────────┐
│         OpenClaw Desktop GUI        │
├─────────────────────────────────────┤
│ 层1: WebSocket 直连 Gateway         │  ← 实时数据（会话/事件/状态）
│     ws://127.0.0.1:18789            │
├─────────────────────────────────────┤
│ 层2: CLI 命令封装                    │  ← 操作执行（安装/配置/诊断）
│     child_process.spawn('openclaw') │
├─────────────────────────────────────┤
│ 层3: 配置文件直接读写                │  ← 配置管理（读写 JSON5）
│     ~/.openclaw/openclaw.json       │
│     ~/.openclaw/.env                │
│     ~/.openclaw/credentials/        │
└─────────────────────────────────────┘
```

### 6.2 关键 API 对接

| Gateway RPC 方法 | GUI 用途 |
|-----------------|---------|
| `config.get` | 读取当前配置 |
| `config.apply` | 全量更新配置 |
| `config.patch` | 部分更新配置 |
| `sessions.list` | 获取会话列表 |
| `sessions.history` | 获取会话历史 |
| `sessions.patch` | 修改会话参数 |
| `node.list` | 获取已连接节点 |
| `node.describe` | 获取节点能力 |
| `node.invoke` | 执行节点操作 |

---

## 七、开发阶段规划

### Phase 1：基础框架 + 安装向导（2~3 周） ✅ 已完成

**目标**：让用户能通过 GUI 完成 OpenClaw 的首次安装

- [x] 项目脚手架搭建（Electron + React + Vite）
- [x] 设计系统实现（颜色/字体/组件库/CSS 变量）
- [x] 应用外壳（窗口/侧边栏/路由/状态栏）
- [x] 环境检测模块（Node.js 版本/网络检查）
- [x] 安装管理器（npm 安装 + 进度追踪）
- [x] 安装引导向导完整流程（8 步向导 + UI 动画）

### Phase 2：仪表盘 + Gateway 管理（2 周） ✅ 已完成

**目标**：提供实时系统监控

- [x] Gateway WebSocket 连接管理（useGateway Hook）
- [x] 状态仪表盘（连接状态/会话数/渠道状态/Token用量）
- [x] 健康检查面板（诊断按钮）
- [x] 实时日志查看器
- [x] 快捷操作（启动/停止/重启 Gateway）

### Phase 3：渠道管理（2~3 周） ✅ 已完成

**目标**：可视化管理所有消息渠道

- [x] 渠道列表和状态展示（8 渠道 + 搜索过滤）
- [ ] WhatsApp 连接（二维码扫描集成）— 需要 Baileys
- [ ] Telegram Bot 配置向导 — 待接入
- [ ] Discord Bot 配置向导 — 待接入
- [ ] Slack App 配置向导 — 待接入
- [x] 其他渠道的配置表单（概览/配置/白名单/群组/日志 Tab）
- [x] 白名单和 DM 策略管理（UI 完成）
- [x] 配对请求管理面板（批准/拒绝）

### Phase 4：模型管理 + 配置中心（1~2 周） ✅ 已完成

**目标**：可视化管理 AI 模型和全局配置

- [x] 模型卡片浏览和选择（4 提供商 12 模型）
- [x] API Key 安全管理（脱敏显示）
- [x] 故障转移链编排（拖拽排序 UI）
- [x] 配置中心所有设置项（useConfig 真实读写）
- [ ] JSON5 高级编辑器 — 后续迭代

### Phase 5：真实数据集成 + 对话界面（2 周） ✅ 已完成

**目标**：提供技能管理和对话功能

- [x] 技能市场浏览和搜索（分类/标签/评分）
- [x] 技能安装/卸载/管理 UI
- [x] 内嵌 WebChat 对话界面（流式响应/多会话/模型选择）
- [x] Sidebar Gateway 快速操作弹窗
- [x] StatusBar 增强（PID/运行时间/内存/时钟）
- [x] Settings 真实配置读写 + 环境变量编辑器
- [x] WebSocket 通信层 Hook（useWebSocket）

### Phase 6：Chat 升级 + 打包构建（1~2 周） ✅ 已完成

**目标**：产品化

- [x] Chat 流式打字效果 + 智能回复引擎
- [x] Chat 会话管理（新建/删除/切换）
- [x] Chat 模型实时切换 + WS 状态指示
- [x] electron-builder 多平台配置（NSIS/DMG/AppImage）
- [x] 构建脚本完善（build:win/mac/linux）
- [ ] 内嵌终端（xterm.js）— 后续
- [ ] 自动更新机制（electron-updater）— 后续
- [ ] 用户文档 — 后续

---

## 八、项目目录结构

```
openclaw-gui/
├── electron/                    # Electron 主进程
│   ├── main.ts                 # 主进程入口
│   ├── preload.ts              # 预加载脚本
│   ├── ipc/                    # IPC 通信处理
│   │   ├── gateway.ts          # Gateway 管理
│   │   ├── config.ts           # 配置读写
│   │   ├── installer.ts        # 安装管理
│   │   ├── channels.ts         # 渠道操作
│   │   └── cli.ts              # CLI 命令封装
│   ├── services/               # 后端服务
│   │   ├── gateway-ws.ts       # WebSocket 客户端
│   │   ├── config-manager.ts   # 配置文件管理
│   │   ├── process-manager.ts  # 进程管理
│   │   └── updater.ts          # 自动更新
│   └── utils/                  # 工具函数
├── src/                        # React 渲染进程
│   ├── App.tsx                 # 根组件
│   ├── main.tsx                # 渲染进程入口
│   ├── styles/                 # 全局样式
│   │   ├── index.css           # 全局 CSS
│   │   ├── variables.css       # CSS 变量 (设计系统)
│   │   ├── reset.css           # 样式重置
│   │   └── animations.css      # 动画定义
│   ├── components/             # 通用组件
│   │   ├── ui/                 # 基础 UI 组件
│   │   │   ├── Button/
│   │   │   ├── Card/
│   │   │   ├── Input/
│   │   │   ├── Select/
│   │   │   ├── Toggle/
│   │   │   ├── Modal/
│   │   │   ├── Toast/
│   │   │   ├── Badge/
│   │   │   ├── Tooltip/
│   │   │   └── Tabs/
│   │   ├── layout/             # 布局组件
│   │   │   ├── Sidebar/
│   │   │   ├── Header/
│   │   │   ├── StatusBar/
│   │   │   └── PageContainer/
│   │   └── shared/             # 共享业务组件
│   │       ├── ChannelIcon/
│   │       ├── ModelCard/
│   │       ├── StatusIndicator/
│   │       └── LogViewer/
│   ├── pages/                  # 页面组件
│   │   ├── Onboarding/         # 安装向导
│   │   │   ├── Welcome.tsx
│   │   │   ├── EnvCheck.tsx
│   │   │   ├── Install.tsx
│   │   │   ├── ModelSelect.tsx
│   │   │   ├── ApiKey.tsx
│   │   │   ├── ChannelSelect.tsx
│   │   │   ├── ChannelConfig.tsx
│   │   │   └── Complete.tsx
│   │   ├── Dashboard/          # 仪表盘
│   │   │   ├── Overview.tsx
│   │   │   ├── Sessions.tsx
│   │   │   ├── Usage.tsx
│   │   │   ├── Health.tsx
│   │   │   └── Logs.tsx
│   │   ├── Channels/           # 渠道管理
│   │   │   ├── ChannelList.tsx
│   │   │   ├── ChannelDetail.tsx
│   │   │   ├── Pairing.tsx
│   │   │   └── configs/        # 各渠道配置组件
│   │   ├── Models/             # 模型管理
│   │   │   ├── ModelList.tsx
│   │   │   ├── ApiKeys.tsx
│   │   │   └── Failover.tsx
│   │   ├── Skills/             # 技能市场
│   │   │   ├── Browse.tsx
│   │   │   ├── Installed.tsx
│   │   │   └── SkillDetail.tsx
│   │   ├── Chat/               # 对话界面
│   │   │   ├── ChatView.tsx
│   │   │   └── SessionList.tsx
│   │   ├── Terminal/           # 内嵌终端
│   │   └── Settings/           # 设置中心
│   │       ├── General.tsx
│   │       ├── Gateway.tsx
│   │       ├── Security.tsx
│   │       ├── Advanced.tsx
│   │       └── Update.tsx
│   ├── hooks/                  # 自定义 Hooks
│   │   ├── useGateway.ts       # Gateway 连接
│   │   ├── useConfig.ts        # 配置管理
│   │   ├── useChannels.ts      # 渠道状态
│   │   └── useSessions.ts      # 会话管理
│   ├── stores/                 # Zustand 状态
│   │   ├── gateway.ts
│   │   ├── config.ts
│   │   ├── channels.ts
│   │   └── ui.ts
│   └── utils/                  # 工具函数
│       ├── ipc.ts              # IPC 通信封装
│       ├── json5.ts            # JSON5 解析
│       └── format.ts           # 格式化工具
├── resources/                  # 静态资源
│   ├── icons/                  # 应用图标
│   └── images/                 # 图片资源
├── package.json
├── electron-builder.yml        # 打包配置
├── electron.vite.config.ts     # Vite 配置
├── tsconfig.json
└── PLAN.md                     # 本方案文档
```

---

## 九、风险与注意事项

| 风险 | 等级 | 应对策略 |
|------|------|---------|
| OpenClaw 版本更新导致 CLI 接口变化 | 🟡 中 | 通过语义版本检测适配，优先使用 Gateway RPC |
| WhatsApp 二维码扫描需要特殊处理 | 🟡 中 | 集成 Baileys 的 QR 渲染或 terminal 输出解析 |
| macOS/Linux 权限差异 | 🟢 低 | 使用 Node.js 跨平台 API，避免平台特定代码 |
| 配置文件并发写入冲突 | 🟡 中 | 使用 config.patch RPC 而非直接文件写入 |
| Electron 安装包体积过大 | 🟢 低 | 使用 electron-builder 优化 + asar 打包 |
| Gateway 未启动时 GUI 功能受限 | 🟡 中 | 降级为 CLI 模式操作，提示启动 Gateway |

---

## 十、总结

本方案将 OpenClaw 的全部 CLI 操作封装为一个 **现代化桌面 GUI 应用**，覆盖从安装到日常使用的所有场景。通过 Electron + React 的技术栈，实现：

1. **零门槛安装**：图形化引导向导，告别命令行
2. **所见即所得配置**：表单化编辑替代 JSON 手写
3. **实时状态感知**：WebSocket 直连 Gateway，状态一目了然
4. **渠道一站式管理**：15+ 消息平台的统一接入管理
5. **跨平台一致体验**：Windows / macOS / Linux 统一界面

预计总开发周期 **10~14 周**，建议从 Phase 1（基础框架 + 安装向导）开始，每个 Phase 可独立发布可用版本。
