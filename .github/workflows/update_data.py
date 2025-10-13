#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GitHub Actions数据更新脚本
定时从API拉取数据并存储到public/data目录
"""

import os
import json
import requests
import logging
from datetime import datetime, timedelta
from pathlib import Path
import pytz

def setup_logging():
    """设置日志记录"""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[logging.StreamHandler()]
    )
    return logging.getLogger(__name__)

def get_beijing_dates():
    """获取北京时间的今天和昨天日期"""
    beijing_tz = pytz.timezone('Asia/Shanghai')
    now = datetime.now(beijing_tz)
    today = now.date()
    yesterday = today - timedelta(days=1)
    return today, yesterday

def fetch_api_data(username, password, from_date, to_date, logger):
    """从API拉取数据"""
    url = "https://api.adoptima.net/get_app_data/get_adx"
    params = {
        'username': username,
        'password': password,
        'from_date': from_date.strftime('%Y-%m-%d'),
        'to_date': to_date.strftime('%Y-%m-%d')
    }
    
    try:
        logger.info(f"正在拉取数据: {params['from_date']} 到 {params['to_date']}")
        response = requests.get(url, params=params, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        logger.info(f"成功拉取 {len(data)} 条记录")
        return data
    
    except requests.exceptions.RequestException as e:
        logger.error(f"API请求失败: {e}")
        return None
    except json.JSONDecodeError as e:
        logger.error(f"JSON解析失败: {e}")
        return None

def organize_data_by_date(data):
    """按日期组织数据"""
    organized = {}
    for record in data:
        date = record.get('date')
        if date:
            if date not in organized:
                organized[date] = []
            organized[date].append(record)
    return organized

def save_data_files(data_by_date, today, yesterday, logger):
    """保存数据到文件"""
    # 创建public/data目录
    data_dir = Path('public/data')
    data_dir.mkdir(parents=True, exist_ok=True)
    
    saved_files = []
    
    # 保存最新的完整数据集（用于API端点）
    all_recent_data = []
    for date, records in data_by_date.items():
        date_obj = datetime.strptime(date, '%Y-%m-%d').date()
        if date_obj in [today, yesterday]:
            all_recent_data.extend(records)
    
    # 保存到latest.json（API端点使用）
    latest_file = data_dir / 'latest.json'
    try:
        with open(latest_file, 'w', encoding='utf-8') as f:
            json.dump(all_recent_data, f, ensure_ascii=False, indent=2)
        logger.info(f"已保存最新数据到 latest.json ({len(all_recent_data)} 条记录)")
        saved_files.append('latest.json')
    except Exception as e:
        logger.error(f"保存latest.json失败: {e}")
    
    # 按日期保存历史数据
    for date, records in data_by_date.items():
        date_obj = datetime.strptime(date, '%Y-%m-%d').date()
        
        # 只更新今天和昨天的数据
        if date_obj in [today, yesterday]:
            filename = f"data_{date}.json"
            file_path = data_dir / filename
            
            try:
                with open(file_path, 'w', encoding='utf-8') as f:
                    json.dump(records, f, ensure_ascii=False, indent=2)
                
                logger.info(f"已保存 {len(records)} 条记录到 {filename}")
                saved_files.append(filename)
                
            except Exception as e:
                logger.error(f"保存文件 {filename} 失败: {e}")
        else:
            logger.info(f"跳过历史数据 {date} (不在更新范围内)")
    
    return saved_files

def update_metadata(saved_files, logger):
    """更新元数据文件"""
    metadata = {
        'last_update': datetime.now(pytz.timezone('Asia/Shanghai')).isoformat(),
        'files_updated': saved_files,
        'total_files': len(saved_files)
    }
    
    data_dir = Path('public/data')
    metadata_file = data_dir / 'metadata.json'
    
    try:
        with open(metadata_file, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, ensure_ascii=False, indent=2)
        logger.info("已更新元数据文件")
    except Exception as e:
        logger.error(f"更新元数据失败: {e}")

def main():
    """主函数"""
    logger = setup_logging()
    
    # 获取环境变量
    username = os.environ.get('API_USERNAME')
    password = os.environ.get('API_PASSWORD')
    
    if not username or not password:
        logger.error("缺少API凭证环境变量")
        return 1
    
    try:
        logger.info("="*50)
        logger.info("开始GitHub Actions数据更新任务")
        
        # 获取日期
        today, yesterday = get_beijing_dates()
        logger.info(f"更新日期范围: {yesterday} 到 {today}")
        
        # 拉取数据
        data = fetch_api_data(username, password, yesterday, today, logger)
        if not data:
            logger.error("数据拉取失败，退出")
            return 1
        
        # 按日期组织数据
        data_by_date = organize_data_by_date(data)
        logger.info(f"数据覆盖日期: {list(data_by_date.keys())}")
        
        # 保存数据
        saved_files = save_data_files(data_by_date, today, yesterday, logger)
        
        # 更新元数据
        update_metadata(saved_files, logger)
        
        logger.info(f"数据更新完成，共保存 {len(saved_files)} 个文件")
        logger.info("="*50)
        
        return 0
        
    except Exception as e:
        logger.error(f"程序执行出错: {e}", exc_info=True)
        return 1

if __name__ == "__main__":
    exit(main())