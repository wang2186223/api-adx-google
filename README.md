# API数据自动同步系统

这个系统会每小时自动从API拉取数据并按日期存储，支持增量更新。

## 功能特点

- ⏰ 每小时自动运行（北京时间）
- 📅 只更新当日和前一日的数据
- 🗂️ 按日期分文件存储（JSON格式）
- 📊 详细的日志记录
- 🔧 灵活的配置管理

## 文件结构

```
api接口/
├── config.json          # 配置文件（API凭证、存储路径等）
├── data_sync.py         # 主要的数据同步脚本
├── test_sync.py         # 测试脚本
├── install_dependencies.sh  # 安装依赖脚本
├── setup_cron.sh        # 配置定时任务脚本
├── data/                # 数据存储目录
│   ├── data_2025-10-13.json
│   └── data_2025-10-12.json
└── logs/                # 日志存储目录
    ├── data_sync_20251013.log
    └── cron.log
```

## 快速开始

### 1. 安装依赖

```bash
chmod +x install_dependencies.sh
./install_dependencies.sh
```

### 2. 配置API凭证

编辑 `config.json` 文件，确认API凭证正确：

```json
{
    "api": {
        "base_url": "https://api.adoptima.net/get_app_data/get_adx",
        "username": "your_username",
        "password": "your_password"
    }
}
```

### 3. 测试运行

```bash
python3 test_sync.py
```

### 4. 配置定时任务

```bash
chmod +x setup_cron.sh
./setup_cron.sh
```

## 数据更新逻辑

- **当日数据**: 每小时覆盖更新
- **前一日数据**: 每小时覆盖更新  
- **历史数据**: 保持不变（快照形式）

例如：今天是2025年10月13日
- ✅ 更新：2025-10-13.json
- ✅ 更新：2025-10-12.json  
- ❌ 不更新：2025-10-11.json及更早的文件

## 监控和维护

### 查看定时任务状态
```bash
crontab -l
```

### 查看实时日志
```bash
tail -f /Users/k/Desktop/api接口/logs/data_sync_$(date +%Y%m%d).log
```

### 查看cron执行日志
```bash
tail -f /Users/k/Desktop/api接口/logs/cron.log
```

### 手动执行同步
```bash
cd /Users/k/Desktop/api接口
python3 data_sync.py
```

## 配置说明

### config.json
- `api.base_url`: API接口地址
- `api.username`: API用户名
- `api.password`: API密码
- `storage.data_directory`: 数据文件存储目录
- `storage.log_directory`: 日志文件存储目录
- `timezone`: 时区设置（默认：Asia/Shanghai）

## 故障排查

### 1. 权限问题
```bash
chmod +x data_sync.py
chmod +x test_sync.py
```

### 2. Python路径问题
确保使用Python3：
```bash
which python3
/usr/bin/python3 --version
```

### 3. 网络连接问题
检查API是否可访问：
```bash
curl "https://api.adoptima.net/get_app_data/get_adx?username=my&password=Netlink@123&from_date=2025-10-13&to_date=2025-10-13"
```

### 4. 查看详细错误
```bash
python3 data_sync.py
```

## 注意事项

1. **时区**: 系统使用北京时间（Asia/Shanghai）
2. **网络**: 确保服务器能访问API接口
3. **存储**: 确保有足够的磁盘空间
4. **权限**: 确保脚本有读写data和logs目录的权限
5. **日志清理**: 系统会自动清理30天前的日志文件

## 技术细节

- **语言**: Python 3.x
- **依赖**: requests, pytz
- **定时**: crontab (每小时第5分钟执行)
- **日志**: 按天分割，自动清理
- **数据格式**: JSON
- **错误处理**: 完善的异常捕获和日志记录