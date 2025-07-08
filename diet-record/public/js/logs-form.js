import { token } from './auth.js'
import { calcNutrition } from './nutrition.js'
import { loadLogs } from './logs-table.js'

const form = document.getElementById('logForm')
const modalEl = document.getElementById('logModal')
const modal = new bootstrap.Modal(modalEl)
const modalTitle = document.getElementById('logModalTitle')

let editLogId = null

function setTodayDate(inputId) {
  const input = document.getElementById(inputId)
  input.value = new Date(Date.now() - (new Date()).getTimezoneOffset() * 60000).toISOString().split('T')[0]
}


function setLogModalHint() {
  const hint = document.getElementById('logModalHint')
  if (hint) {
    // 給我一些提示文字，讓使用者知道這不只是紀錄，更是一個儀式和反思
    const hintTexts = [
      '請仔細思考你的餐點有哪些營養，用心紀錄',
      '請填寫餐點的營養成分，幫助你更好地了解飲食',
      '記錄你的餐點營養，讓健康飲食更加簡單',
      '每餐的營養成分都很重要，請詳細填寫',
      '營養均衡是健康的關鍵，請填寫餐點資訊',
      '記錄飲食習慣，讓健康飲食成為日常',
      '這不只是紀錄，更是一個反思與儀式，讓每一餐都更有意義',
      '用心記錄每一餐，讓健康成為你的日常儀式',
      '透過記錄，與自己的飲食習慣對話，發現更好的自己'
    ]
    hint.textContent = hintTexts[Math.floor(Math.random() * hintTexts.length)];
  }
}


// 開啟 modal：新增模式
export function openLogModal() {
  modalTitle.textContent = '➕ 新增紀錄'
  editLogId = null
  form.reset()
  setTodayDate('log_date')
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