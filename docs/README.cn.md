<div align="center">

<img src="../assets/banner.png" alt="Isenax - 等距图表工具" width="100%" />

</div>

<p align="center">
 <a href="../README.md">English</a> | <a href="README.cn.md">简体中文</a> | <a href="README.es.md">Español</a> | <a href="README.pt.md">Português</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.bn.md">বাংলা</a> | <a href="README.ru.md">Русский</a> | <a href="README.id.md">Bahasa Indonesia</a> | <a href="README.de.md">Deutsch</a> | <a href="README.ko.md">한국어</a> | <a href="README.ja.md">日本語</a> | <a href="README.it.md">Italiano</a> | <a href="README.pl.md">Polski</a> | <a href="README.tr.md">Türkçe</a>
</p>

## 说明：

本仓库（Isenax）是 [Abrar74774/FossFLOW](https://github.com/Abrar74774/FossFLOW) 的衍生项目，而该项目本身是 stan-smith/FossFLOW 的一个分支（它又是 [markmanx/isoflow](https://github.com/markmanx/isoflow) 的分支），最初是为了通过 PR 向原始仓库贡献代码而创建的。然而作者的 GitHub 用户名似乎已更改为 [mug-book-droid](https://github.com/mug-book-droid)，且其活动已设为私密（账号可能已被封禁？），导致原始仓库无法访问。

目前，我打算将此仓库（现更名为 Isenax）作为 FossFLOW 开发的延续，同样欢迎通过 PR 进行贡献。

您可以在 `backup/stan-smith-FossFLOW` 分支上查看我抓取的原始仓库的最后状态。

---

Isenax 是一款功能强大的开源渐进式 Web 应用（PWA），用于创建精美的等距图表。它基于 React 和 <a href="https://github.com/markmanx/isoflow">Isoflow</a> 库（分支后以 fossflow 名称发布到 npm，在本分支中以 isenax 名称发布）构建，完全在浏览器中运行并支持离线使用。

---
<p align="center">
<b>在线试用 --> https://nyangko.github.io/Isenax/ <-- </b>
</p>

<img width="100%" alt="Isenax-Isometric-Diagramming-Tool" src="https://github.com/user-attachments/assets/15956888-991a-4b5e-9849-dbd82d6f9308" />

---------

## 🐳 使用 Docker 快速部署

```bash
# 使用 Docker Compose（推荐 - 包含持久化存储）
docker compose up

# 或直接从 Docker Hub 运行（包含持久化存储）
docker run -p 80:80 -v $(pwd)/diagrams:/data/diagrams nyangko/isenax:latest
```

Docker 中默认启用了服务器存储。您的图表将（默认以 root 身份）保存到宿主机的 `./diagrams` 目录。要更改保存时使用的用户或组 ID，请设置 `PUID` 和 `PGID` 环境变量。

要禁用服务器存储，请设置 `ENABLE_SERVER_STORAGE=false`：
```bash
docker run -p 80:80 -e ENABLE_SERVER_STORAGE=false nyangko/isenax:latest
```

### HTTP 基本认证（可选）

使用 HTTP Basic Auth 保护您的 Isenax 实例：

```bash
# 使用 Docker Compose
HTTP_AUTH_USER=admin HTTP_AUTH_PASSWORD=secret docker compose up

# 或使用 docker run
docker run -p 80:80 \
  -e HTTP_AUTH_USER=admin \
  -e HTTP_AUTH_PASSWORD=secret \
  nyangko/isenax:latest
```

> **说明**：必须同时设置这两个变量才能启用认证。如果其中任何一个为空，应用将无需登录即可访问。

## 快速开始（本地开发）

```bash
# 克隆仓库
git clone https://github.com/nyangko/Isenax
cd Isenax

# 安装依赖
npm install

# 构建库（首次需要）
npm run build:lib

# 启动开发服务器
npm run dev
```

在浏览器中打开 [http://localhost:3000](http://localhost:3000)。

## Monorepo 结构

这是一个包含四个包的 monorepo：

- `packages/isenax-lib` - 用于绘制网络图表的 React 组件库（使用 Rslib/Rspack 构建）
- `packages/isenax-app` - 封装并展示该库的渐进式 Web 应用（使用 RSBuild 构建）
- `packages/isenax-backend` - 提供可选的自托管图表存储的 Express 服务器（用于 Docker 部署）
- `packages/isenax-mcp` - MCP(Model Context Protocol)服务器，让外部 AI 代理可以直接读取、创建和编辑你的图表（stdio 或 Streamable HTTP）

### 开发命令

```bash
# 开发
npm run dev          # 启动应用开发服务器
npm run dev:lib      # 库开发的监听模式

# 构建
npm run build        # 同时构建库和应用
npm run build:lib    # 仅构建库
npm run build:app    # 仅构建应用

# 测试和检查
npm test             # 运行单元测试
npm run lint         # 检查代码规范错误

# E2E 测试（Selenium）
cd e2e-tests
./run-tests.sh       # 运行端到端测试（需要 Docker 和 Python）

# 发布
npm run publish:lib  # 将库发布到 npm
```

## 使用方法

### 创建图表

1. **添加项目**：
   - 按下右上角菜单的 "+" 按钮，组件库将出现在左侧
   - 从库中拖放组件到画布上
   - 或者右键点击网格并选择 "Add node"

2. **连接项目**：
   - 选择连接器工具（按 'C' 键或点击连接器图标）
   - **点击模式**（默认）：先点击第一个节点，再点击第二个节点
   - **拖动模式**（可选）：从第一个节点点击并拖动到第二个节点
   - 在 设置 → 连接器 标签页中切换模式

3. **保存您的工作**：
   - **快速保存** - 保存到浏览器会话
   - **导出** - 下载为 JSON 文件
   - **导入** - 从 JSON 文件加载

4. **使用图层面板整理**:
   - 点击工具栏的图层按钮，可在一个列表中查看画布上的所有节点、连接器、区域和文本
   - 在列表中选择项目后，可直接在同一面板的“编辑”标签页中修改
   - 屏幕较窄时，可通过画布右下角的按钮以底部弹出面板的形式打开

### 存储选项

- **会话存储**：浏览器关闭时清除的临时保存
- **导出/导入**：以 JSON 文件形式永久存储
- **自动保存**：每 5 秒自动将更改保存到会话中

### MCP 集成（AI 代理）

Isenax 自带 MCP 服务器，让外部 AI 代理（Claude 等）可以直接读取、创建和编辑你的图表：

1. 打开 **设置 → MCP** 并开启，会显示连接 URL 和 Bearer 令牌。
2. 用该 URL/令牌连接你的 MCP 客户端（`packages/isenax-mcp` 同时支持 stdio 和 Streamable HTTP 传输）。
3. 代理所做的修改会实时反映在打开该图表的任意标签页中，无需刷新——修改进行中会显示"MCP 正在写入..."提示。

内置图标只通过 id 往返（不会向代理发送 base64 数据），`update_diagram_patch` 工具让代理只发送改动的字段，而不必重新发送整个模型。

## 最近新增功能

### 重新设计的设置
可搜索（⌘K）的双栏设置对话框取代了原来的标签条 — 按 快捷键/平移/缩放、显示、图标包 和 扩展 分组，支持取消/保存操作，并且每个分区都有"恢复默认值"按钮。

### 图层面板
新增搜索和类型筛选（全部/节点/连接器/区域/文本），节点会嵌套显示在其所属区域下，支持逐项显示/锁定切换，面板现在固定停靠在屏幕边缘，并可配置工具栏位置。

### 节点编辑面板
重新设计的摘要卡片带有更大的图标、选中徽标、区域/连接/类型标签，新增标签显示模式（始终显示/悬停显示/隐藏），以及点击后可将画布跳转到关联节点的连接摘要。

### MCP 工具集成
设置 → MCP 面板现在会列出已连接的 AI 代理可调用的工具（list/get/create/update/patch/delete diagram）。

### 图标包品牌徽标
AWS、GCP、Azure 和 Kubernetes 图标包现在会在设置中显示真实的品牌徽标，而不是通用的首字母徽标。

### 连接器多路复用
<img src="../demos/connectors.gif" alt="Multiplexed connectors demo" />

### 复制粘贴项目
<img src="../demos/copy-paste-demo.gif" alt="Copy pasting demo" />

## 贡献

欢迎贡献！请参阅 [CONTRIBUTING.md](../CONTRIBUTING.md) 获取指南。

## 文档

- [ISENAX_ENCYCLOPEDIA.md](ISENAX_ENCYCLOPEDIA.md) - 代码库综合指南
- [CONTRIBUTING.md](../CONTRIBUTING.md) - 贡献指南

## 许可证

MIT
