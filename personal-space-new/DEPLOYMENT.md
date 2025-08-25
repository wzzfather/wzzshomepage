# GitHub Pages 部署指南

这个文档说明如何将Vue.js个人空间项目部署到GitHub Pages。

## 项目结构

```
personal-space-new/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions 自动部署配置
├── public/                     # 静态资源目录
├── src/                        # Vue源代码
├── dist/                       # 构建输出目录（自动生成）
├── vite.config.ts             # Vite配置文件
├── package.json               # 项目依赖配置
└── package-lock.json          # 依赖锁定文件
```

## 部署配置

### 1. Vite配置 (`vite.config.ts`)

项目已配置正确的base路径：
```typescript
base: process.env.NODE_ENV === 'production' ? '/wzzshomepage/' : '/'
```

这确保了在GitHub Pages上的正确路径解析。

### 2. GitHub Actions工作流 (`.github/workflows/deploy.yml`)

自动部署流程包括：
- **构建环境**: Node.js 20
- **依赖安装**: 使用 `npm ci` 进行干净安装
- **内容扫描**: 自动扫描笔记和游戏内容
- **项目构建**: 生成生产环境静态文件
- **自动部署**: 部署到GitHub Pages

### 3. 权限配置

工作流已配置必要的权限：
```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```

## 部署步骤

### 第一次部署

1. **推送代码到GitHub**:
   ```bash
   cd personal-space-new
   git add .
   git commit -m "Initial commit with deployment configuration"
   git push origin main
   ```

2. **启用GitHub Pages**:
   - 进入GitHub仓库设置页面
   - 找到"Pages"选项
   - 在"Source"中选择"GitHub Actions"
   - 保存设置

3. **检查部署状态**:
   - 在仓库的"Actions"标签页查看工作流运行状态
   - 部署成功后，网站将在 `https://[用户名].github.io/wzzshomepage/` 可访问

### 后续更新

每次推送到main分支都会自动触发部署：
```bash
git add .
git commit -m "Update content"
git push origin main
```

## 故障排除

### 常见问题

1. **依赖锁文件错误**:
   - 确保 `package-lock.json` 文件存在并已提交
   - 如果没有，运行 `npm install` 生成

2. **路径问题**:
   - 检查 `vite.config.ts` 中的 `base` 配置
   - 确保与GitHub仓库名称匹配

3. **构建失败**:
   - 检查 `package.json` 中的构建脚本
   - 确保所有依赖都已正确安装

4. **内容扫描问题**:
   - 检查 `scripts/scan-content.js` 脚本
   - 确保笔记和游戏文件夹结构正确

### 调试命令

本地测试构建：
```bash
npm run build
npm run preview
```

查看构建输出：
```bash
ls -la dist/
```

## 项目特性

- **动态内容扫描**: 自动发现并配置笔记分类和游戏
- **响应式设计**: 适配各种设备屏幕
- **飞船鼠标**: 独特的交互体验
- **粒子背景**: 科技感视觉效果
- **自适应布局**: 根据内容数量动态调整网格布局

## 维护说明

- 添加新笔记：在对应分类文件夹中添加HTML文件
- 添加新游戏：在游戏配置中添加新项目并提供文件夹
- 更新样式：修改 `src/assets/main.css` 文件
- 修改布局：编辑 `src/App.vue` 文件

部署完成后，你的个人空间将自动更新并在GitHub Pages上可访问！
