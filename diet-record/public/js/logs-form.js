import { token } from './auth.js'
import { calcNutrition } from './nutrition.js'
import { loadLogs } from './logs-table.js'

const form = document.getElementById('logForm')
const modalEl = document.getElementById('logModal')
const modal = new bootstrap.Modal(modalEl)
const modalTitle = document.getElementById('logModalTitle')

let editLogId = null

// 開啟 modal：新增模式
export function openLogModal() {
  modalTitle.textContent = '➕ 新增紀錄'
  editLogId = null
  form.reset()
  document.getElementById('log_date').value = new Date().toISOString().slice(0, 10)
  calcNutrition()
  modal.show()
}

// 開啟 modal：編輯模式
export function openEditModal(data) {
  modalTitle.textContent = '✏️ 編輯紀錄'
  editLogId = data.id

  document.getElementById('log_date').value = data.log_date
  document.getElementById('log_time').value = data.log_time || ''
  document.getElementById('description').value = data.description || ''
  document.getElementById('grains').value = data.grains
  document.getElementById('protein').value = data.protein
  document.getElementById('vegetables').value = data.vegetables
  document.getElementById('fruits').value = data.fruits
  document.getElementById('dairy').value = data.dairy
  document.getElementById('fats').value = data.fats

  calcNutrition()
  modal.show()
}

// 綁定表單送出事件
export function bindFormSubmit() {
  form.addEventListener('submit', async (e) => {
    e.preventDefault()

    const payload = {
      log_date: document.getElementById('log_date').value,
      log_time: document.getElementById('log_time').value,
      description: document.getElementById('description').value,
      grains: parseFloat(document.getElementById('grains').value || '0'),
      protein: parseFloat(document.getElementById('protein').value || '0'),
      vegetables: parseFloat(document.getElementById('vegetables').value || '0'),
      fruits: parseFloat(document.getElementById('fruits').value || '0'),
      dairy: parseFloat(document.getElementById('dairy').value || '0'),
      fats: parseFloat(document.getElementById('fats').value || '0'),
      source: editLogId ? '手動編輯' : '手動輸入',
    }

    const url = editLogId ? `/api/logs/${editLogId}` : '/api/logs'
    const method = editLogId ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    })

    if (res.ok) {
      modal.hide()
      form.reset()
      editLogId = null
      loadLogs()
    } else {
      alert('儲存失敗')
    }
  })
}