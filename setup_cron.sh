#!/bin/bash
# 自动配置crontab的脚本

SCRIPT_DIR="/Users/k/Desktop/api接口"
PYTHON_SCRIPT="$SCRIPT_DIR/data_sync.py"

# 检查Python脚本是否存在
if [ ! -f "$PYTHON_SCRIPT" ]; then
    echo "错误: Python脚本不存在: $PYTHON_SCRIPT"
    exit 1
fi

# 设置脚本可执行权限
chmod +x "$PYTHON_SCRIPT"

# 创建临时crontab文件
TEMP_CRON=$(mktemp)

# 获取当前的crontab内容（如果存在）
crontab -l 2>/dev/null > "$TEMP_CRON"

# 检查是否已经存在相同的任务
if grep -q "data_sync.py" "$TEMP_CRON"; then
    echo "警告: 发现已存在的数据同步任务，将会被替换"
    # 删除现有的data_sync任务
    grep -v "data_sync.py" "$TEMP_CRON" > "${TEMP_CRON}.new"
    mv "${TEMP_CRON}.new" "$TEMP_CRON"
fi

# 添加新的cron任务 - 每小时的第5分钟执行 [已禁用]
# echo "5 * * * * cd $SCRIPT_DIR && /usr/bin/python3 $PYTHON_SCRIPT >> $SCRIPT_DIR/logs/cron.log 2>&1" >> "$TEMP_CRON"

# 安装新的crontab [已禁用]
# crontab "$TEMP_CRON"

# 清理临时文件
rm "$TEMP_CRON"

echo "Crontab配置完成！"
echo "任务将在每小时的第5分钟执行"
echo "查看当前crontab: crontab -l"
echo "查看日志: tail -f $SCRIPT_DIR/logs/cron.log"