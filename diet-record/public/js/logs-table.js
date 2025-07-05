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
  body.innerHTML = logs.map(renderLogRow).join('')

  // 儲存目前頁碼至全域變數，並更新頁碼顯示
  currentPage = page
  const indicator = document.getElementById('pageIndicator')
  if (indicator) indicator.textContent = `第 ${page} 頁`

  if ('currentPage' in data && 'hasNextPage' in data) {
    updatePaginationButtons(data.currentPage, data.hasNextPage)
  }
}

/**
 * 產生單筆資料 HTML
 * @param {object} log 
 * @returns {string}
 */
function renderLogRow(log) {
  return `
    <tr data-id="${log.id}" data-log='${encodeURIComponent(JSON.stringify(log))}'>
      <td>${log.log_date}</td>
      <td>${log.log_time || ''}</td>
      <td>${log.description || ''}</td>
      <td>${log.grains}</td>
      <td>${log.protein}</td>
      <td>${log.vegetables}</td>
      <td>${log.fruits}</td>
      <td>${log.dairy}</td>
      <td>${log.fats}</td>
      <td>${Math.round(log.calories)}</td>
      <td>${Math.round(log.proteins)}</td>
      <td>${Math.round(log.carbs)}</td>
      <td>${Math.round(log.fats_total)}</td>
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
}