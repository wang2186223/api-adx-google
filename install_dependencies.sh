#!/bin/bash
# 安装Python依赖包

echo "正在安装Python依赖包..."

# 检查pip是否存在
if ! command -v pip3 &> /dev/null; then
    echo "错误: pip3 未找到，请先安装Python3和pip3"
    exit 1
fi

# 安装依赖包
pip3 install requests pytz

echo "依赖包安装完成！"
echo "现在可以运行: chmod +x setup_cron.sh && ./setup_cron.sh 来配置定时任务"