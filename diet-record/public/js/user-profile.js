import { payload, logout, token } from './auth.js'

export function bindUserModal() {
  document.getElementById('newName').value = payload.name
  document.getElementById('newPassword').value = ''
  new bootstrap.Modal(document.getElementById('userModal')).show()
}

export function bindUserFormSubmit() {
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
}