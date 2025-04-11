// DOM元素
const balanceEl = document.getElementById('balance');
const incomeTotal = document.getElementById('income-total');
const expenseTotal = document.getElementById('expense-total');
const expensePercentage = document.getElementById('expense-percentage');
const xianyuOrderCount = document.getElementById('xianyu-order-count');
const transactionForm = document.getElementById('transaction-form');
const descriptionInput = document.getElementById('description');
const amountInput = document.getElementById('amount');
const typeInput = document.getElementById('type');
const categoryInput = document.getElementById('category');
const expenseCategoryInput = document.getElementById('expense-category');
const dateInput = document.getElementById('date');
const orderIdInput = document.getElementById('order-id');
const notesInput = document.getElementById('notes');
const transactionList = document.getElementById('transaction-list');
const searchInput = document.getElementById('search');
const filterCategory = document.getElementById('filter-category');
const filterType = document.getElementById('filter-type');
const expenseChart = document.getElementById('expense-chart');
const incomeChart = document.getElementById('income-chart');
const trendChart = document.getElementById('trend-chart');
const totalOrdersEl = document.getElementById('total-orders');
const avgOrderAmountEl = document.getElementById('avg-order-amount');
const profitMarginEl = document.getElementById('profit-margin');
const bestDayEl = document.getElementById('best-day');
const exportDataBtn = document.getElementById('export-data');
const clearDataBtn = document.getElementById('clear-data');
const incomeCategoriesDiv = document.getElementById('income-categories');
const expenseCategoriesDiv = document.getElementById('expense-categories');
const prevPageBtn = document.getElementById('prev-page');
const nextPageBtn = document.getElementById('next-page');
const pageInfoEl = document.getElementById('page-info');
const periodBtns = document.querySelectorAll('.period-btn');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const chartTabs = document.querySelectorAll('.chart-tab');
const chartContents = document.querySelectorAll('.chart-content');

// 分页相关变量
let currentPage = 1;
const itemsPerPage = 10;

// 当前选中的时间段
let currentPeriod = 'month';

// 设置默认日期为今天
dateInput.valueAsDate = new Date();

// 从 localStorage 获取交易数据，如果没有则使用空数组
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];

// 初始化应用
function init() {
  renderTransactionList();
  updateBalance();
  updateCharts();
  updateStatistics();
}

// 显示交易列表（带分页）
function renderTransactionList() {
  transactionList.innerHTML = '';
  
  // 应用过滤器和时间段
  const filteredTransactions = filterTransactions();
  
  // 计算分页
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  if (currentPage > totalPages && totalPages > 0) {
    currentPage = totalPages;
  }
  
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredTransactions.length);
  
  // 更新分页信息
  pageInfoEl.textContent = `第 ${currentPage} 页 / 共 ${totalPages || 1} 页`;
  
  // 更新分页按钮状态
  prevPageBtn.disabled = currentPage === 1;
  nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;
  
  // 显示当前页的交易
  const currentPageTransactions = filteredTransactions.slice(startIndex, endIndex);
  currentPageTransactions.forEach(addTransactionDOM);
}

// 过滤交易数据
function filterTransactions() {
  const searchText = searchInput.value.toLowerCase();
  const categoryFilter = filterCategory.value;
  const typeFilter = filterType.value;
  
  // 先根据时间段过滤
  let filteredByPeriod = filterByPeriod(transactions, currentPeriod);
  
  // 再根据搜索条件过滤
  return filteredByPeriod.filter(transaction => {
    const matchesSearch = 
      transaction.description.toLowerCase().includes(searchText) || 
      (transaction.orderId && transaction.orderId.toLowerCase().includes(searchText)) ||
      (transaction.notes && transaction.notes.toLowerCase().includes(searchText));
    
    const matchesCategory = categoryFilter === 'all' || transaction.category === categoryFilter;
    const matchesType = typeFilter === 'all' || transaction.type === typeFilter;
    
    return matchesSearch && matchesCategory && matchesType;
  });
}

