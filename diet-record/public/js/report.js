const token = localStorage.getItem('token')
if (!token) location.href = '/login.html'

let summaryChart, categoryChart, macroChart, comparisonChart
let categoryLineChart

function destroyCharts() {
  summaryChart?.destroy()
  categoryChart?.destroy()
  macroChart?.destroy()
  comparisonChart?.destroy()
  categoryLineChart?.destroy()
}

async function loadStats(range = 'today', start = '', end = '') {
  const url = new URL('/api/stats', location.origin)
  url.searchParams.set('range', range)
  if (start) url.searchParams.set('start', start)
  if (end) url.searchParams.set('end', end)

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  })

  const data = await res.json()
  // 檢查是否有資料
  if (!data || data.length === 0) {
    const msg = document.createElement('div')
    msg.className = 'alert alert-warning position-fixed top-0 start-50 translate-middle-x mt-3 shadow'
    msg.style.zIndex = '9999'
    msg.style.minWidth = '300px'
    msg.innerHTML = '⚠️ 沒有符合條件的紀錄資料'
    document.body.appendChild(msg)
    setTimeout(() => msg.remove(), 3000)
    destroyCharts()
    return
  }
  const isTimeDetailed = range === 'today' || range === 'yesterday'
  const labels = data.map(d => isTimeDetailed ? `${d.log_date} ${d.log_time || ''}` : d.log_date)

  destroyCharts()

  // 1. 總量圖表
  const summaryCtx = document.getElementById('summaryChart').getContext('2d')
  summaryChart = new Chart(summaryCtx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: '熱量 (千卡)',
          data: data.map(d => d.calories),
          borderColor: '#dc3545',
          tension: 0.3
        },
        {
          label: '碳水 (克)',
          data: data.map(d => d.carbs),
          borderColor: '#0d6efd',
          tension: 0.3
        },
        {
          label: '蛋白質 (克)',
          data: data.map(d => d.proteins),
          borderColor: '#198754',
          tension: 0.3
        },
        {
          label: '脂肪 (克)',
          data: data.map(d => d.fats_total),
          borderColor: '#fd7e14',
          tension: 0.3
        }
      ]
    },
    options: {
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      plugins: { legend: { position: 'bottom' }, tooltip: { mode: 'nearest' } },
      scales: {
        y: { beginAtZero: true, title: { display: true, text: '克 / 千卡' } },
        x: { title: { display: true, text: '日期' } }
      }
    }
  })

  // 2. 六大類別攝取 (Pie Chart)
  const totalDays = data.length || 1
  const total = (key) => data.reduce((sum, d) => sum + (d[key] || 0), 0) / totalDays

  const catCtx = document.getElementById('categoryChart').getContext('2d')
  categoryChart = new Chart(catCtx, {
    type: 'pie',
    data: {
      labels: ['全穀（份）', '豆魚蛋肉（份）', '蔬菜（份）', '水果（份）', '乳品（份）', '油脂（份）'],
      datasets: [{
        data: [
          total('grains'),
          total('protein'),
          total('vegetables'),
          total('fruits'),
          total('dairy'),
          total('fats')
        ],
        backgroundColor: ['#795548', '#9c27b0', '#4caf50', '#ff9800', '#03a9f4', '#607d8b']
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.label}: ${ctx.raw.toFixed(1)} 份`
          }
        }
      }
    }
  })

  // 2.5 六大營養素折線圖
  const line2Canvas = document.getElementById('lineCategoryChart')
  if (line2Canvas) {
    const line2Ctx = line2Canvas.getContext('2d')
    categoryLineChart = new Chart(line2Ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: '全穀（份）', data: data.map(d => d.grains), borderColor: '#795548', tension: 0.3 },
          { label: '豆魚蛋肉（份）', data: data.map(d => d.protein), borderColor: '#9c27b0', tension: 0.3 },
          { label: '蔬菜（份）', data: data.map(d => d.vegetables), borderColor: '#4caf50', tension: 0.3 },
          { label: '水果（份）', data: data.map(d => d.fruits), borderColor: '#ff9800', tension: 0.3 },
          { label: '乳品（份）', data: data.map(d => d.dairy), borderColor: '#03a9f4', tension: 0.3 },
          { label: '油脂（份）', data: data.map(d => d.fats), borderColor: '#607d8b', tension: 0.3 }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' },
          tooltip: { mode: 'nearest' }
        },
        scales: {
          y: { beginAtZero: true, title: { display: true, text: '份' } },
          x: { title: { display: true, text: '日期' } }
        }
      }
    })
  }

  // 3. 營養比例（每日平均）
  const macroCtx = document.getElementById('macroChart').getContext('2d')
  macroChart = new Chart(macroCtx, {
    type: 'doughnut',
    data: {
      labels: ['碳水化合物', '蛋白質', '脂肪'],
      datasets: [{
        data: [total('carbs'), total('proteins'), total('fats_total')],
        backgroundColor: ['#0d6efd', '#198754', '#fd7e14']
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' },
        tooltip: { callbacks: {
          label: (ctx) => `${ctx.label}: ${ctx.raw.toFixed(1)} g`
        }}
      }
    }
  })

  // 4. 比較區間（只有 2 筆以上資料才畫）
  const compContainer = document.getElementById('comparisonChart')?.closest('.col-md-12')
  if (compContainer) {
    compContainer.style.display = isTimeDetailed ? 'none' : ''
  }
  if (data.length >= 2 && !isTimeDetailed) {
    const first = data[0]
    const last = data[data.length - 1]
    const compCtx = document.getElementById('comparisonChart').getContext('2d')
    comparisonChart = new Chart(compCtx, {
      type: 'bar',
      data: {
        labels: ['熱量', '碳水', '蛋白質', '脂肪'],
        datasets: [
          {
            label: first.log_date,
            data: [first.calories, first.carbs, first.proteins, first.fats_total],
            backgroundColor: '#adb5bd'
          },
          {
            label: last.log_date,
            data: [last.calories, last.carbs, last.proteins, last.fats_total],
            backgroundColor: '#0d6efd'
          }
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'bottom' } },
        scales: { y: { beginAtZero: true } }
      }
    })
  }

  // 5. 統計表格內容
  const statsTable = document.getElementById('statsTable')
  if (statsTable) {
    const nutrients = ['grains', 'protein', 'vegetables', 'fruits', 'dairy', 'fats', 'carbs', 'proteins', 'fats_total', 'calories']
    const names = {
      grains: '全穀',
      protein: '豆魚蛋肉',
      vegetables: '蔬菜',
      fruits: '水果',
      dairy: '乳品',
      fats: '油脂',
      carbs: '碳水化合物',
      proteins: '蛋白質',
      fats_total: '脂肪',
      calories: '熱量'
    }
    const grouped = [
      ['grains', 'protein', 'vegetables', 'fruits', 'dairy', 'fats'],
      ['carbs', 'proteins', 'fats_total', 'calories']
    ]
    const unitMap = {
      grains: '份', protein: '份', vegetables: '份', fruits: '份', dairy: '份', fats: '份',
      carbs: '克', proteins: '克', fats_total: '克', calories: '千卡'
    }

    const [group1Body, group2Body] = statsTable.querySelectorAll('tbody')
    grouped[0].forEach(key => {
      const totalVal = data.reduce((sum, d) => sum + (d[key] || 0), 0)
      const avgVal = totalVal / (data.length || 1)
      group1Body.insertAdjacentHTML('beforeend', `
        <tr>
          <td class="px-3 py-2">${names[key]}</td>
          <td class="px-3 py-2">${totalVal.toFixed(1)}${unitMap[key]}</td>
          <td class="px-3 py-2">${avgVal.toFixed(1)}${unitMap[key]}</td>
        </tr>
      `)
    })
    grouped[1].forEach(key => {
      const totalVal = data.reduce((sum, d) => sum + (d[key] || 0), 0)
      const avgVal = totalVal / (data.length || 1)
      group2Body.insertAdjacentHTML('beforeend', `
        <tr>
          <td class="px-3 py-2">${names[key]}</td>
          <td class="px-3 py-2">${totalVal.toFixed(1)} ${unitMap[key]}</td>
          <td class="px-3 py-2">${avgVal.toFixed(1)} ${unitMap[key]}</td>
        </tr>
      `)
    })
  }

  // 6. 根據 isTimeDetailed 調整圖表排版
  const chartCols = document.querySelectorAll('.row.g-4 > div[class*="col-"]')
  chartCols.forEach((col, idx) => {
    col.classList.remove('col-md-4', 'col-md-6', 'd-none')
    if (isTimeDetailed) {
      // 僅顯示前 3 張圖，並排顯示
      if (idx < 3) col.classList.add('col-md-4')
      else col.classList.add('d-none')
    } else {
      col.classList.add('col-md-6')
    }
  })
}

// UI 控制邏輯
const rangeSelector = document.getElementById('rangeSelector')
const customRange = document.getElementById('customDateRange')
const applyBtn = document.getElementById('applyBtn')

rangeSelector?.addEventListener('change', () => {
  const val = rangeSelector.value
  if (val === 'custom') {
    customRange.classList.remove('d-none')
  } else {
    customRange.classList.add('d-none')
    loadStats(val)
  }
})

applyBtn?.addEventListener('click', () => {
  const start = document.getElementById('startDate')?.value || ''
  const end = document.getElementById('endDate')?.value || ''
  loadStats('custom', start, end)
})

loadStats()