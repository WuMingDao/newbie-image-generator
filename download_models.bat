@echo off
chcp 65001 >nul
title NewBie-Image 模型下载器

echo ========================================
echo   NewBie-Image 模型下载器
echo ========================================
echo.
echo 下载目录: %~dp0models
echo.

set "BASE_URL=https://hf-mirror.com/NewBie-AI/NewBie-image-Exp0.1/resolve/main"
set "MODELS_DIR=%~dp0models"

:: 创建目录
if not exist "%MODELS_DIR%\clip" mkdir "%MODELS_DIR%\clip"
if not exist "%MODELS_DIR%\vae" mkdir "%MODELS_DIR%\vae"
if not exist "%MODELS_DIR%\unet" mkdir "%MODELS_DIR%\unet"

:: 下载 CLIP 模型 1
echo [1/4] 下载 gemma3-4b-it.safetensors (CLIP)...
if exist "%MODELS_DIR%\clip\gemma3-4b-it.safetensors" (
    echo       已存在，跳过
) else (
    curl -L -o "%MODELS_DIR%\clip\gemma3-4b-it.safetensors.tmp" "%BASE_URL%/text_encoder/gemma3-4b-it.safetensors"
    if errorlevel 1 (
        echo       下载失败！
        del "%MODELS_DIR%\clip\gemma3-4b-it.safetensors.tmp" 2>nul
    ) else (
        move /Y "%MODELS_DIR%\clip\gemma3-4b-it.safetensors.tmp" "%MODELS_DIR%\clip\gemma3-4b-it.safetensors" >nul
    )
)
echo.

:: 下载 CLIP 模型 2
echo [2/4] 下载 jina-clip-v2.safetensors (CLIP)...
if exist "%MODELS_DIR%\clip\jina-clip-v2.safetensors" (
    echo       已存在，跳过
) else (
    curl -L -o "%MODELS_DIR%\clip\jina-clip-v2.safetensors.tmp" "%BASE_URL%/clip_model/jina-clip-v2.safetensors"
    if errorlevel 1 (
        echo       下载失败！
        del "%MODELS_DIR%\clip\jina-clip-v2.safetensors.tmp" 2>nul
    ) else (
        move /Y "%MODELS_DIR%\clip\jina-clip-v2.safetensors.tmp" "%MODELS_DIR%\clip\jina-clip-v2.safetensors" >nul
    )
)
echo.

:: 下载 VAE
echo [3/4] 下载 newbie-image.safetensors (VAE)...
if exist "%MODELS_DIR%\vae\newbie-image.safetensors" (
    echo       已存在，跳过
) else (
    curl -L -o "%MODELS_DIR%\vae\newbie-image.safetensors.tmp" "%BASE_URL%/vae/diffusion_pytorch_model.safetensors"
    if errorlevel 1 (
        echo       下载失败！
        del "%MODELS_DIR%\vae\newbie-image.safetensors.tmp" 2>nul
    ) else (
        move /Y "%MODELS_DIR%\vae\newbie-image.safetensors.tmp" "%MODELS_DIR%\vae\newbie-image.safetensors" >nul
    )
)
echo.

:: 下载 UNet
echo [4/4] 下载 NewBie-image-v0.1-exp-ep9.safetensors (UNet)...
if exist "%MODELS_DIR%\unet\NewBie-image-v0.1-exp-ep9.safetensors" (
    echo       已存在，跳过
) else (
    curl -L -o "%MODELS_DIR%\unet\NewBie-image-v0.1-exp-ep9.safetensors.tmp" "%BASE_URL%/transformer/diffusion_pytorch_model.safetensors"
    if errorlevel 1 (
        echo       下载失败！
        del "%MODELS_DIR%\unet\NewBie-image-v0.1-exp-ep9.safetensors.tmp" 2>nul
    ) else (
        move /Y "%MODELS_DIR%\unet\NewBie-image-v0.1-exp-ep9.safetensors.tmp" "%MODELS_DIR%\unet\NewBie-image-v0.1-exp-ep9.safetensors" >nul
    )
)
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