// 根据时间段过滤交易
function filterByPeriod(transactions, period) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (period) {
    case 'week':
      // 获取本周的星期一
      const monday = new Date(today);
      monday.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
      return transactions.filter(t => new Date(t.date) >= monday);
      
    case 'month':
      // 获取本月第一天
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      return transactions.filter(t => new Date(t.date) >= firstDayOfMonth);
      
    case 'year':
      // 获取本年第一天
      const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
      return transactions.filter(t => new Date(t.date) >= firstDayOfYear);
      
    case 'all':
    default:
      return transactions;
  }
}

// 添加交易
function addTransaction(e) {
  e.preventDefault();
  
  // 验证表单
  if (descriptionInput.value.trim() === '' || amountInput.value.trim() === '') {
    alert('请填写描述和金额');
    return;
  }
  
  // 确定使用哪个类别选择器
  const category = typeInput.value === 'income' ? categoryInput.value : expenseCategoryInput.value;
  
  // 创建交易对象
  const transaction = {
    id: generateID(),
    description: descriptionInput.value,
    amount: +amountInput.value,
    type: typeInput.value,
    category: category,
    date: dateInput.value,
    orderId: orderIdInput.value.trim(),
    notes: notesInput.value.trim(),
    timestamp: new Date().toISOString()
  };
  
  // 添加到交易数组
  transactions.push(transaction);
  
  // 更新余额
  updateBalance();
  
  // 更新图表
  updateCharts();
  
  // 更新统计信息
  updateStatistics();
  
  // 保存到 localStorage
  updateLocalStorage();
  
  // 重置表单
  resetForm();
  
  // 更新交易列表显示
  renderTransactionList();
  
  // 切换到交易历史标签页
  switchTab('history');
}

// 生成随机 ID
function generateID() {
  return Math.floor(Math.random() * 1000000000);
}

// 添加交易到 DOM
function addTransactionDOM(transaction) {
  // 确定交易类型
  const isIncome = transaction.type === 'income';
  
  // 创建列表项
  const li = document.createElement('li');
  li.classList.add(transaction.type);
  
  // 格式化金额
  const formattedAmount = formatCurrency(transaction.amount);
  
  // 格式化日期
  const formattedDate = new Date(transaction.date).toLocaleDateString('zh-CN');
  
  // 获取分类名称
  const categoryName = getCategoryName(transaction.category);
  
  // 设置HTML
  li.innerHTML = `
    <div class="transaction-details">
      <div class="transaction-description">${transaction.description}</div>
      <div class="transaction-meta">
        <span class="transaction-category">${categoryName}</span>
        <span class="transaction-date"><i class="fas fa-calendar-alt"></i> ${formattedDate}</span>
        ${transaction.orderId ? `<span class="transaction-order-id"><i class="fas fa-tag"></i> ${transaction.orderId}</span>` : ''}
      </div>
      ${transaction.notes ? `<div class="transaction-notes"><small>${transaction.notes}</small></div>` : ''}
    </div>
    <span class="transaction-amount ${isIncome ? 'income-amount' : 'expense-amount'}">${formattedAmount}</span>
    <button class="delete-btn" onclick="removeTransaction(${transaction.id})"><i class="fas fa-times"></i></button>
  `;
  
  // 添加到列表
  transactionList.appendChild(li);
}

// 根据类别值获取类别名称
function getCategoryName(category) {
  const categories = {
    // 收入类别
    'xianyu': '咸鱼订单',
    'wechat': '微信接单',
    'offline': '线下服务',
    'platform': '其他平台',
    'other-income': '其他收入',
    
    // 支出类别
    'materials': '材料成本',
    'tools': '工具支出',
    'platform-fee': '平台费用',
    'shipping': '运输费用',
    'marketing': '推广费用',
    'other-expense': '其他支出'
  };
  
  return categories[category] || category;
}

