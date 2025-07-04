export const token = localStorage.getItem('token')
if (!token) location.href = '/login.html'

export const payload = JSON.parse(atob(token.split('.')[1]))

export function showUserName() {
  document.getElementById('currentUser').textContent = `👤 ${payload.name}`
}

export function logout() {
  localStorage.removeItem('token')
  location.href = '/login.html'
}