/**
 * 🚀 Vue Router 路由配置 (Vue Router Configuration)
 *
 * 本文件負責配置應用程式的路由系統，使用 Vue Router 4 進行單頁應用程式 (SPA) 的導航管理。
 *
 * 📋 主要功能：
 * 1. 🗺️ 定義應用程式的所有路由規則和對應的組件
 * 2. 🔧 配置路由模式為 HTML5 History API，支援乾淨的 URL
 * 3. 📍 設定基礎路徑，確保在子目錄部署時正常工作
 * 4. 🎯 提供路由守衛和導航控制功能
 *
 * 🏗️ 技術架構：
 * - Vue Router 4 (支援 Vue 3)
 * - HTML5 History API 模式
 * - 聲明式路由配置
 * - 動態路由載入 (如需要)
 *
 * 📁 相關文件：
 * - ../views/HomeView.vue - 主頁面組件
 * - ../App.vue - 根組件，包含 <router-view>
 * - ../main.js - 應用程式入口，註冊路由系統
 *
 * @author Kevin Cheng
 * @version 1.0.0
 * @since 2024-12
 */

// 🔧 Vue Router 核心模組引入 (Vue Router Core Module Imports)
import { createRouter, createWebHistory } from 'vue-router';

// 🧩 頁面組件引入 (Page Component Imports)
import HomeView from '../views/HomeView.vue';

/**
 * 📍 路由配置陣列 (Routes Configuration Array)
 * 定義應用程式的所有路由規則，每個路由包含路徑、名稱和對應的組件
 *
 * 路由結構說明：
 * - path: URL 路徑，支援動態參數和嵌套路由
 * - name: 路由名稱，用於程式化導航
 * - component: 對應的 Vue 組件
 * - meta: 路由元數據，可包含權限、標題等信息
 */
const routes = [
  {
    path: '/', // 🏠 根路徑 (Root Path)
    name: 'Home', // 路由名稱，用於程式化導航
    component: HomeView, // 對應的 Vue 組件
  },
  // 🔮 未來可擴展的路由 (Future Expandable Routes)
  // {
  //   path: '/about',
  //   name: 'About',
  //   component: () => import('../views/AboutView.vue'), // 懶載入
  //   meta: {
  //     title: '關於我們',
  //     requiresAuth: false
  //   }
  // }
];

/**
 * 🛣️ 路由器實例創建 (Router Instance Creation)
 *
 * 配置說明：
 * - history: 使用 HTML5 History API 模式，提供乾淨的 URL
 * - base: 設定應用程式的基礎路徑，確保在子目錄部署時正常工作
 * - routes: 路由配置陣列
 * - scrollBehavior: 路由切換時的滾動行為 (可選)
 * - linkActiveClass: 活躍連結的 CSS 類別 (可選)
 * - linkExactActiveClass: 精確匹配連結的 CSS 類別 (可選)
 */
const router = createRouter({
  // 📍 路由模式配置 (Routing Mode Configuration)
  history: createWebHistory('/30DayMapChallenge-29_Raster/'),

  // 📋 路由規則配置 (Routes Configuration)
  routes,

  // 🎯 滾動行為配置 (Scroll Behavior Configuration)
  scrollBehavior(to, from, savedPosition) {
    // 如果有保存的位置 (瀏覽器後退/前進)，則恢復該位置
    if (savedPosition) {
      return savedPosition;
    }
    // 否則滾動到頂部
    return { top: 0 };
  },

  // 🎨 連結樣式配置 (Link Style Configuration)
  linkActiveClass: 'router-link-active', // 活躍連結樣式
  linkExactActiveClass: 'router-link-exact-active', // 精確匹配連結樣式
});

/**
 * 🔒 路由守衛配置 (Route Guards Configuration)
 *
 * 路由守衛用於在路由切換時執行特定的邏輯，如權限檢查等
 */

// 🌍 全域前置守衛 (Global Before Guard)
router.beforeEach((to, from, next) => {
  console.log('🛣️ [Router] 路由切換:', from.path, '->', to.path);

  // ✅ 繼續導航 (Continue Navigation)
  next();
});

// 🌍 全域後置守衛 (Global After Guard)
router.afterEach((to) => {
  console.log('✅ [Router] 路由切換完成:', to.path);

  // 📊 頁面訪問統計 (Page Visit Analytics)
  // 這裡可以添加 Google Analytics 或其他統計代碼
  // gtag('config', 'GA_MEASUREMENT_ID', {
  //   page_path: to.path
  // });
});

// 🌍 全域錯誤處理 (Global Error Handler)
router.onError((error) => {
  console.error('❌ [Router] 路由錯誤:', error);

  // 🔄 錯誤恢復 (Error Recovery)
  // 可以重定向到錯誤頁面或顯示錯誤訊息
});

// 📤 導出路由器實例 (Export Router Instance)
export default router;