// 更新余额、收入和支出
function updateBalance() {
  // 根据当前时间段筛选交易
  const filteredTransactions = filterByPeriod(transactions, currentPeriod);
  
  // 计算收入
  const income = filteredTransactions
    .filter(transaction => transaction.type === 'income')
    .reduce((acc, transaction) => acc + transaction.amount, 0);
  
  // 计算支出
  const expense = filteredTransactions
    .filter(transaction => transaction.type === 'expense')
    .reduce((acc, transaction) => acc + transaction.amount, 0);
  
  // 计算余额
  const balance = income - expense;
  
  // 计算支出占收入比例
  const expenseRatio = income > 0 ? (expense / income * 100).toFixed(1) : 0;
  
  // 计算咸鱼订单数量
  const xianyuOrders = filteredTransactions
    .filter(transaction => transaction.type === 'income' && transaction.category === 'xianyu')
    .length;
  
  // 更新 DOM
  balanceEl.textContent = formatCurrency(balance);
  incomeTotal.textContent = formatCurrency(income);
  expenseTotal.textContent = formatCurrency(expense);
  expensePercentage.textContent = `${expenseRatio}%`;
  xianyuOrderCount.textContent = xianyuOrders;
}

// 更新统计数据
function updateStatistics() {
  // 获取所有收入交易
  const incomeTransactions = transactions.filter(t => t.type === 'income');
  
  // 获取所有咸鱼订单
  const xianyuTransactions = incomeTransactions.filter(t => t.category === 'xianyu');
  
  // 计算总订单数
  const totalOrders = xianyuTransactions.length;
  
  // 计算平均订单金额
  const totalOrderAmount = xianyuTransactions.reduce((sum, t) => sum + t.amount, 0);
  const avgOrderAmount = totalOrders > 0 ? totalOrderAmount / totalOrders : 0;
  
  // 计算总收入和总支出
  const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  // 计算利润率
  const profit = totalIncome - totalExpense;
  const profitMargin = totalIncome > 0 ? (profit / totalIncome * 100).toFixed(1) : 0;
  
  // 找出收入最高的一天
  const incomeByDate = {};
  incomeTransactions.forEach(t => {
    if (!incomeByDate[t.date]) {
      incomeByDate[t.date] = 0;
    }
    incomeByDate[t.date] += t.amount;
  });
  
  let bestDay = { date: null, amount: 0 };
  Object.entries(incomeByDate).forEach(([date, amount]) => {
    if (amount > bestDay.amount) {
      bestDay = { date, amount };
    }
  });
  
  // 更新DOM
  totalOrdersEl.textContent = totalOrders;
  avgOrderAmountEl.textContent = formatCurrency(avgOrderAmount);
  profitMarginEl.textContent = `${profitMargin}%`;
  bestDayEl.textContent = bestDay.date ? 
    `${new Date(bestDay.date).toLocaleDateString('zh-CN')} (${formatCurrency(bestDay.amount)})` : 
    '无数据';
}

// 格式化货币
function formatCurrency(amount) {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY'
  }).format(amount);
}

// 移除交易
function removeTransaction(id) {
  if (confirm('确定要删除这笔交易吗？')) {
    transactions = transactions.filter(transaction => transaction.id !== id);
    
    updateLocalStorage();
    init();
  }
}

// 更新 localStorage
function updateLocalStorage() {
  localStorage.setItem('transactions', JSON.stringify(transactions));
}

// 重置表单
function resetForm() {
  transactionForm.reset();
  dateInput.valueAsDate = new Date();
  notesInput.value = '';
  typeInput.value = 'income';
  updateCategoryVisibility();
}

// 更新类别选择器可见性
function updateCategoryVisibility() {
  if (typeInput.value === 'income') {
    incomeCategoriesDiv.classList.remove('hidden');
    expenseCategoriesDiv.classList.add('hidden');
  } else {
    incomeCategoriesDiv.classList.add('hidden');
    expenseCategoriesDiv.classList.remove('hidden');
  }
}

// 更新所有图表
function updateCharts() {
  updateExpenseChart();
  updateIncomeChart();
  updateTrendChart();
}

