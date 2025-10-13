// 合并原来的两个JavaScript文件功能
// 全局变量
let allData = [];
let filteredData = [];
let reportData = [];
let processedData = {};

// 图表对象
let revenueChart = null;
let adunitChart = null;
let detailedRevenueChart = null;
let impressionClickChart = null;
let siteRevenueChart = null;
let adunitRevenueChart = null;

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
        const response = await fetch('../../public/data/latest.json');
        if (!response.ok) {
            throw new Error('无法加载数据文件');
        }
        
        const data = await response.json();
        allData = data;
        reportData = data;
        filteredData = [...allData];
        
        // 处理报告数据
        processReportData();
        
        // 更新所有界面
        updateFilters();
        updateStats();
        updateCharts();
        updateTable();
        updateLastUpdateTime();
        updateReportSections();
        
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
    const sampleData = generateSampleData();
    allData = sampleData;
    reportData = sampleData;
    filteredData = [...allData];
    
    processReportData();
    updateFilters();
    updateStats();
    updateCharts();
    updateTable();
    updateLastUpdateTime();
    updateReportSections();
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
                const adRequests = impressions + Math.floor(Math.random() * 50);
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
                    ad_request: adRequests.toString(),
                    responses_served: impressions.toString(),
                    match_rate: adRequests > 0 ? ((impressions / adRequests) * 100).toFixed(2) : '0',
                    total_active_view_measurable_imp: '0',
                    revenue: revenue.toFixed(6),
                    country: ''
                });
            });
        });
    });
    
    return data;
}

// 处理报告数据
function processReportData() {
    const byDate = {};
    const bySite = {};
    const byAdunit = {};
    
    reportData.forEach(item => {
        const date = item.date;
        const site = item.site;
        const adunit = item.adunit;
        
        // 按日期分组
        if (!byDate[date]) {
            byDate[date] = {
                revenue: 0,
                impressions: 0,
                clicks: 0,
                adRequests: 0,
                responsesServed: 0
            };
        }
        
        byDate[date].revenue += parseFloat(item.revenue || 0);
        byDate[date].impressions += parseInt(item.impressions || 0);
        byDate[date].clicks += parseInt(item.clicks || 0);
        byDate[date].adRequests += parseInt(item.ad_request || 0);
        byDate[date].responsesServed += parseInt(item.responses_served || 0);
        
        // 按站点分组
        if (!bySite[site]) {
            bySite[site] = {
                revenue: 0,
                impressions: 0,
                clicks: 0,
                adRequests: 0,
                responsesServed: 0
            };
        }
        
        bySite[site].revenue += parseFloat(item.revenue || 0);
        bySite[site].impressions += parseInt(item.impressions || 0);
        bySite[site].clicks += parseInt(item.clicks || 0);
        bySite[site].adRequests += parseInt(item.ad_request || 0);
        bySite[site].responsesServed += parseInt(item.responses_served || 0);
        
        // 按广告位分组
        if (!byAdunit[adunit]) {
            byAdunit[adunit] = {
                revenue: 0,
                impressions: 0,
                clicks: 0,
                adRequests: 0,
                responsesServed: 0
            };
        }
        
        byAdunit[adunit].revenue += parseFloat(item.revenue || 0);
        byAdunit[adunit].impressions += parseInt(item.impressions || 0);
        byAdunit[adunit].clicks += parseInt(item.clicks || 0);
        byAdunit[adunit].adRequests += parseInt(item.ad_request || 0);
        byAdunit[adunit].responsesServed += parseInt(item.responses_served || 0);
    });
    
    processedData = {
        byDate,
        bySite,
        byAdunit,
        totalRevenue: Object.values(byDate).reduce((sum, item) => sum + item.revenue, 0),
        totalImpressions: Object.values(byDate).reduce((sum, item) => sum + item.impressions, 0),
        totalClicks: Object.values(byDate).reduce((sum, item) => sum + item.clicks, 0)
    };
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

// 更新报告部分
function updateReportSections() {
    updateExecutiveSummary();
    updateTrendCharts();
    updateSiteAnalysis();
    updateAdunitAnalysis();
}

// 更新执行摘要
function updateExecutiveSummary() {
    const { totalRevenue, totalImpressions, totalClicks } = processedData;
    const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions * 100) : 0;
    
    document.getElementById('summaryRevenue').textContent = `$${totalRevenue.toFixed(2)}`;
    document.getElementById('summaryImpressions').textContent = totalImpressions.toLocaleString();
    document.getElementById('summaryClicks').textContent = totalClicks.toLocaleString();
    document.getElementById('summaryCTR').textContent = `${avgCTR.toFixed(2)}%`;
    
    updateChangeIndicators();
}

// 更新变化指标
function updateChangeIndicators() {
    const dates = Object.keys(processedData.byDate).sort();
    if (dates.length >= 2) {
        const latest = processedData.byDate[dates[dates.length - 1]];
        const previous = processedData.byDate[dates[dates.length - 2]];
        
        const revenueChange = ((latest.revenue - previous.revenue) / previous.revenue * 100).toFixed(1);
        const impressionsChange = ((latest.impressions - previous.impressions) / previous.impressions * 100).toFixed(1);
        const clicksChange = ((latest.clicks - previous.clicks) / previous.clicks * 100).toFixed(1);
        
        const latestCTR = latest.impressions > 0 ? (latest.clicks / latest.impressions * 100) : 0;
        const previousCTR = previous.impressions > 0 ? (previous.clicks / previous.impressions * 100) : 0;
        const ctrChange = (latestCTR - previousCTR).toFixed(2);
        
        updateChangeElement('revenueChange', revenueChange);
        updateChangeElement('impressionsChange', impressionsChange);
        updateChangeElement('clicksChange', clicksChange);
        updateChangeElement('ctrChange', ctrChange, '%');
    }
}

