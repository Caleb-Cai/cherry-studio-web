# Cherry Studio Docker服务调试脚本

Write-Host "=== Cherry Studio Docker服务状态检查 ===" -ForegroundColor Green

# 检查Docker是否运行
Write-Host "`n1. 检查Docker状态..." -ForegroundColor Yellow
try {
    docker version | Out-Null
    Write-Host "✓ Docker正在运行" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker未运行或未安装" -ForegroundColor Red
    exit 1
}

# 检查当前目录
Write-Host "`n2. 当前目录:" -ForegroundColor Yellow
Get-Location

# 检查docker-compose.yml是否存在
Write-Host "`n3. 检查docker-compose.yml文件..." -ForegroundColor Yellow
if (Test-Path "docker-compose.yml") {
    Write-Host "✓ docker-compose.yml文件存在" -ForegroundColor Green
} else {
    Write-Host "✗ docker-compose.yml文件不存在" -ForegroundColor Red
    Write-Host "请确保在Cherry Studio项目根目录下运行此脚本" -ForegroundColor Red
    exit 1
}

# 检查容器状态
Write-Host "`n4. 检查容器状态..." -ForegroundColor Yellow
docker-compose ps

# 检查运行中的容器
Write-Host "`n5. 所有运行中的容器..." -ForegroundColor Yellow
docker ps

# 检查端口占用情况
Write-Host "`n6. 检查端口占用情况..." -ForegroundColor Yellow
Write-Host "端口80 (前端):"
netstat -ano | findstr ":80"
Write-Host "端口3000 (后端):"
netstat -ano | findstr ":3000"
Write-Host "端口5432 (PostgreSQL):"
netstat -ano | findstr ":5432"
Write-Host "端口6379 (Redis):"
netstat -ano | findstr ":6379"

# 检查后端健康状态
Write-Host "`n7. 检查后端API健康状态..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✓ 后端API响应正常: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "✗ 后端API无响应: $($_.Exception.Message)" -ForegroundColor Red
}

# 检查前端
Write-Host "`n8. 检查前端页面..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✓ 前端页面响应正常: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "✗ 前端页面无响应: $($_.Exception.Message)" -ForegroundColor Red
}

# 显示容器日志
Write-Host "`n9. 容器日志 (最近50行)..." -ForegroundColor Yellow
Write-Host "`n--- 后端日志 ---" -ForegroundColor Cyan
docker-compose logs --tail=50 backend 2>$null

Write-Host "`n--- 前端日志 ---" -ForegroundColor Cyan
docker-compose logs --tail=50 frontend 2>$null

Write-Host "`n--- PostgreSQL日志 ---" -ForegroundColor Cyan
docker-compose logs --tail=20 postgres 2>$null

Write-Host "`n--- Redis日志 ---" -ForegroundColor Cyan
docker-compose logs --tail=20 redis 2>$null

Write-Host "`n=== 调试完成 ===" -ForegroundColor Green
Write-Host "如果问题依然存在，请将以上输出信息提供给技术支持" -ForegroundColor Yellow
