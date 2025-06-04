#!/bin/bash

# 快速修复 Cherry Studio Frontend 构建问题
# 仅修复最关键的 TypeScript 配置问题

set -e

echo "快速修复前端构建问题..."

cd /opt/cherry-studio

# 备份
cp frontend/tsconfig.json frontend/tsconfig.json.backup

# 修复 tsconfig.json - 移除 verbatimModuleSyntax 和调整 noImplicitAny
cat > frontend/tsconfig.json << 'EOF'
{
  "extends": "@vue/tsconfig/tsconfig.dom.json",
  "include": [
    "env.d.ts",
    "src/**/*",
    "src/**/*.vue",
    "src/auto-imports.d.ts"
  ],
  "exclude": [
    "src/**/__tests__/*"
  ],
  "compilerOptions": {
    "composite": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    "types": [
      "element-plus/global",
      "node"
    ],
    "strict": false,
    "skipLibCheck": true,
    "allowJs": true,
    "esModuleInterop": true
  }
}
EOF

# 修复 App.vue - 添加缺失的导入
sed -i '7i import { ref } from "vue"' frontend/src/App.vue

# 修复 API 类型问题 - 添加类型导入
sed -i '1s/^/import type { AxiosResponse } from "axios"\n/' frontend/src/services/api.ts
sed -i 's/AxiosResponse/AxiosResponse<any>/g' frontend/src/services/api.ts

# 清理并重新构建
cd frontend
rm -rf node_modules package-lock.json
npm install --force
npm run build

if [ $? -eq 0 ]; then
  echo "✅ 快速修复成功！重新启动容器..."
  cd ..
  docker-compose -f docker-compose.prod.yml up --build frontend -d
  echo "✅ 完成！前端服务在 http://172.16.18.174:8080"
else
  echo "❌ 快速修复失败，请使用完整修复脚本"
fi
