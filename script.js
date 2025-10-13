// 全局变量
let allData = [];
let filteredData = [];
let revenueChart = null;
let adunitChart = null;

// DOM元素
const loadingSpinner = document.getElementById('loadingSpinner');
const refreshBtn = document.getElementById('refreshBtn');
const searchInput = document.getElementById('searchInput');
const exportBtn = document.getElementById('exportBtn');
const dateFilter = document.getElementById('dateFilter');
const siteFilter = document.getElementById('siteFilter');
const adunitFilter = document.getElementById('adunitFilter');

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    initEventListeners();
    loadData();
});

// 事件监听器
function initEventListeners() {
    refreshBtn.addEventListener('click', loadData);
    searchInput.addEventListener('input', debounce(filterData, 300));
    exportBtn.addEventListener('click', exportToCSV);
    dateFilter.addEventListener('change', filterData);
    siteFilter.addEventListener('change', filterData);
    adunitFilter.addEventListener('change', filterData);
}

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 显示/隐藏加载动画
function showLoading() {
    loadingSpinner.classList.add('show');
}

function hideLoading() {
    loadingSpinner.classList.remove('show');
}

// 加载数据
async function loadData() {
    showLoading();
    
    try {
        // 尝试从静态数据文件加载
        const response = await fetch('./public/data/latest.json');
        if (!response.ok) {
            throw new Error('无法加载数据文件');
        }
        
        const data = await response.json();
        allData = data;
        filteredData = [...allData];
        
        updateFilters();
        updateStats();
        updateCharts();
        updateTable();
        updateLastUpdateTime();
        
    } catch (error) {
        console.error('加载数据失败:', error);
        // 使用示例数据作为fallback
        loadSampleData();
    } finally {
        hideLoading();
    }
}

// 加载示例数据
function loadSampleData() {
    // 生成示例数据
    const sampleData = generateSampleData();
    allData = sampleData;
    filteredData = [...allData];
    
    updateFilters();
    updateStats();
    updateCharts();
    updateTable();
    updateLastUpdateTime();
}

// 生成示例数据
function generateSampleData() {
    const sites = ['adx.myfreenovel.com', '(unknown)'];
    const adunits = ['banner_1', 'banner_2', 'banner_3', 'banner_4', 'banner_5'];
    const dates = [];
    
    // 生成最近7天的日期
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
    }
    
    const data = [];
    
    dates.forEach(date => {
        sites.forEach(site => {
            adunits.forEach(adunit => {
                const clicks = Math.floor(Math.random() * 10);
                const impressions = Math.floor(Math.random() * 100) + clicks;
                const revenue = Math.random() * 10;
                
                data.push({
                    date: date,
                    site: site,
                    url: 'myfreenovel.com',
                    adunit: adunit,
                    ad_unit_1: 'myfreenovel.com',
                    ad_unit_code: null,
                    clicks: clicks.toString(),
                    impressions: impressions.toString(),
                    ecpm: impressions > 0 ? (revenue / impressions * 1000).toFixed(6) : '0',
                    ad_request: Math.floor(Math.random() * 200).toString(),
                    responses_served: impressions.toString(),
                    match_rate: impressions > 0 ? ((impressions / Math.max(1, Math.floor(Math.random() * 200))) * 100).toFixed(2) : '0',
                    total_active_view_measurable_imp: '0',
                    revenue: revenue.toFixed(6),
                    country: ''
                });
            });
        });
    });
    
    return data;
}

// 更新筛选器选项
function updateFilters() {
    const dates = [...new Set(allData.map(item => item.date))].sort().reverse();
    const sites = [...new Set(allData.map(item => item.site))].filter(site => site !== '(unknown)');
    const adunits = [...new Set(allData.map(item => item.adunit))];
    
    updateSelectOptions(dateFilter, dates, 'all', '所有日期');
    updateSelectOptions(siteFilter, sites, 'all', '所有站点');
    updateSelectOptions(adunitFilter, adunits, 'all', '所有广告位');
}

// 更新选择框选项
function updateSelectOptions(selectElement, options, defaultValue, defaultText) {
    selectElement.innerHTML = `<option value="${defaultValue}">${defaultText}</option>`;
    options.forEach(option => {
        if (option && option.trim() !== '') {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = option;
            selectElement.appendChild(optionElement);
        }
    });
}

// 筛选数据
function filterData() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedDate = dateFilter.value;
    const selectedSite = siteFilter.value;
    const selectedAdunit = adunitFilter.value;
    
    filteredData = allData.filter(item => {
        const matchesSearch = !searchTerm || 
            Object.values(item).some(value => 
                value && value.toString().toLowerCase().includes(searchTerm)
            );
        
        const matchesDate = selectedDate === 'all' || item.date === selectedDate;
        const matchesSite = selectedSite === 'all' || item.site === selectedSite;
        const matchesAdunit = selectedAdunit === 'all' || item.adunit === selectedAdunit;
        
        return matchesSearch && matchesDate && matchesSite && matchesAdunit;
    });
    
    updateStats();
    updateCharts();
    updateTable();
}

