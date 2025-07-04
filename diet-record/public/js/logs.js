const token = localStorage.getItem('token')
if (!token) location.href = '/login.html'

const form = document.getElementById('logForm')
const body = document.getElementById('logsBody')

// 顯示目前登入者名稱
const payload = JSON.parse(atob(token.split('.')[1]))
document.getElementById('currentUser').textContent = `👤 ${payload.name}`

function logout() {
  localStorage.removeItem('token')
  location.href = '/login.html'
}

function openUserModal() {
  document.getElementById('newName').value = payload.name
  document.getElementById('newPassword').value = ''
  new bootstrap.Modal(document.getElementById('userModal')).show()
}

// 📝 表單送出：新增或更新紀錄
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
    source: '手動輸入',
  }

  const res = await fetch('/api/logs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  })

  if (res.ok) {
    form.reset()
    document.getElementById('log_date').value = new Date().toISOString().slice(0, 10)
    loadLogs()
  } else {
    alert('紀錄失敗')
  }
})

// 🔁 載入紀錄
async function loadLogs() {
  const res = await fetch('/api/logs', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  const data = await res.json()

  body.innerHTML = ''
  data.forEach(log => {
    const row = `
      <tr data-id="${log.id}">
        <td>${log.log_date}</td>
        <td>${log.log_time || ''}</td>
        <td>${log.description || ''}</td>
        <td>
          穀${log.grains}、蛋${log.protein}、菜${log.vegetables}<br>
          果${log.fruits}、乳${log.dairy}、脂${log.fats}
        </td>
        <td>${Math.round(log.calories)} kcal</td>
        <td>
          <button class="btn btn-sm btn-outline-secondary btn-edit">編輯</button>
          <button class="btn btn-sm btn-outline-danger btn-delete">刪除</button>
        </td>
      </tr>
    `
    body.insertAdjacentHTML('beforeend', row)
  })
}

// 🧽 點擊操作（編輯／刪除）
body.addEventListener('click', async (e) => {
  const row = e.target.closest('tr')
  const id = row?.dataset.id
  if (!id) return

  if (e.target.classList.contains('btn-delete')) {
    if (confirm('確定要刪除這筆紀錄？')) {
      const res = await fetch(`/api/logs/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) row.remove()
      else alert('刪除失敗')
    }
  }

  if (e.target.classList.contains('btn-edit')) {
    const cells = row.querySelectorAll('td')
    document.getElementById('log_date').value = cells[0].textContent
    document.getElementById('log_time').value = cells[1].textContent
    document.getElementById('description').value = cells[2].textContent

    const match = cells[3].textContent.match(/穀(\d+\.?\d*)、蛋(\d+\.?\d*)、菜(\d+\.?\d*)果(\d+\.?\d*)、乳(\d+\.?\d*)、脂(\d+\.?\d*)/)
    if (match) {
      document.getElementById('grains').value = match[1]
      document.getElementById('protein').value = match[2]
      document.getElementById('vegetables').value = match[3]
      document.getElementById('fruits').value = match[4]
      document.getElementById('dairy').value = match[5]
      document.getElementById('fats').value = match[6]
    }

    form.onsubmit = async (evt) => {
      evt.preventDefault()
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
        source: '手動編輯',
      }

      const res = await fetch(`/api/logs/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        form.reset()
        form.onsubmit = defaultSubmitHandler
        document.getElementById('log_date').value = new Date().toISOString().slice(0, 10)
        loadLogs()
      } else {
        alert('更新失敗')
      }
    }
  }
})

// 👤 帳號資料更新
document.getElementById('userForm').addEventListener('submit', async (e) => {
  e.preventDefault()
  const name = document.getElementById('newName').value.trim()
  const password = document.getElementById('newPassword').value.trim()

  const res = await fetch('/api/user', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name, password })
  })

  if (res.ok) {
    alert('資料更新成功，請重新登入')
    logout()
  } else {
    alert('更新失敗')
  }
})

const defaultSubmitHandler = form.onsubmit
document.getElementById('log_date').value = new Date().toISOString().slice(0, 10)
loadLogs()