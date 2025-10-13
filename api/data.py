import json
import os
import requests
from datetime import datetime, timedelta
from http.server import BaseHTTPRequestHandler
import pytz

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            # 获取API凭证（从环境变量）
            username = os.environ.get('API_USERNAME', 'my')
            password = os.environ.get('API_PASSWORD', 'Netlink@123')
            
            # 获取北京时间的今天和昨天
            beijing_tz = pytz.timezone('Asia/Shanghai')
            now = datetime.now(beijing_tz)
            today = now.date()
            yesterday = today - timedelta(days=1)
            
            # 构建API请求
            api_url = "https://api.adoptima.net/get_app_data/get_adx"
            params = {
                'username': username,
                'password': password,
                'from_date': yesterday.strftime('%Y-%m-%d'),
                'to_date': today.strftime('%Y-%m-%d')
            }
            
            # 请求数据
            response = requests.get(api_url, params=params, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            
            # 设置响应头
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            
            # 返回数据
            self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))
            
        except Exception as e:
            # 错误处理
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            error_response = {
                "error": str(e),
                "message": "Failed to fetch data from API"
            }
            self.wfile.write(json.dumps(error_response).encode('utf-8'))
    
    def do_OPTIONS(self):
        # 处理预检请求
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()