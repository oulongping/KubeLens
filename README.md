# KubeLens

KubeLens 是一个 Kubernetes 集群可视化监控工具，提供直观的 Web 界面来查看和管理集群中的各种资源。

## 功能特性

- 📊 集群总览：查看集群整体状态和资源使用情况
- 🚀 Pod 管理：查看 Pod 状态、日志和详细信息
- ⚙️ 工作负载：管理 Deployments、StatefulSets 和 DaemonSets
- 🖥️ 节点监控：查看节点状态和资源使用情况
- 🌐 服务发现：查看和管理集群中的服务
- 📋 事件查看：实时查看集群事件
- 🌙 深色主题：支持深色和浅色主题切换

## 技术栈

### 后端
- Go 语言
- Gin Web 框架
- Kubernetes Client-go
- PostgreSQL (可选，用于存储扩展信息)

### 前端
- React
- TypeScript
- React Router
- Axios

## 快速开始

### 环境要求

- Go 1.19+
- Node.js 16+
- Kubernetes 集群访问权限
- kubectl 配置

### 后端服务部署

1. 克隆项目：
   ```bash
   git clone https://github.com/your-username/kubelens.git
   cd kubelens
   ```

2. 设置环境变量：
   ```bash
   export DATABASE_URL=postgres://postgres:postgres@localhost:5432/kubelens?sslmode=disable
   export LISTEN_ADDR=:8082
   ```

3. 运行后端服务：
   ```bash
   cd cmd/server
   go run main.go
   ```

### 前端部署

1. 安装依赖：
   ```bash
   cd frontend
   npm install
   ```

2. 启动开发服务器：
   ```bash
   npm start
   ```

3. 构建生产版本：
   ```bash
   npm run build
   ```

## API 接口

后端服务提供以下 RESTful API 接口：

- `GET /api/health` - 健康检查
- `GET /api/namespaces` - 获取命名空间列表
- `GET /api/workloads` - 获取工作负载列表
- `GET /api/pods` - 获取 Pod 列表
- `GET /api/nodes` - 获取节点列表
- `GET /api/events` - 获取事件列表
- `GET /api/services` - 获取服务列表
- `GET /api/pods/:namespace/:podName/logs` - 获取 Pod 日志
- `POST /api/workloads/:namespace/:name/:kind/restart` - 重启工作负载

## 配置

### 环境变量

- `DATABASE_URL` - PostgreSQL 数据库连接 URL (可选)
- `LISTEN_ADDR` - 服务监听地址，默认 `:8082`

### Kubernetes 配置

KubeLens 使用标准的 Kubernetes 配置文件，支持：

1. In-cluster 配置 (在 Kubernetes 集群内运行时)
2. Kubeconfig 文件 (默认使用 `$HOME/.kube/config`)

## 许可证

本项目采用 Apache License 2.0 许可证，详情请查看 [LICENSE](LICENSE) 文件。

## 贡献

欢迎提交 Issue 和 Pull Request 来改进本项目！

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request