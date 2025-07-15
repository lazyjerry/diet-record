import { token } from './auth.js'
import { openEditModal } from './logs-form.js'

// 如果需要匯入 updatePaginationButtons 本身，略過（此為定義內部函式）

// 全域變數：目前頁碼
export let currentPage = 1

const body = document.getElementById('logsBody')


/**
 * 載入飲食紀錄資料（支援搜尋與分頁）
 * @param {object} options 
 * @param {string} options.start - 起始日期 (YYYY-MM-DD)
 * @param {string} options.end - 結束日期 (YYYY-MM-DD)
 * @param {string} options.keyword - 關鍵字（描述／時段）
 * @param {number} options.page - 頁碼，預設 1
 */
export async function loadLogs({ start = '', end = '', keyword = '', page = 1 } = {}) {
  const url = new URL('/api/logs', location.origin)
  if (start) url.searchParams.set('start', start)
  if (end) url.searchParams.set('end', end)
  if (keyword) url.searchParams.set('keyword', keyword)
  url.searchParams.set('page', page)

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  })

  const data = await res.json()
  const logs = data.results || data // 支援未啟用分頁時的兼容
  const rowsHtml = logs.map(renderLogRow).join('')
  const summaryRow = renderSummaryRow(logs)
  body.innerHTML = rowsHtml + summaryRow

  console.log('載入飲食紀錄:', data)

  // 儲存目前頁碼至全域變數，並更新頁碼顯示
  currentPage = page
  const indicator = document.getElementById('pageIndicator')
  indicator.textContent = data.targetDate || '';

  if ('currentPage' in data && 'hasNextPage' in data) {
    updatePaginationButtons(data.currentPage, data.hasNextPage)
  }
}

/**
 * 產生統計總和列
 * @param {Array} logs - 飲食紀錄列表
 * @returns {string} - HTML 字串
 */
function renderSummaryRow(logs) {
  if (!logs.length) return ''

  const summary = {
    grains: 0,
    protein: 0,
    vegetables: 0,
    fruits: 0,
    dairy: 0,
    fats: 0,
    calories: 0,
    proteins: 0,
    carbs: 0,
    fats_total: 0
  }

  for (const log of logs) {
    for (const key in summary) {
      summary[key] += Number(log[key]) || 0
    }
  }

  const count = logs.length
  const avg = Object.fromEntries(
    Object.entries(summary).map(([key, val]) => [key, val / count])
  )

  return `
    <tr class="table-warning fw-bold">
      <td>總計</td>
      <td></td>
      <td>${summary.grains.toFixed(1)}</td>
      <td>${summary.protein.toFixed(1)}</td>
      <td>${summary.vegetables.toFixed(1)}</td>
      <td>${summary.fruits.toFixed(1)}</td>
      <td>${summary.dairy.toFixed(1)}</td>
      <td>${summary.fats.toFixed(1)}</td>
      <td>${Math.round(summary.calories)}</td>
      <td>${Math.round(summary.proteins)}</td>
      <td>${Math.round(summary.carbs)}</td>
      <td>${Math.round(summary.fats_total)}</td>
      <td></td>
    </tr>
    <tr class="table-active">
      <td>平均</td>
      <td>共 ${count} 筆</td>
      <td>${avg.grains.toFixed(1)}</td>
      <td>${avg.protein.toFixed(1)}</td>
      <td>${avg.vegetables.toFixed(1)}</td>
      <td>${avg.fruits.toFixed(1)}</td>
      <td>${avg.dairy.toFixed(1)}</td>
      <td>${avg.fats.toFixed(1)}</td>
      <td>${Math.round(avg.calories)}</td>
      <td>${Math.round(avg.proteins)}</td>
      <td>${Math.round(avg.carbs)}</td>
      <td>${Math.round(avg.fats_total)}</td>
      <td></td>
    </tr>
  `
}

/**
 * 產生單筆資料 HTML
 * @param {object} log 
 * @returns {string}
 */
function renderLogRow(log) {
  return `
    <tr data-id="${log.id}" data-log='${encodeURIComponent(JSON.stringify(log))}'>
      <td>${log.log_time || ''}</td>
      <td>${log.description || ''}</td>
      <td class="number">${log.grains}</td>
      <td class="number">${log.protein}</td>
      <td class="number">${log.vegetables}</td>
      <td class="number">${log.fruits}</td>
      <td class="number">${log.dairy}</td>
      <td class="number">${log.fats}</td>
      <td class="number">${Math.round(log.calories)}</td>
      <td class="number">${Math.round(log.proteins)}</td>
      <td class="number">${Math.round(log.carbs)}</td>
      <td class="number">${Math.round(log.fats_total)}</td>
      <td>
        <button class="btn btn-sm btn-outline-secondary btn-edit">編輯</button>
        <button class="btn btn-sm btn-outline-danger btn-delete">刪除</button>
      </td>
    </tr>
  `
}

/**
 * 綁定表格按鈕操作（編輯／刪除）
 */
export function bindLogTableActions() {
  body.addEventListener('click', async (e) => {
    const row = e.target.closest('tr')
    const id = row?.dataset.id
    if (!id) return

    if (e.target.classList.contains('btn-delete')) {
      if (confirm('確定要刪除這筆紀錄？')) {
        const res = await fetch(`/api/logs/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) row.remove()
        else alert('刪除失敗')
      }
    }

    if (e.target.classList.contains('btn-edit')) {
      try {
        const logData = JSON.parse(decodeURIComponent(row.dataset.log))
        openEditModal(logData)
      } catch (e) {
        alert('資料解析失敗')
      }
    }
  })
}

/**
 * 綁定搜尋表單（需搭配 #searchForm 與欄位）
 */
export function bindSearchForm() {
  const form = document.getElementById('searchForm')
  if (!form) return

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const start = document.getElementById('searchStart')?.value || ''
    const end = document.getElementById('searchEnd')?.value || ''
    const keyword = document.getElementById('searchKeyword')?.value || ''
    await loadLogs({ start, end, keyword, page: 1 })
  })
}
/**
 * 綁定分頁按鈕
 */
export function bindPaginationControls() {
  const prevBtn = document.getElementById('prevPageBtn')
  const nextBtn = document.getElementById('nextPageBtn')
  if (!prevBtn || !nextBtn) return

  prevBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      loadLogs({ page: currentPage - 1 })
    }
  })

  nextBtn.addEventListener('click', () => {
    loadLogs({ page: currentPage + 1 })
  })
}

/**
 * 根據目前分頁狀態，更新上下頁按鈕
 * @param {number} currentPage
 * @param {boolean} hasNextPage
 */
export function updatePaginationButtons(currentPage, hasNextPage) {
  const prevBtn = document.getElementById('prevPageBtn')
  const nextBtn = document.getElementById('nextPageBtn')
  if (!prevBtn || !nextBtn) return

  prevBtn.disabled = currentPage <= 1
  nextBtn.disabled = !hasNextPage
  if( prevBtn.disabled ) {
    prevBtn.classList.add('disabled')
  }else{
    prevBtn.classList.remove('disabled')
  }
  if( nextBtn.disabled ) {
    nextBtn.classList.add('disabled')
  }else{
    nextBtn.classList.remove('disabled')
  }
}