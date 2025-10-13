#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试数据拉取脚本
"""

import os
import sys
from pathlib import Path

# 添加当前目录到Python路径
sys.path.insert(0, str(Path(__file__).parent))

from data_sync import main

if __name__ == "__main__":
    print("开始测试数据同步...")
    result = main()
    if result == 0:
        print("测试成功完成！")
    else:
        print("测试失败！")
    exit(result)