// 更新支出图表
function updateExpenseChart() {
  // 获取支出数据
  const expensesByCategory = {};
  
  transactions
    .filter(transaction => transaction.type === 'expense')
    .forEach(transaction => {
      if (expensesByCategory[transaction.category]) {
        expensesByCategory[transaction.category] += transaction.amount;
      } else {
        expensesByCategory[transaction.category] = transaction.amount;
      }
    });
  
  // 准备图表数据
  const categories = Object.keys(expensesByCategory).map(key => getCategoryName(key));
  const data = Object.values(expensesByCategory);
  
  // 设置颜色
  const colors = [
    '#ef4444',
    '#0ea5e9',
    '#10b981',
    '#f59e0b',
    '#8b5cf6',
    '#64748b'
  ];
  
  // 检查是否已有图表实例
  if (window.expenseChartInstance) {
    window.expenseChartInstance.destroy();
  }
  
  // 创建图表
  if (categories.length > 0) {
    window.expenseChartInstance = new Chart(expenseChart, {
      type: 'doughnut',
      data: {
        labels: categories,
        datasets: [{
          data: data,
          backgroundColor: colors,
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right'
          },
          title: {
            display: true,
            text: '支出分布'
          }
        }
      }
    });
  } else {
    // 如果没有数据，显示一个空图表
    window.expenseChartInstance = new Chart(expenseChart, {
      type: 'doughnut',
      data: {
        labels: ['暂无数据'],
        datasets: [{
          data: [1],
          backgroundColor: ['#e2e8f0'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right'
          }
        }
      }
    });
  }
}

// 更新收入图表
function updateIncomeChart() {
  // 获取收入数据
  const incomesByCategory = {};
  
  transactions
    .filter(transaction => transaction.type === 'income')
    .forEach(transaction => {
      if (incomesByCategory[transaction.category]) {
        incomesByCategory[transaction.category] += transaction.amount;
      } else {
        incomesByCategory[transaction.category] = transaction.amount;
      }
    });
  
  // 准备图表数据
  const categories = Object.keys(incomesByCategory).map(key => getCategoryName(key));
  const data = Object.values(incomesByCategory);
  
  // 设置颜色
  const colors = [
    '#10b981',
    '#0ea5e9',
    '#8b5cf6',
    '#f59e0b',
    '#64748b'
  ];
  
  // 检查是否已有图表实例
  if (window.incomeChartInstance) {
    window.incomeChartInstance.destroy();
  }
  
  // 创建图表
  if (categories.length > 0) {
    window.incomeChartInstance = new Chart(incomeChart, {
      type: 'pie',
      data: {
        labels: categories,
        datasets: [{
          data: data,
          backgroundColor: colors,
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right'
          },
          title: {
            display: true,
            text: '收入来源'
          }
        }
      }
    });
  } else {
    // 如果没有数据，显示一个空图表
    window.incomeChartInstance = new Chart(incomeChart, {
      type: 'pie',
      data: {
        labels: ['暂无数据'],
        datasets: [{
          data: [1],
          backgroundColor: ['#e2e8f0'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right'
          }
        }
      }
    });
  }
}

// 更新趋势图表
function updateTrendChart() {
  // 获取最近6个月的收入趋势
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);  // 从每月第一天开始
  
  // 准备月份标签和数据数组
  const labels = [];
  const xianyuData = [];
  const otherIncomeData = [];
  
  // 获取最近6个月的标签
  for (let i = 0; i < 6; i++) {
    const date = new Date(sixMonthsAgo);
    date.setMonth(date.getMonth() + i);
    const monthLabel = date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short' });
    labels.push(monthLabel);
    
    // 初始化每个月的数据为0
    xianyuData.push(0);
    otherIncomeData.push(0);
  }
  
  // 填充数据
  transactions
    .filter(t => t.type === 'income' && new Date(t.date) >= sixMonthsAgo)
    .forEach(t => {
      const date = new Date(t.date);
      const monthIndex = date.getMonth() - sixMonthsAgo.getMonth() + 
        (date.getFullYear() - sixMonthsAgo.getFullYear()) * 12;
      
      if (monthIndex >= 0 && monthIndex < 6) {
        if (t.category === 'xianyu') {
          xianyuData[monthIndex] += t.amount;
        } else {
          otherIncomeData[monthIndex] += t.amount;
        }
      }
    });
  
  // 检查是否已有图表实例
  if (window.trendChartInstance) {
    window.trendChartInstance.destroy();
  }
  
  // 创建图表
  window.trendChartInstance = new Chart(trendChart, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: '咸鱼收入',
          data: xianyuData,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.3,
          fill: true,
          borderWidth: 2
        },
        {
          label: '其他收入',
          data: otherIncomeData,
          borderColor: '#0ea5e9',
          backgroundColor: 'rgba(14, 165, 233, 0.1)',
          tension: 0.3,
          fill: true,
          borderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top'
        },
        title: {
          display: true,
          text: '收入趋势'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return '¥' + value;
            }
          }
        }
      }
    }
  });
}

