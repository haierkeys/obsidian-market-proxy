# Market Proxy - Obsidian 插件市场代理

为 Obsidian 插件市场和主题市场提供网络代理功能，解决中国大陆用户无法访问插件市场和主题市场的问题。支持桌面端和移动端。

## 🚀 最新版本 v2.0.2

### 主要更新
- **修复代理失效**：替换已失效的 `github.diybeta.com` 为 `gh.llkk.cc`
- **新增配置界面**：完整的设置界面，支持自定义代理
- **健康检查**：自动检测代理可用性
- **备用代理**：支持多个备用代理，自动切换
- **中文界面**：完整汉化设置界面

### 下载安装
- **直接下载**：[v2.0.2 修复版](https://github.com/xuha233/obsidian-market-proxy/releases/tag/v2.0.2-fixed)
- **手动安装**：下载 Release 中的 zip 文件，解压到 Obsidian 插件目录

## 📦 快速安装

### 方法一：从 Release 安装（推荐）
1. 下载 [market-proxy-v2.0.2-fixed.zip](https://github.com/xuha233/obsidian-market-proxy/releases/download/v2.0.2-fixed/market-proxy-v2.0.2-fixed.zip)
2. 解压 zip 文件
3. 将文件夹复制到 Obsidian 插件目录：
   - **Windows**: `C:\Users\你的用户名\AppData\Roaming\obsidian\plugins\`
   - **macOS**: `~/Library/Application Support/obsidian/plugins/`
   - **Linux**: `~/.config/obsidian/plugins/`
4. 重启 Obsidian
5. 进入设置 → 社区插件 → 启用 "Market Proxy"

### 方法二：从源码构建
```bash
git clone https://github.com/xuha233/obsidian-market-proxy.git
cd obsidian-market-proxy
npm install
npm run build
# 复制文件到插件目录
cp main.js manifest.json styles.css "你的Obsidian插件目录/market-proxy/"
```

## ⚙️ 功能特性

### 核心功能
- ✅ **代理修复**：修复失效的代理地址，恢复市场访问
- ✅ **配置界面**：完整的设置界面，支持自定义代理
- ✅ **健康检查**：自动检测代理健康状况
- ✅ **备用代理**：支持多个备用代理，自动切换
- ✅ **中文界面**：完整汉化，更好的中文用户体验
- ✅ **状态监控**：实时显示代理状态信息

### 默认配置
- **主代理**: `https://gh.llkk.cc/`
- **备用代理**:
  - `https://ghproxy.com/`
  - `https://mirror.ghproxy.com/`
  - `https://gitclone.com/`
  - `https://hub.fastgit.org/`

## 🎯 使用说明

### 基本使用
1. 启用插件后，插件市场和主题市场会自动通过代理访问
2. 所有发往 GitHub 的请求会自动重定向到配置的代理服务器

### 配置选项
在 Obsidian 设置 → 插件选项 → Market Proxy 中：

#### 基本设置
- **启用代理**：开关代理功能
- **主代理地址**：设置主要代理服务器 URL
- **备用代理列表**：设置备用代理（每行一个）

#### 高级功能
- **启用健康检查**：自动检查代理健康状况
- **健康检查间隔**：设置检查频率（1-24小时）
- **手动健康检查**：立即检查当前代理状态
- **切换代理**：手动切换到下一个代理
- **恢复默认设置**：重置所有配置

#### 状态显示
- **当前代理**：显示当前使用的代理地址
- **状态**：显示代理健康状况（健康/不健康/未知）
- **最后检查**：显示上次健康检查时间

## 🔧 开发构建

### 环境要求
- Node.js 16+
- npm 或 pnpm

### 构建命令
```bash
# 安装依赖
npm install

# 开发模式（监听文件变化）
npm run dev

# 生产构建
npm run build
```

### 项目结构
```
obsidian-market-proxy/
├── src/
│   ├── main.ts          # 插件主文件
│   └── styles.scss      # 样式文件
├── main.js              # 构建后的主文件
├── styles.css           # 编译后的样式
├── manifest.json        # 插件清单
├── package.json         # 项目配置
└── esbuild.config.mjs   # 构建配置
```

## 🤝 贡献指南

### 提交问题
如果发现 bug 或有功能建议，请在 [GitHub Issues](https://github.com/xuha233/obsidian-market-proxy/issues) 提交。

### 提交代码
1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/your-feature`)
3. 提交更改 (`git commit -m 'Add some feature'`)
4. 推送到分支 (`git push origin feature/your-feature`)
5. 创建 Pull Request

### 代码规范
- 使用 TypeScript 编写
- 遵循现有的代码风格
- 添加必要的注释
- 确保构建通过

## 📄 许可证

本项目基于 MIT 协议开源。详见 [LICENSE](LICENSE) 文件。

## 🙏 致谢

- 原插件作者 [HaierKeys](https://github.com/haierkeys)
- 所有贡献者和用户
- GitHub 代理服务提供者

## 🔗 相关链接

- [GitHub 仓库](https://github.com/xuha233/obsidian-market-proxy)
- [最新 Release](https://github.com/xuha233/obsidian-market-proxy/releases)
- [原项目](https://github.com/haierkeys/obsidian-market-proxy)
- [Obsidian 官网](https://obsidian.md)

---

**注意**：代理地址可能会随时间变化失效。如果遇到访问问题，请及时更新代理配置或提交 Issue。




