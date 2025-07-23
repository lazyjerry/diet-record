import { showUserName, logout } from './auth.js'
import { bindNutritionEvents, calcNutrition } from './nutrition.js'
import { bindFormSubmit, openLogModal, openEditModal } from './logs-form.js'
import { bindUserFormSubmit, bindUserModal } from './user-profile.js'
import { loadLogs, bindLogTableActions, bindSearchForm, bindPaginationControls } from './logs-table.js'

document.addEventListener('DOMContentLoaded', () => {

  showUserName()
  bindNutritionEvents() 
  calcNutrition()

  // 頁面初始化
  bindFormSubmit()
  bindUserFormSubmit()
  // 根據載入結果更新分頁按鈕狀態
  loadLogs()
  bindLogTableActions()
  bindPaginationControls()
  bindSearchForm()

  // 綁定給全域 onclick 使用
  window.logout = logout
  window.openUserModal = bindUserModal
  window.openLogModal = openLogModal
  window.openEditModal = openEditModal

  // 給表單輸入框加上 Enter 鍵換行功能
  document.querySelectorAll('.enter-next').forEach((input, index, list) => {
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault(); // ⚠️ 防止預設的 submit 行為

      // 尋找下一個可 focus 的輸入欄位
      const next = list[index + 1];
      if (next) next.focus();
    }
  });
});

  // 在全站只要跑一次就好
  document.addEventListener('hide.bs.modal', e => {
    const modalEl = e.target;

    // 若焦點還在對話框內，先移走；避免 aria-hidden 被瀏覽器擋下來
    if (modalEl.contains(document.activeElement)) {
      document.activeElement.blur();
    }
  });
})

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').then((reg) => {
    console.log("✅ Service Worker registered.", reg);
  }).catch((err) => {
    console.error("❌ Service Worker registration failed:", err);
  });
}