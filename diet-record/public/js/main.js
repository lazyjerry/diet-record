import { showUserName, logout } from './auth.js'
import { bindNutritionEvents, calcNutrition } from './nutrition.js'
import { bindFormSubmit, openLogModal, openEditModal } from './logs-form.js'
import { bindUserFormSubmit, bindUserModal } from './user-profile.js'
import { loadLogs, bindLogTableActions, bindSearchForm, bindPaginationControls } from './logs-table.js'

document.addEventListener('DOMContentLoaded', () => {
  showUserName()

  function setTodayDate(inputId) {
    const input = document.getElementById(inputId)
    if (input) input.value = new Date().toISOString().split('T')[0]
  }

  setTodayDate('log_date')
  

  bindNutritionEvents() 
  calcNutrition()

  // 頁面初始化
  bindFormSubmit()
  bindUserFormSubmit()
  loadLogs()
  bindLogTableActions()
  bindPaginationControls()
  bindSearchForm()

  // 綁定給全域 onclick 使用
  window.logout = logout
  window.openUserModal = bindUserModal
  window.openLogModal = openLogModal
  window.openEditModal = openEditModal
})