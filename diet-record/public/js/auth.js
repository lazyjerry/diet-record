export const token = localStorage.getItem('token')
if (!token) location.href = '/login.html'

export let payload = {}

// 從後端驗證 token 並取得 payload
fetch('/api/verify', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
  .then(res => {
    if (!res.ok) throw new Error('驗證失敗')
    return res.json()
  })
  .then(data => {
    payload = data
    showUserName()
  })
  .catch(() => {
    localStorage.removeItem('token')
    location.href = '/login.html'
  })

export function showUserName() {
  document.getElementById('currentUser').textContent = `👤 ${payload.name}`
}

export function logout() {
  if (confirm('確定要登出嗎？')) {
    localStorage.removeItem('token')
    location.href = '/login.html'
  }
}