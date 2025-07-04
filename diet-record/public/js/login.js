const form = document.getElementById('loginForm')
const alertBox = document.getElementById('alertBox')
const nameField = document.getElementById('nameField')

async function checkUserCount() {
  try {
    const res = await fetch('/api/user-count')
    const data = await res.json()
    if (data.count === 0) {
      nameField.classList.remove('d-none') // 顯示註冊欄位
    }
  } catch (err) {
    console.warn('用戶數查詢失敗：', err)
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault()
  alertBox.classList.add('d-none')

  const payload = {
    username: document.getElementById('username').value.trim(),
    password: document.getElementById('password').value.trim(),
    name: document.getElementById('name').value.trim() || null,
  }

  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const data = await res.json()
  if (res.ok && data.token) {
    localStorage.setItem('token', data.token)
    location.href = '/logs.html'
  } else {
    alertBox.className = 'alert alert-danger'
    alertBox.textContent = data.message || '登入失敗，請重試'
    alertBox.classList.remove('d-none')
  }
})

checkUserCount()