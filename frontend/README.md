# ComfyUI Image Generator - Frontend

React/Vite 前端应用，为 ComfyUI 提供现代化的图像生成界面。

## 技术栈

- React 19 + TypeScript
- Vite 7
- Tailwind CSS 4
- ShadcnUI 组件库
- Bun 包管理器

## 项目结构

```
src/
├── components/          # React 组件
│   ├── ImageGenerator.tsx    # 主生成器组件
│   ├── GeneratedImages.tsx   # 图片展示组件
│   ├── StructuredPrompt.tsx  # 结构化提示词组件
│   ├── XMLImport.tsx         # XML 导入组件
│   ├── ThemeToggle.tsx       # 主题切换
│   └── ui/                   # Radix UI 基础组件
├── hooks/
│   └── useWebSocket.ts  # WebSocket 连接 hook
├── lib/
│   ├── api.ts           # API 客户端
│   ├── config.ts        # 配置管理
│   ├── types.ts         # TypeScript 类型定义
│   └── utils.ts         # 工具函数
├── App.tsx              # 应用入口
└── main.tsx             # 渲染入口
```

## 开发命令

```bash
# 安装依赖
bun install

# 启动开发服务器 (端口 3001)
bun run dev

# 构建生产版本
bun run build

# 代码检查
bun run lint

# 预览生产构建
bun run preview
```

## 配置

### 环境变量

创建 `.env` 文件：

```env
VITE_BACKEND_URL=http://localhost:3000
```

### ComfyUI URL

ComfyUI 地址可在 UI 中配置（Prompt 卡片 → "ComfyUI URL" 按钮），存储在 localStorage。

## API 交互

前端通过 Backend 代理与 ComfyUI 通信：

- `POST /api/generate` - 提交生成请求
- `GET /api/history/{prompt_id}` - 获取生成结果
- `GET /api/queue` - 队列状态
- `POST /api/interrupt` - 中断生成
- `WS /ws` - 实时进度更新

## WebSocket 消息类型

- `connected` - 连接成功
- `started` - 生成开始
- `progress` - 进度更新
- `preview` - 预览图 (base64)
- `completed` - 生成完成
- `error` - 错误信息