// 更新变化元素
function updateChangeElement(elementId, value, suffix = '%') {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const numValue = parseFloat(value);
    
    if (numValue > 0) {
        element.textContent = `+${value}${suffix}`;
        element.className = 'summary-change positive';
    } else if (numValue < 0) {
        element.textContent = `${value}${suffix}`;
        element.className = 'summary-change negative';
    } else {
        element.textContent = `${value}${suffix}`;
        element.className = 'summary-change neutral';
    }
}

// 更新趋势图表
function updateTrendCharts() {
    updateDetailedRevenueChart();
    updateImpressionClickChart();
}

// 更新详细收入图表
function updateDetailedRevenueChart() {
    const ctx = document.getElementById('detailedRevenueChart');
    if (!ctx) return;
    
    const dates = Object.keys(processedData.byDate).sort();
    const revenues = dates.map(date => processedData.byDate[date].revenue);
    
    if (detailedRevenueChart) {
        detailedRevenueChart.destroy();
    }
    
    detailedRevenueChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dates,
            datasets: [{
                label: '日收入 ($)',
                data: revenues,
                backgroundColor: 'rgba(102, 126, 234, 0.8)',
                borderColor: 'rgb(102, 126, 234)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
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

// 更新展示与点击图表
function updateImpressionClickChart() {
    const ctx = document.getElementById('impressionClickChart');
    if (!ctx) return;
    
    const dates = Object.keys(processedData.byDate).sort();
    const impressions = dates.map(date => processedData.byDate[date].impressions);
    const clicks = dates.map(date => processedData.byDate[date].clicks);
    
    if (impressionClickChart) {
        impressionClickChart.destroy();
    }
    
    impressionClickChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: '展示数',
                data: impressions,
                borderColor: 'rgb(54, 162, 235)',
                backgroundColor: 'rgba(54, 162, 235, 0.1)',
                yAxisID: 'y'
            }, {
                label: '点击数',
                data: clicks,
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.1)',
                yAxisID: 'y1'
            }]
        },
        options: {
            responsive: true,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: {
                        drawOnChartArea: false,
                    },
                }
            }
        }
    });
}

// 更新站点分析
function updateSiteAnalysis() {
    updateSiteRevenueChart();
    updateSiteTable();
}

// 更新站点收入图表
function updateSiteRevenueChart() {
    const ctx = document.getElementById('siteRevenueChart');
    if (!ctx) return;
    
    const sites = Object.keys(processedData.bySite);
    const revenues = sites.map(site => processedData.bySite[site].revenue);
    
    if (siteRevenueChart) {
        siteRevenueChart.destroy();
    }
    
    siteRevenueChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: sites,
            datasets: [{
                data: revenues,
                backgroundColor: [
                    'rgba(102, 126, 234, 0.8)',
                    'rgba(118, 75, 162, 0.8)',
                    'rgba(255, 99, 132, 0.8)',
                    'rgba(54, 162, 235, 0.8)',
                    'rgba(255, 205, 86, 0.8)'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// 更新站点表格
function updateSiteTable() {
    const tbody = document.getElementById('siteTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    Object.entries(processedData.bySite).forEach(([site, data]) => {
        const ctr = data.impressions > 0 ? (data.clicks / data.impressions * 100) : 0;
        const ecpm = data.impressions > 0 ? (data.revenue / data.impressions * 1000) : 0;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${site}</td>
            <td>$${data.revenue.toFixed(4)}</td>
            <td>${data.impressions.toLocaleString()}</td>
            <td>${data.clicks.toLocaleString()}</td>
            <td>${ctr.toFixed(2)}%</td>
            <td>$${ecpm.toFixed(4)}</td>
        `;
        tbody.appendChild(row);
    });
}

// 更新广告位分析
function updateAdunitAnalysis() {
    updateAdunitRevenueChart();
    updateAdunitMetrics();
}

// 更新广告位收入图表
function updateAdunitRevenueChart() {
    const ctx = document.getElementById('adunitRevenueChart');
    if (!ctx) return;
    
    const adunits = Object.keys(processedData.byAdunit);
    const revenues = adunits.map(adunit => processedData.byAdunit[adunit].revenue);
    
    if (adunitRevenueChart) {
        adunitRevenueChart.destroy();
    }
    
    adunitRevenueChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: adunits,
            datasets: [{
                label: '收入 ($)',
                data: revenues,
                backgroundColor: 'rgba(102, 126, 234, 0.8)',
                borderColor: 'rgb(102, 126, 234)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
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

// 更新广告位指标
function updateAdunitMetrics() {
    const container = document.getElementById('adunitMetrics');
    if (!container) return;
    
    container.innerHTML = '';
    
    Object.entries(processedData.byAdunit).forEach(([adunit, data]) => {
        const ctr = data.impressions > 0 ? (data.clicks / data.impressions * 100) : 0;
        const matchRate = data.adRequests > 0 ? (data.responsesServed / data.adRequests * 100) : 0;
        
        const metricItem = document.createElement('div');
        metricItem.className = 'metric-item';
        metricItem.innerHTML = `
            <h4>${adunit}</h4>
            <div class="metric-value">$${data.revenue.toFixed(4)}</div>
            <div style="font-size: 0.8rem; color: #666; margin-top: 5px;">
                CTR: ${ctr.toFixed(2)}% | 匹配率: ${matchRate.toFixed(2)}%
            </div>
        `;
        container.appendChild(metricItem);
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