// 导出数据为CSV
function exportTransactionsToCSV() {
  // 定义列头
  const headers = [
    '日期', '描述', '金额', '类型', '类别', '订单号', '备注'
  ];
  
  // 转换数据
  const csvData = transactions.map(t => {
    return [
      t.date,
      t.description,
      t.amount,
      t.type === 'income' ? '收入' : '支出',
      getCategoryName(t.category),
      t.orderId || '',
      t.notes || ''
    ];
  });
  
  // 添加列头
  csvData.unshift(headers);
  
  // 转换为CSV格式
  const csv = csvData.map(row => row.join(',')).join('\n');
  
  // 创建下载链接
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `咸鱼接单记账数据_${new Date().toISOString().slice(0, 10)}.csv`);
  link.style.display = 'none';
  document.body.appendChild(link);
  
  // 触发下载
  link.click();
  
  // 清理
  document.body.removeChild(link);
}

// 清除所有数据
function clearAllData() {
  if (confirm('警告：这将删除所有交易数据！此操作无法撤销。确定要继续吗？')) {
    transactions = [];
    updateLocalStorage();
    init();
  }
}

// 切换标签页
function switchTab(tabId) {
  // 更新标签按钮状态
  tabBtns.forEach(btn => {
    if (btn.dataset.tab === tabId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  
  // 更新内容区域显示
  tabContents.forEach(content => {
    if (content.id === `${tabId}-tab`) {
      content.classList.add('active');
    } else {
      content.classList.remove('active');
    }
  });
  
  // 如果切换到统计页面，更新图表
  if (tabId === 'statistics') {
    updateCharts();
  }
}

// 切换图表
function switchChart(chartId) {
  // 更新图表标签按钮状态
  chartTabs.forEach(tab => {
    if (tab.dataset.chart === chartId) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });
  
  // 更新图表内容区域显示
  chartContents.forEach(content => {
    if (content.id === `${chartId}-chart-content`) {
      content.classList.add('active');
    } else {
      content.classList.remove('active');
    }
  });
}

// 切换时间段
function switchPeriod(period) {
  currentPeriod = period;
  
  // 更新按钮状态
  periodBtns.forEach(btn => {
    if (btn.id === `period-${period}`) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  
  // 更新余额显示
  updateBalance();
}

// 事件监听器
transactionForm.addEventListener('submit', addTransaction);
searchInput.addEventListener('input', renderTransactionList);
filterCategory.addEventListener('change', renderTransactionList);
filterType.addEventListener('change', renderTransactionList);
typeInput.addEventListener('change', updateCategoryVisibility);
exportDataBtn.addEventListener('click', exportTransactionsToCSV);
clearDataBtn.addEventListener('click', clearAllData);
prevPageBtn.addEventListener('click', () => {
  if (currentPage > 1) {
    currentPage--;
    renderTransactionList();
  }
});
nextPageBtn.addEventListener('click', () => {
  const filteredTransactions = filterTransactions();
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  
  if (currentPage < totalPages) {
    currentPage++;
    renderTransactionList();
  }
});

// 标签页切换事件
tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const tabId = btn.dataset.tab;
    switchTab(tabId);
  });
});

// 图表标签切换事件
chartTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const chartId = tab.dataset.chart;
    switchChart(chartId);
  });
});

// 时间段切换事件
periodBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const period = btn.id.replace('period-', '');
    switchPeriod(period);
  });
});

// 全局函数
window.removeTransaction = removeTransaction;

// 初始化状态
updateCategoryVisibility();

// 初始化应用
init(); 