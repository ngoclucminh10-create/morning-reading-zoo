@echo off
echo 早读神器启动脚本
echo ==================

REM 尝试不同的端口
set PORTS=8000 8080 3000 5000 8888 9000

for %%p in (%PORTS%) do (
    echo 尝试端口 %%p...
    netstat -ano | findstr :%%p >nul
    if errorlevel 1 (
        echo 端口 %%p 可用，正在启动服务器...
        echo.
        echo 访问地址: http://localhost:%%p
        echo 按 Ctrl+C 停止服务器
        echo.
        cd /d %~dp0
        python -m http.server %%p
        goto :end
    ) else (
        echo 端口 %%p 已被占用
    )
)

echo 所有端口都被占用了！
:end
pause