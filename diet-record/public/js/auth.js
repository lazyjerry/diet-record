export const token = localStorage.getItem('token')
if (!token) location.href = '/login.html'

export let payload = {}



export function showUserName() {
  // 如果 payload 為空
  if (Object.keys(payload).length === 0) {
    
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
      payload = data.payload
      document.getElementById('currentUser').textContent = `👤 ${payload.name}`
    })
    .catch(() => {
      localStorage.removeItem('token')
      location.href = '/login.html'
      console.log("驗證失敗");
    })
  }else{
    document.getElementById('currentUser').textContent = `👤 ${payload.name}`
  }
}

export function logout() {
  if (confirm('確定要登出嗎？')) {
    localStorage.removeItem('token')
    location.href = '/login.html'
  }
}