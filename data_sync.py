#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
API 数据自动拉取和存储脚本
每小时自动运行，拉取当日和前一日的数据并存储
"""

import os
import json
import requests
import logging
from datetime import datetime, timedelta
from pathlib import Path
import pytz

def setup_logging(log_dir):
    """设置日志记录"""
    log_dir = Path(log_dir)
    log_dir.mkdir(exist_ok=True)
    
    log_file = log_dir / f"data_sync_{datetime.now().strftime('%Y%m%d')}.log"
    
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_file, encoding='utf-8'),
            logging.StreamHandler()
        ]
    )
    return logging.getLogger(__name__)

def load_config(config_path):
    """加载配置文件"""
    with open(config_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def get_beijing_dates():
    """获取北京时间的今天和昨天日期"""
    beijing_tz = pytz.timezone('Asia/Shanghai')
    now = datetime.now(beijing_tz)
    today = now.date()
    yesterday = today - timedelta(days=1)
    return today, yesterday

def fetch_data(config, from_date, to_date, logger):
    """从API拉取数据"""
    url = config['api']['base_url']
    params = {
        'username': config['api']['username'],
        'password': config['api']['password'],
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

def save_data(data_by_date, data_dir, today, yesterday, logger):
    """保存数据到文件"""
    data_dir = Path(data_dir)
    data_dir.mkdir(exist_ok=True)
    
    saved_files = []
    
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

def cleanup_old_logs(log_dir, keep_days=30):
    """清理旧日志文件"""
    log_dir = Path(log_dir)
    if not log_dir.exists():
        return
    
    cutoff_date = datetime.now() - timedelta(days=keep_days)
    
    for log_file in log_dir.glob("data_sync_*.log"):
        try:
            file_date = datetime.strptime(log_file.stem.split('_')[-1], '%Y%m%d')
            if file_date < cutoff_date:
                log_file.unlink()
        except (ValueError, OSError):
            continue

def main():
    """主函数"""
    script_dir = Path(__file__).parent
    config_path = script_dir / 'config.json'
    
    # 加载配置
    try:
        config = load_config(config_path)
    except Exception as e:
        print(f"加载配置文件失败: {e}")
        return 1
    
    # 设置日志
    logger = setup_logging(config['storage']['log_directory'])
    
    try:
        logger.info("="*50)
        logger.info("开始数据同步任务")
        
        # 获取日期
        today, yesterday = get_beijing_dates()
        logger.info(f"更新日期范围: {yesterday} 到 {today}")
        
        # 拉取数据
        data = fetch_data(config, yesterday, today, logger)
        if not data:
            logger.error("数据拉取失败，退出")
            return 1
        
        # 按日期组织数据
        data_by_date = organize_data_by_date(data)
        logger.info(f"数据覆盖日期: {list(data_by_date.keys())}")
        
        # 保存数据
        saved_files = save_data(
            data_by_date, 
            config['storage']['data_directory'], 
            today, 
            yesterday, 
            logger
        )
        
        # 清理旧日志
        cleanup_old_logs(config['storage']['log_directory'])
        
        logger.info(f"数据同步完成，共保存 {len(saved_files)} 个文件")
        logger.info("="*50)
        
        return 0
        
    except Exception as e:
        logger.error(f"程序执行出错: {e}", exc_info=True)
        return 1

if __name__ == "__main__":
    exit(main())