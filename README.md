<h1 align="center">Newbie Image Generator</h1>

<p align="center">专为 <b>NewBie image Exp0.1</b> 模型打造的现代化 ComfyUI Web 前端</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React">
  <img src="https://img.shields.io/badge/Rust-Axum-orange?logo=rust" alt="Rust">
  <img src="https://img.shields.io/badge/Vite-7-646CFF?logo=vite" alt="Vite">
  <img src="https://img.shields.io/badge/shadcn/ui-000000?logo=shadcnui" alt="shadcn/ui">
</p>

## 关于 NewBie image Exp0.1

[NewBie image Exp0.1](https://huggingface.co/NewBie-AI/NewBie-image-Exp0.1) 是基于 Next-DiT 架构的 3.5B 参数文生图模型，专注于高质量动漫风格图像生成。

- **Text Encoder**: Gemma3-4B-it + Jina CLIP v2
- **VAE**: FLUX.1-dev 16channel VAE
- **特点**: 支持 XML 结构化提示词，多角色场景生成更精准

## 功能特性

- **双模式切换** - 简单模式直接输入提示词，结构化模式可视化编辑角色属性
- **XML 自动生成** - 无需手写 XML，专注于提示词内容本身
- **XML 导入** - 支持导入已有 XML 提示词，自动解析为可编辑自动填入对应文本
- **实时预览** - 实时显示生成进度
- **一键下载模型** - 内置 aria2c 多线程下载，支持断点续传
- **简约美观** - 现代化 UI 设计，简洁直观
- **主题切换** - 深色/浅色主题
- **响应式布局** - 支持桌面和移动端

## 快速开始

### 1. 下载安装包

从 [Releases](../../releases) 下载最新版本压缩包，解压到任意目录。

### 2. 准备模型

如果你还没有 NewBie image Exp0.1 模型，可以选择以下方式获取：

**方式一：使用下载脚本（推荐）**

运行安装包内的 `download_models.bat`，支持多线程下载和断点续传。

**方式二：手动下载**

从 HuggingFace 下载模型文件：
| 文件 | 下载链接 | 放置位置 |
|------|----------|----------|
| gemma3-4b-it.safetensors | [下载](https://huggingface.co/NewBie-AI/NewBie-image-Exp0.1/resolve/main/text_encoder/gemma3-4b-it.safetensors) | `ComfyUI/models/clip/` |
| jina-clip-v2.safetensors | [下载](https://huggingface.co/NewBie-AI/NewBie-image-Exp0.1/resolve/main/clip_model/jina-clip-v2.safetensors) | `ComfyUI/models/clip/` |
| VAE (newbie-image.safetensors) | [下载](https://huggingface.co/NewBie-AI/NewBie-image-Exp0.1/resolve/main/vae/diffusion_pytorch_model.safetensors) | `ComfyUI/models/vae/` |
| UNet (transformer) | [下载](https://huggingface.co/NewBie-AI/NewBie-image-Exp0.1/resolve/main/transformer/diffusion_pytorch_model.safetensors) | `ComfyUI/models/unet/` |

> 国内用户可使用镜像：将 `huggingface.co` 替换为 `hf-mirror.com`

### 3. 启动应用

1. 确保 ComfyUI 正在运行（默认 `127.0.0.1:8188`）
2. 双击 `start.bat`
3. 浏览器访问 http://localhost:3000

## 开发者指南

```bash
# 克隆仓库
git clone https://github.com/your-username/newbie-image-generator.git
cd newbie-image-generator

# 配置后端
cp backend/.env.example backend/.env

# 启动开发服务器
dev.bat
```

## 配置

编辑 `backend/.env`：

```env
HOST=0.0.0.0
PORT=3000
COMFYUI_HOST=127.0.0.1
COMFYUI_PORT=8188
```

## 技术栈

| 层级 | 技术 |
|------|------|
| Frontend | React 19, Vite 7, shadcn/ui |
| Backend | Rust, Axum, Tokio, WebSocket |

## 相关链接

- [NewBie image Exp0.1 模型](https://huggingface.co/NewBie-AI/NewBie-image-Exp0.1)
- [ComfyUI-NewBie 节点](https://github.com/E-Anlia/ComfyUI-NewBie)
- [LoRA 训练器](https://github.com/NewBieAI-Lab/NewbieLoraTrainer)
- [使用指南 (中文)](https://ai.feishu.cn/wiki/P3sgwUUjWih8ZWkpr0WcwXSMnTb)

## License

MIT
