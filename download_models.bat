@echo off
chcp 65001 >nul
title NewBie-Image 模型下载器

echo ========================================
echo   NewBie-Image 模型下载器
echo ========================================
echo.
echo 支持断点续传，中断后重新运行即可继续下载
echo 下载目录: %~dp0models
echo.

set "BASE_URL=https://hf-mirror.com/NewBie-AI/NewBie-image-Exp0.1/resolve/main"
set "MODELS_DIR=%~dp0models"
set "ARIA2=%~dp0aria2c.exe"

:: 检查 aria2c
if not exist "%ARIA2%" (
    echo 错误: 未找到 aria2c.exe
    echo 请确保 aria2c.exe 在同一目录下
    pause
    exit /b 1
)

:: 创建目录
if not exist "%MODELS_DIR%\clip" mkdir "%MODELS_DIR%\clip"
if not exist "%MODELS_DIR%\vae" mkdir "%MODELS_DIR%\vae"
if not exist "%MODELS_DIR%\unet" mkdir "%MODELS_DIR%\unet"

echo [1/4] 下载 gemma3-4b-it.safetensors (CLIP)...
"%ARIA2%" -c -x 16 -s 16 -d "%MODELS_DIR%\clip" -o "gemma3-4b-it.safetensors" "%BASE_URL%/text_encoder/gemma3-4b-it.safetensors"
echo.

echo [2/4] 下载 jina-clip-v2.safetensors (CLIP)...
"%ARIA2%" -c -x 16 -s 16 -d "%MODELS_DIR%\clip" -o "jina-clip-v2.safetensors" "%BASE_URL%/clip_model/jina-clip-v2.safetensors"
echo.

echo [3/4] 下载 newbie-image.safetensors (VAE)...
"%ARIA2%" -c -x 16 -s 16 -d "%MODELS_DIR%\vae" -o "newbie-image.safetensors" "%BASE_URL%/vae/diffusion_pytorch_model.safetensors"
echo.

echo [4/4] 下载 NewBie-image-v0.1-exp-ep9.safetensors (UNet)...
"%ARIA2%" -c -x 16 -s 16 -d "%MODELS_DIR%\unet" -o "NewBie-image-v0.1-exp-ep9.safetensors" "%BASE_URL%/transformer/diffusion_pytorch_model.safetensors"
echo.

echo ========================================
echo 下载完成！
echo.
echo 请将 models 文件夹中的模型复制到 ComfyUI:
echo   clip/* -^> ComfyUI/models/clip/
echo   vae/*  -^> ComfyUI/models/vae/
echo   unet/* -^> ComfyUI/models/unet/
echo ========================================
echo.
pause