// 更新统计卡片
function updateStats() {
    const totalClicks = filteredData.reduce((sum, item) => sum + parseInt(item.clicks || 0), 0);
    const totalImpressions = filteredData.reduce((sum, item) => sum + parseInt(item.impressions || 0), 0);
    const totalRevenue = filteredData.reduce((sum, item) => sum + parseFloat(item.revenue || 0), 0);
    const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions * 100) : 0;
    
    document.getElementById('totalClicks').textContent = totalClicks.toLocaleString();
    document.getElementById('totalImpressions').textContent = totalImpressions.toLocaleString();
    document.getElementById('totalRevenue').textContent = `$${totalRevenue.toFixed(2)}`;
    document.getElementById('avgCTR').textContent = `${avgCTR.toFixed(2)}%`;
}

// 更新图表
function updateCharts() {
    updateRevenueChart();
    updateAdunitChart();
}

// 更新收入趋势图
function updateRevenueChart() {
    const ctx = document.getElementById('revenueChart').getContext('2d');
    
    // 按日期聚合收入数据
    const revenueByDate = {};
    filteredData.forEach(item => {
        const date = item.date;
        if (!revenueByDate[date]) {
            revenueByDate[date] = 0;
        }
        revenueByDate[date] += parseFloat(item.revenue || 0);
    });
    
    const sortedDates = Object.keys(revenueByDate).sort();
    const revenueData = sortedDates.map(date => revenueByDate[date]);
    
    if (revenueChart) {
        revenueChart.destroy();
    }
    
    revenueChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: sortedDates,
            datasets: [{
                label: '日收入 ($)',
                data: revenueData,
                borderColor: 'rgb(102, 126, 234)',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toFixed(2);
                        }
                    }
                }
            }
        }
    });
}

// 更新广告位表现图
function updateAdunitChart() {
    const ctx = document.getElementById('adunitChart').getContext('2d');
    
    // 按广告位聚合收入数据
    const revenueByAdunit = {};
    filteredData.forEach(item => {
        const adunit = item.adunit;
        if (!revenueByAdunit[adunit]) {
            revenueByAdunit[adunit] = 0;
        }
        revenueByAdunit[adunit] += parseFloat(item.revenue || 0);
    });
    
    const adunits = Object.keys(revenueByAdunit);
    const revenues = Object.values(revenueByAdunit);
    
    if (adunitChart) {
        adunitChart.destroy();
    }
    
    adunitChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: adunits,
            datasets: [{
                data: revenues,
                backgroundColor: [
                    'rgba(102, 126, 234, 0.8)',
                    'rgba(118, 75, 162, 0.8)',
                    'rgba(255, 99, 132, 0.8)',
                    'rgba(54, 162, 235, 0.8)',
                    'rgba(255, 205, 86, 0.8)'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: $${value.toFixed(2)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// 更新数据表格
function updateTable() {
    const tbody = document.getElementById('dataTableBody');
    tbody.innerHTML = '';
    
    filteredData.forEach(item => {
        const row = document.createElement('tr');
        row.className = 'fade-in';
        
        const clicks = parseInt(item.clicks || 0);
        const impressions = parseInt(item.impressions || 0);
        const ctr = impressions > 0 ? (clicks / impressions * 100).toFixed(2) : '0';
        
        row.innerHTML = `
            <td>${item.date}</td>
            <td>${item.site}</td>
            <td>${item.adunit}</td>
            <td>${clicks.toLocaleString()}</td>
            <td>${impressions.toLocaleString()}</td>
            <td>$${parseFloat(item.revenue || 0).toFixed(4)}</td>
            <td>$${parseFloat(item.ecpm || 0).toFixed(4)}</td>
            <td>${ctr}%</td>
            <td>${parseFloat(item.match_rate || 0).toFixed(2)}%</td>
        `;
        
        tbody.appendChild(row);
    });
}

// 导出CSV
function exportToCSV() {
    const headers = ['日期', '站点', '广告位', '点击数', '展示数', '收入', 'eCPM', 'CTR', '匹配率'];
    const csvContent = [
        headers.join(','),
        ...filteredData.map(item => {
            const clicks = parseInt(item.clicks || 0);
            const impressions = parseInt(item.impressions || 0);
            const ctr = impressions > 0 ? (clicks / impressions * 100).toFixed(2) : '0';
            
            return [
                item.date,
                `"${item.site}"`,
                item.adunit,
                clicks,
                impressions,
                parseFloat(item.revenue || 0).toFixed(4),
                parseFloat(item.ecpm || 0).toFixed(4),
                ctr,
                parseFloat(item.match_rate || 0).toFixed(2)
            ].join(',');
        })
    ].join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `adx_data_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

// 更新最后更新时间
function updateLastUpdateTime() {
    const now = new Date();
    const timeString = now.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    document.getElementById('lastUpdate').textContent = `最后更新: ${timeString}`;
}