// 全局变量
let reportData = [];
let processedData = {};

// 图表对象
let detailedRevenueChart = null;
let impressionClickChart = null;
let siteRevenueChart = null;
let adunitRevenueChart = null;

// DOM元素
const loadingSpinner = document.getElementById('loadingSpinner');
const detailedSearchInput = document.getElementById('detailedSearchInput');
const sortSelect = document.getElementById('sortSelect');
const printBtn = document.getElementById('printBtn');
const downloadReport = document.getElementById('downloadReport');

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    initEventListeners();
    loadReportData();
});

// 事件监听器
function initEventListeners() {
    detailedSearchInput.addEventListener('input', debounce(filterDetailedTable, 300));
    sortSelect.addEventListener('change', sortDetailedTable);
    printBtn.addEventListener('click', printReport);
    downloadReport.addEventListener('click', generatePDFReport);
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

// 加载报告数据
async function loadReportData() {
    showLoading();
    
    try {
        const response = await fetch('../public/data/latest.json');
        if (!response.ok) {
            throw new Error('无法加载数据文件');
        }
        
        const data = await response.json();
        reportData = data;
        
        // 处理数据
        processReportData();
        
        // 更新界面
        updateReportMeta();
        updateExecutiveSummary();
        updateTrendCharts();
        updateSiteAnalysis();
        updateAdunitAnalysis();
        updateDetailedTable();
        
    } catch (error) {
        console.error('加载数据失败:', error);
        // 使用示例数据
        loadSampleReportData();
    } finally {
        hideLoading();
    }
}

// 加载示例数据
function loadSampleReportData() {
    reportData = generateSampleReportData();
    processReportData();
    updateReportMeta();
    updateExecutiveSummary();
    updateTrendCharts();
    updateSiteAnalysis();
    updateAdunitAnalysis();
    updateDetailedTable();
}

// 生成示例报告数据
function generateSampleReportData() {
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
    // 按日期分组
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

// 更新报告元数据
function updateReportMeta() {
    const dates = Object.keys(processedData.byDate).sort();
    const dateRange = dates.length > 1 ? 
        `${dates[0]} 至 ${dates[dates.length - 1]}` : 
        dates[0] || '--';
    
    const now = new Date();
    const generateTime = now.toLocaleString('zh-CN');
    
    document.getElementById('reportDate').textContent = dateRange;
    document.getElementById('generateTime').textContent = generateTime;
    document.getElementById('totalRecords').textContent = reportData.length.toLocaleString();
    document.getElementById('footerTime').textContent = generateTime;
}

// 更新执行摘要
function updateExecutiveSummary() {
    const { totalRevenue, totalImpressions, totalClicks } = processedData;
    const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions * 100) : 0;
    
    document.getElementById('summaryRevenue').textContent = `$${totalRevenue.toFixed(2)}`;
    document.getElementById('summaryImpressions').textContent = totalImpressions.toLocaleString();
    document.getElementById('summaryClicks').textContent = totalClicks.toLocaleString();
    document.getElementById('summaryCTR').textContent = `${avgCTR.toFixed(2)}%`;
    
    // 计算变化趋势（简化版本，这里显示为示例）
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
    const ctx = document.getElementById('detailedRevenueChart').getContext('2d');
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
    const ctx = document.getElementById('impressionClickChart').getContext('2d');
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
    const ctx = document.getElementById('siteRevenueChart').getContext('2d');
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
    const ctx = document.getElementById('adunitRevenueChart').getContext('2d');
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

// 更新详细表格
function updateDetailedTable() {
    const tbody = document.getElementById('detailedTableBody');
    tbody.innerHTML = '';
    
    reportData.forEach(item => {
        const clicks = parseInt(item.clicks || 0);
        const impressions = parseInt(item.impressions || 0);
        const ctr = impressions > 0 ? (clicks / impressions * 100) : 0;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.date}</td>
            <td>${item.site}</td>
            <td>${item.adunit}</td>
            <td>${parseInt(item.ad_request || 0).toLocaleString()}</td>
            <td>${parseInt(item.responses_served || 0).toLocaleString()}</td>
            <td>${impressions.toLocaleString()}</td>
            <td>${clicks.toLocaleString()}</td>
            <td>$${parseFloat(item.revenue || 0).toFixed(4)}</td>
            <td>$${parseFloat(item.ecpm || 0).toFixed(4)}</td>
            <td>${ctr.toFixed(2)}%</td>
            <td>${parseFloat(item.match_rate || 0).toFixed(2)}%</td>
        `;
        tbody.appendChild(row);
    });
}

// 筛选详细表格
function filterDetailedTable() {
    const searchTerm = detailedSearchInput.value.toLowerCase();
    const rows = document.querySelectorAll('#detailedTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// 排序详细表格
function sortDetailedTable() {
    const sortBy = sortSelect.value;
    const tbody = document.getElementById('detailedTableBody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    rows.sort((a, b) => {
        let aVal, bVal;
        
        switch (sortBy) {
            case 'date':
                aVal = a.cells[0].textContent;
                bVal = b.cells[0].textContent;
                return new Date(bVal) - new Date(aVal);
            case 'revenue':
                aVal = parseFloat(a.cells[7].textContent.replace('$', ''));
                bVal = parseFloat(b.cells[7].textContent.replace('$', ''));
                return bVal - aVal;
            case 'impressions':
                aVal = parseInt(a.cells[5].textContent.replace(/,/g, ''));
                bVal = parseInt(b.cells[5].textContent.replace(/,/g, ''));
                return bVal - aVal;
            case 'clicks':
                aVal = parseInt(a.cells[6].textContent.replace(/,/g, ''));
                bVal = parseInt(b.cells[6].textContent.replace(/,/g, ''));
                return bVal - aVal;
            default:
                return 0;
        }
    });
    
    // 重新排列行
    rows.forEach(row => tbody.appendChild(row));
}

// 打印报告
function printReport() {
    window.print();
}

// 生成PDF报告
function generatePDFReport() {
    // 这里可以集成jsPDF来生成PDF
    // 现在暂时使用简单的打印功能
    alert('PDF生成功能正在开发中，请使用打印功能生成PDF。');
}