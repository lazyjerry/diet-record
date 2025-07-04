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

// 即時計算營養欄位
const nutrientFields = ["grains", "protein", "vegetables", "fruits", "dairy", "fats"]
const calcFields = {
  calories: document.getElementById('calories'),
  carbs: document.getElementById('carbs'),
  proteins: document.getElementById('proteins'),
  fats_total: document.getElementById('fats_total'),
}
function calcNutrition() {
  const g = (id) => parseFloat(document.getElementById(id).value || 0)
  const grains = g('grains'), protein = g('protein'), vegetables = g('vegetables')
  const fruits = g('fruits'), dairy = g('dairy'), fats = g('fats')

  const calories = grains * 70 + protein * 75 + vegetables * 25 + fruits * 60 + dairy * 85 + fats * 45
  const carbs = grains * 15 + vegetables * 5 + fruits * 15 + dairy * 12
  const proteins = grains * 2 + protein * 7 + vegetables * 1 + dairy * 8
  const fats_total = protein * 5 + fats * 5

  calcFields.calories.textContent = Math.round(calories)
  calcFields.carbs.textContent = Math.round(carbs)
  calcFields.proteins.textContent = Math.round(proteins)
  calcFields.fats_total.textContent = Math.round(fats_total)
}
nutrientFields.forEach(id => {
  document.getElementById(id).addEventListener('input', calcNutrition)
})

// 表單送出（新增）
form.addEventListener('submit', async (e) => {
  e.preventDefault()
  const payload = nutrientFields.reduce((acc, id) => {
    acc[id] = parseFloat(document.getElementById(id).value || 0)
    return acc
  }, {
    log_date: document.getElementById('log_date').value,
    log_time: document.getElementById('log_time').value,
    description: document.getElementById('description').value,
    source: '手動輸入',
  })

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
    calcNutrition()
    loadLogs()
  } else {
    alert('紀錄失敗')
  }
})

// 載入紀錄
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
    body.insertAdjacentHTML('beforeend', row)
  })
}

// 點擊操作（刪除／編輯）
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

    nutrientFields.forEach((id, i) => {
      document.getElementById(id).value = cells[i + 3].textContent
    })
    calcNutrition()

    form.onsubmit = async (evt) => {
      evt.preventDefault()
      const payload = nutrientFields.reduce((acc, id) => {
        acc[id] = parseFloat(document.getElementById(id).value || 0)
        return acc
      }, {
        log_date: document.getElementById('log_date').value,
        log_time: document.getElementById('log_time').value,
        description: document.getElementById('description').value,
        source: '手動編輯',
      })

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
        calcNutrition()
        loadLogs()
      } else {
        alert('更新失敗')
      }
    }
  }
})

// 編輯個人資料
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

// 初始化
const defaultSubmitHandler = form.onsubmit
document.getElementById('log_date').value = new Date().toISOString().slice(0, 10)
calcNutrition()
loadLogs()