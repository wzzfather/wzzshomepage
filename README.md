# wzzshomepage

魏子政的个人空间 - Vue版本

## 项目简介

这是一个基于Vue 3 + TypeScript的个人空间网站，包含：

- 🚀 科技风格的响应式界面
- 🎮 交互式飞船鼠标效果
- 📝 博客笔记分类展示
- 🎯 小游戏合集
- ✨ 动态背景粒子效果

## 技术栈

- Vue 3
- TypeScript
- Vite
- CSS3 动画
- Font Awesome 图标

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 在线访问

🌐 [访问网站](https://wzzfather.github.io/wzzshomepage/)

---

© 2025 魏子政的个人空间 | 探索 · 学习 · 搞事情
```

### 3. **创建GitHub Actions自动部署**

创建 `.github/workflows/deploy.yml` 文件：
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        
      - name: Setup Pages
        uses: actions/configure-pages@v4
        
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### 4. **执行Git命令**

在项目目录中执行：
```bash
# 初始化Git仓库
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit: Vue personal space website"

# 设置主分支
git branch -M main

# 添加远程仓库
git remote add origin https://github.com/wzzfather/wzzshomepage.git

# 推送到GitHub
git push -u origin main
```

### 5. **启用GitHub Pages**

1. 进入GitHub仓库页面
2. 点击 `Settings` 标签
3. 在左侧菜单找到 `Pages`
4. 在 `Source` 中选择 `GitHub Actions`
5. 保存设置

### 6. **访问网站**

部署完成后，您的网站将在以下地址可用：
🌐 **https://wzzfather.github.io/wzzshomepage/**

## 🎯 部署后的效果

- ✅ 自动化部署：每次推送代码都会自动构建和部署
- ✅ 响应式更新：修改代码后推送即可更新网站
- ✅ Vue框架完全生效：所有交互效果都正常工作
- ✅ 免费托管：GitHub Pages提供免费的HTTPS网站托管

## 📝 后续维护

以后要更新网站，只需要：
1. 修改代码
2. `git add .`
3. `git commit -m "更新说明"`
4. `git push`

GitHub Actions会自动构建和部署新版本！

您现在可以按照这些步骤将项目推送到GitHub了。有任何问题都可以随时询问！ 