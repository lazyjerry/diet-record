const token = localStorage.getItem('token')
if (!token) location.href = '/login.html'

const ctx = document.getElementById('chart').getContext('2d')
let chart

async function loadStats(range = '7days') {
  const res = await fetch(`/api/stats?range=${range}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  const data = await res.json()

  const labels = data.map(d => d.log_date)
  const calories = data.map(d => d.calories)
  const carbs = data.map(d => d.carbs)
  const proteins = data.map(d => d.proteins)
  const fats = data.map(d => d.fats_total)

  if (chart) chart.destroy()

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: '熱量 (kcal)',
          data: calories,
          borderColor: '#dc3545',
          tension: 0.3
        },
        {
          label: '碳水 (g)',
          data: carbs,
          borderColor: '#0d6efd',
          tension: 0.3
        },
        {
          label: '蛋白質 (g)',
          data: proteins,
          borderColor: '#198754',
          tension: 0.3
        },
        {
          label: '脂肪 (g)',
          data: fats,
          borderColor: '#fd7e14',
          tension: 0.3
        }
      ]
    },
    options: {
      responsive: true,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: { position: 'bottom' },
        tooltip: { mode: 'nearest' }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'g / kcal' }
        },
        x: {
          title: { display: true, text: '日期' }
        }
      }
    }
  })
}

document.getElementById('rangeSelector').addEventListener('change', (e) => {
  loadStats(e.target.value)
})

loadStats()