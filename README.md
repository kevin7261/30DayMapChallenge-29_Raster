# 🌍 30DayMapChallenge-29_Raster - 個人旅遊足跡地圖

一個基於 Vue
3 和 D3.js 的互動式世界地圖應用程式，展示個人旅遊足跡和已造訪國家。使用方位等距投影技術，以台灣為中心點，呈現個人化的世界旅遊經驗。

## 📋 目錄

- [專案概述](#專案概述)
- [功能特色](#功能特色)
- [技術架構](#技術架構)
- [專案結構](#專案結構)
- [安裝與運行](#安裝與運行)
- [使用說明](#使用說明)
- [API 文檔](#api-文檔)
- [開發指南](#開發指南)
- [部署說明](#部署說明)
- [技術細節](#技術細節)
- [故障排除](#故障排除)
- [貢獻指南](#貢獻指南)
- [授權條款](#授權條款)

## 🎯 專案概述

### 專案背景

本專案是 30DayMapChallenge 的第 4 天挑戰 - "Data challenge: My
Data"，旨在創建一個展示個人旅遊足跡的互動式地圖。使用現代化的前端技術棧，結合地理資訊系統 (GIS) 概念，呈現個人化的世界旅遊經驗。

### 設計理念

- **個人化體驗**: 以台灣為中心，展示個人旅遊足跡
- **視覺化呈現**: 使用不同顏色區分家鄉和已造訪國家
- **互動式導航**: 支援平滑的地圖導航和視角切換
- **響應式設計**: 適配各種設備和螢幕尺寸

### 核心價值

- 🏠 **家鄉認同**: 突出台灣作為家鄉的特殊地位
- 🌍 **世界視野**: 展示個人對世界的探索足跡
- 🎨 **視覺美學**: 簡潔優雅的設計風格
- 🔧 **技術創新**: 使用現代化的前端技術

## ✨ 功能特色

### 🗺️ 地圖功能

#### 核心地圖特性

- **方位等距投影**: 使用 D3.js 的 `geoAzimuthalEquidistant` 投影，以台灣為中心
- **國家合併顯示**: 將已造訪的國家合併為單一形狀，簡化視覺呈現
- **雙色系統**: 台灣使用特殊顏色 (`#ff9999`)，已造訪國家使用統一顏色 (`#666666`)
- **無邊界設計**: 移除國家邊界線，創造更簡潔的視覺效果

#### 互動功能

- **平滑導航**: 點擊按鈕可平滑導航到台灣
- **響應式縮放**: 自動適應容器大小變化
- **固定投影**: 地球大小保持不變，只改變旋轉中心

### 🎨 用戶界面

#### 設計系統

- **現代化佈局**: 基於 Bootstrap 5 的響應式設計
- **滿版無邊距**: 地圖佔滿整個視窗，無多餘空白
- **簡潔配色**: 使用 CSS 變數系統管理顏色
- **字體系統**: 整合 Roboto 和 Noto Sans TC 字體

#### 視覺效果

- **平滑過渡**: CSS transition 動畫效果
- **一致性設計**: 統一的按鈕和文字樣式
- **無障礙設計**: 良好的對比度和可讀性

### 🚀 技術特色

#### 前端架構

- **Vue 3 Composition API**: 現代化的 Vue 開發模式
- **Pinia 狀態管理**: 高效的響應式狀態管理
- **D3.js 地圖庫**: 強大的數據可視化和地圖繪製能力
- **模組化架構**: 清晰的代碼組織和維護性

#### 性能優化

- **懶載入**: 按需載入地圖數據
- **記憶體管理**: 適當的組件生命週期管理
- **事件防抖**: ResizeObserver 配合防抖機制
- **錯誤處理**: 完善的錯誤捕獲和恢復機制

## 🏗️ 技術架構

### 前端技術棧

#### 核心框架

- **Vue 3.3+**: 漸進式 JavaScript 框架
  - Composition API
  - `<script setup>` 語法
  - 響應式系統
- **Vue Router 4**: 單頁應用程式路由管理
- **Pinia 2+**: 輕量級狀態管理庫

#### 地圖與可視化

- **D3.js 7+**: 數據可視化和地圖繪製
  - `geoAzimuthalEquidistant` 投影
  - `geoPath` 路徑生成器
  - SVG 渲染
- **GeoJSON**: 世界國家邊界數據

#### UI 框架

- **Bootstrap 5.3+**: CSS 框架
  - 響應式網格系統
  - 工具類別
  - 組件庫
- **Font Awesome 6+**: 向量圖示庫

#### 開發工具

- **Vue CLI 5+**: 構建工具
- **ESLint**: 代碼質量檢查
- **Prettier**: 代碼格式化
- **Babel**: JavaScript 編譯

### 核心組件架構

#### 組件層級

```
App.vue (根組件)
├── HomeView.vue (主頁面)
    └── MapTab.vue (地圖組件)
```

#### 狀態管理

```
stores/
├── dataStore.js (數據存儲)
└── defineStore.js (配置存儲)
```

#### 樣式系統

```
assets/css/
├── variables.css (CSS 變數)
└── common.css (共用樣式)
```

## 📁 專案結構

```
30DayMapChallenge-29_Raster/
├── 📁 public/                          # 靜態資源目錄
│   ├── 📄 index.html                   # HTML 入口文件
│   ├── 📄 404.html                     # 404 錯誤頁面
│   ├── 📄 favicon.ico                  # 網站圖示
│   └── 📁 data/                        # 地理數據目錄
│       ├── 📄 ne_110m_admin_0_countries.geojson  # 世界國家邊界數據
│       └── 📄 README.md                # 數據說明文件
├── 📁 src/                             # 源代碼目錄
│   ├── 📄 main.js                      # 應用程式入口文件
│   ├── 📄 App.vue                      # 根組件
│   ├── 📁 assets/                      # 靜態資源
│   │   ├── 📁 css/                     # 樣式文件
│   │   │   ├── 📄 common.css           # 共用樣式
│   │   │   └── 📄 variables.css        # CSS 變數定義
│   │   └── 📄 logo.png                 # 應用程式標誌
│   ├── 📁 components/                 # 可重用組件 (目前為空)
│   ├── 📁 stores/                      # Pinia 狀態管理
│   │   ├── 📄 dataStore.js             # 數據存儲模組
│   │   └── 📄 defineStore.js           # 配置存儲模組
│   ├── 📁 tabs/                        # 標籤頁組件
│   │   └── 📄 MapTab.vue               # 地圖標籤頁組件
│   ├── 📁 utils/                       # 工具函數
│   │   └── 📄 utils.js                 # 通用工具函數
│   ├── 📁 views/                       # 頁面組件
│   │   └── 📄 HomeView.vue             # 主頁面組件
│   ├── 📁 router/                      # 路由配置
│   │   └── 📄 index.js                 # 路由定義
│   └── 📁 data/                        # 應用程式數據
│       └── 📄 README.md                # 數據說明
├── 📁 dist/                            # 構建輸出目錄
├── 📁 node_modules/                    # 依賴包目錄
├── 📄 package.json                     # 專案配置和依賴
├── 📄 package-lock.json                # 依賴版本鎖定
├── 📄 babel.config.js                  # Babel 配置
├── 📄 jsconfig.json                    # JavaScript 配置
├── 📄 vue.config.js                    # Vue CLI 配置
└── 📄 README.md                        # 專案說明文件
```

### 文件說明

#### 核心文件

- **`main.js`**: 應用程式入口，初始化 Vue、路由、狀態管理
- **`App.vue`**: 根組件，提供應用程式整體框架
- **`HomeView.vue`**: 主頁面，整合地圖和控制面板
- **`MapTab.vue`**: 地圖組件，使用 D3.js 繪製互動式地圖

#### 狀態管理

- **`dataStore.js`**: 管理已造訪國家數據和地圖導航
- **`defineStore.js`**: 管理底圖配置和地圖視圖狀態

#### 樣式系統

- **`variables.css`**: CSS 變數定義，包含顏色、字體、間距
- **`common.css`**: 共用樣式，包含組件樣式和工具類別

#### 配置文件

- **`package.json`**: 專案依賴和腳本配置
- **`vue.config.js`**: Vue CLI 構建配置
- **`babel.config.js`**: JavaScript 編譯配置

## 🚀 安裝與運行

### 環境要求

#### 系統要求

- **Node.js**: 16.0+ (推薦 18.0+)
- **npm**: 7.0+ 或 **yarn**: 1.22+
- **Git**: 2.0+ (用於版本控制)

#### 瀏覽器支援

- **Chrome**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+

### 安裝步驟

#### 1. 克隆專案

```bash
# 使用 HTTPS
git clone https://github.com/kevin7261/30DayMapChallenge-29_Raster.git

# 或使用 SSH
git clone git@github.com:kevin7261/30DayMapChallenge-29_Raster.git

# 進入專案目錄
cd 30DayMapChallenge-29_Raster
```

#### 2. 安裝依賴

```bash
# 使用 npm
npm install

# 或使用 yarn
yarn install

# 或使用 pnpm
pnpm install
```

#### 3. 啟動開發服務器

```bash
# 使用 npm
npm run serve

# 或使用 yarn
yarn serve

# 或使用 pnpm
pnpm serve
```

#### 4. 構建生產版本

```bash
# 使用 npm
npm run build

# 或使用 yarn
yarn build

# 或使用 pnpm
pnpm build
```

### 開發服務器

#### 本地訪問

- **本地地址**:
  `http://localhost:8080/30DayMapChallenge-29_Raster/`
- **網路地址**:
  `http://[your-ip]:8080/30DayMapChallenge-29_Raster/`

#### 熱重載

- 支援 Vue 組件熱重載
- 支援 CSS 熱重載
- 支援 JavaScript 熱重載

### 可用腳本

#### 開發腳本

```bash
npm run serve          # 啟動開發服務器
npm run build          # 構建生產版本
npm run lint           # 代碼質量檢查
npm run lint:fix       # 自動修復代碼問題
```

#### 格式化腳本

```bash
npm run prettier       # 格式化代碼
npm run prettier:check # 檢查代碼格式
npm run format         # 格式化並修復代碼
```

#### 部署腳本

```bash
npm run predeploy      # 部署前構建
npm run deploy         # 部署到 GitHub Pages
```

## 📖 使用說明

### 基本操作

#### 地圖導航

1. **自動導航**: 頁面載入後自動導航到台灣
2. **手動導航**: 可透過程式化方式導航到指定位置
3. **平滑動畫**: 地圖切換使用平滑的過渡動畫

#### 地圖互動

- **響應式設計**: 地圖自動適應容器大小變化
- **固定投影**: 地球大小保持不變，只改變旋轉中心
- **無縮放控制**: 地圖不支援手動縮放，保持固定視角

### 視覺元素

#### 國家顯示

- **台灣**: 使用特殊顏色 `#ff9999` (淺紅色)
- **已造訪國家**: 使用統一顏色 `#666666` (深灰色)
- **未造訪國家**: 不顯示在地圖上

#### 已造訪國家列表

```
Australia, Austria, Belgium, Brunei, China, Czechia, Denmark,
Estonia, Finland, France, Germany, Greece, Greenland, Hungary,
Iceland, Italy, Japan, Laos, Luxembourg, Malaysia, Mexico,
Mongolia, Netherlands, North Korea, Norway, Philippines, Poland,
Qatar, Singapore, Slovakia, South Korea, Spain, Sweden,
Switzerland, Thailand, United Kingdom, United States of America, Vietnam
```

### 技術特性

#### 投影系統

- **投影類型**: 方位等距投影 (Azimuthal Equidistant)
- **中心點**: 台灣地理中心 `[120.982025, 23.973875]`
- **縮放比例**: 自動計算，確保地圖適合容器大小
- **邊距**: 32px 內邊距，確保地圖不貼邊

#### 數據處理

- **GeoJSON 格式**: 使用 Natural Earth 110m 國家邊界數據
- **國家合併**: 將多個已造訪國家合併為單一 MultiPolygon
- **過濾機制**: 只顯示台灣和已造訪的國家

## 📚 API 文檔

### dataStore API

#### 狀態屬性

```javascript
// 台灣中心座標
taiwanCenter: [120.982025, 23.973875]

// 家鄉國家名稱
homeCountry: 'Taiwan'

// 已造訪國家列表
visitedCountries: ['Australia', 'Austria', ...]

// 地圖實例
mapInstance: LeafletMap | null
```

#### 方法

```javascript
// 檢查是否為家鄉國家
isHomeCountry(countryName: string): boolean

// 檢查國家是否已造訪
isCountryVisited(countryName: string): boolean

// 設定地圖實例
setMapInstance(map: LeafletMap): void

// 導航到台灣
navigateToTaiwan(): void
```

### defineStore API

#### 狀態屬性

```javascript
// 當前選中的底圖
selectedBasemap: 'carto_dark'

// 地圖視圖狀態
mapView: {
  center: [25.04583, 121.51972], // 台灣座標
  zoom: 16
}

// 底圖配置列表
basemaps: [
  {
    label: 'Carto Dark',
    value: 'carto_dark',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
  }
]
```

#### 方法

```javascript
// 設定選中的底圖
setSelectedBasemap(value: string): void

// 設定地圖視圖狀態
setMapView(center: [number, number], zoom: number): void
```

### MapTab 組件 API

#### Props

```javascript
// 無 props
```

#### Events

```javascript
// 地圖準備就緒事件
'map-ready': (mapInterface: MapInterface) => void
```

#### MapInterface

```javascript
interface MapInterface {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>
  projection: d3.GeoProjection
  path: d3.GeoPath<any, d3.GeoPermissibleObjects>
  navigateToLocation: (center: [number, number]) => void
}
```

## 🛠️ 開發指南

### 添加新國家

#### 1. 更新已造訪國家列表

```javascript
// 在 src/stores/dataStore.js 中
const visitedCountries = ref([
  'Australia',
  'Austria',
  // ... 現有國家
  'NewCountry', // 添加新國家
]);
```

#### 2. 確保 GeoJSON 數據包含該國家

- 檢查 `public/data/ne_110m_admin_0_countries.geojson` 是否包含該國家
- 確認國家名稱與 GeoJSON 中的 `name` 或 `ADMIN` 屬性匹配

#### 3. 測試國家顯示

- 重新載入頁面
- 檢查新國家是否正確顯示為已造訪國家
- 確認顏色和樣式正確

### 自定義樣式

#### 1. 修改國家顏色

```css
/* 在 src/assets/css/variables.css 中 */
:root {
  --my-color-taiwan: #ff9999; /* 台灣顏色 */
  --my-color-visited-countries: #666666; /* 已造訪國家顏色 */
}
```

#### 2. 修改字體和間距

```css
/* 在 src/assets/css/variables.css 中 */
:root {
  --my-font-family-primary: 'Roboto', sans-serif;
  --my-font-size-sm: 1rem;
  --my-font-size-lg: 2rem;
  --my-letter-spacing: 0.2px;
}
```

#### 3. 修改地圖投影參數

```javascript
// 在 src/tabs/MapTab.vue 中
projection = d3
  .geoAzimuthalEquidistant()
  .rotate([-120.982025, -23.973875]) // 修改中心點
  .scale(scale) // 修改縮放比例
  .translate([width / 2, height / 2])
  .clipAngle(180);
```

### 開發工具

#### Vue DevTools

- 安裝 Vue DevTools 瀏覽器擴展
- 調試組件狀態和 props
- 監控響應式數據變化

#### D3.js 調試

- 使用瀏覽器開發者工具
- 檢查 SVG 元素結構
- 監控投影和路徑計算

#### ESLint 配置

```javascript
// .eslintrc.js
module.exports = {
  rules: {
    'prettier/prettier': 'off',
    'no-console': 'warn',
    'no-debugger': 'warn',
    'vue/multi-word-component-names': 'off',
  },
};
```

### 代碼規範

#### Vue 組件規範

- 使用 Composition API
- 使用 `<script setup>` 語法
- 適當的組件命名和結構

#### JavaScript 規範

- 使用 ES6+ 語法
- 適當的錯誤處理
- 清晰的函數和變數命名

#### CSS 規範

- 使用 CSS 變數
- 模組化樣式組織
- 響應式設計原則

## 🚀 部署說明

### GitHub Pages 部署

#### 1. 準備部署

```bash
# 確保代碼已提交
git add .
git commit -m "準備部署"
git push origin main
```

#### 2. 構建專案

```bash
npm run build
```

#### 3. 部署到 GitHub Pages

```bash
npm run deploy
```

#### 4. 訪問網站

```
https://kevin7261.github.io/30DayMapChallenge-29_Raster/
```

### 其他部署選項

#### Netlify 部署

1. 連接 GitHub 倉庫
2. 設定構建命令: `npm run build`
3. 設定發布目錄: `dist`
4. 設定基礎路徑: `/30DayMapChallenge-29_Raster/`

#### Vercel 部署

1. 連接 GitHub 倉庫
2. 設定構建命令: `npm run build`
3. 設定輸出目錄: `dist`
4. 設定基礎路徑: `/30DayMapChallenge-29_Raster/`

### 環境變數

#### 開發環境

```env
NODE_ENV=development
VUE_APP_API_URL=http://localhost:3000
```

#### 生產環境

```env
NODE_ENV=production
VUE_APP_API_URL=https://your-api-domain.com
```

### 性能優化

#### 構建優化

1. **代碼分割**: 使用動態導入
2. **圖片優化**: 壓縮和格式優化
3. **CSS 優化**: 移除未使用的樣式
4. **JavaScript 優化**: 壓縮和混淆

#### 運行時優化

1. **懶載入**: 按需載入組件
2. **緩存策略**: 適當的 HTTP 緩存
3. **CDN 加速**: 使用 CDN 載入靜態資源

## 🔧 技術細節

### D3.js 地圖實現

#### 投影系統

```javascript
// 方位等距投影配置
projection = d3
  .geoAzimuthalEquidistant()
  .rotate([-120.982025, -23.973875]) // 台灣中心
  .scale(scale) // 動態縮放
  .translate([width / 2, height / 2]) // 居中
  .clipAngle(180); // 半球顯示
```

#### 路徑生成

```javascript
// 地理路徑生成器
path = d3.geoPath().projection(projection);

// 繪製國家邊界
g.selectAll('path.country')
  .data(countries)
  .enter()
  .append('path')
  .attr('d', path);
```

#### 國家合併算法

```javascript
// 合併多個國家為 MultiPolygon
const mergeCountries = (features) => {
  const mergedFeature = {
    type: 'Feature',
    geometry: {
      type: 'MultiPolygon',
      coordinates: [],
    },
  };

  features.forEach((feature) => {
    if (feature.geometry.type === 'Polygon') {
      mergedFeature.geometry.coordinates.push(feature.geometry.coordinates);
    } else if (feature.geometry.type === 'MultiPolygon') {
      mergedFeature.geometry.coordinates.push(...feature.geometry.coordinates);
    }
  });

  return mergedFeature;
};
```

### Vue 3 Composition API

#### 響應式狀態

```javascript
// 使用 ref 創建響應式變數
const mapContainer = ref(null);
const isMapReady = ref(false);

// 使用 reactive 創建響應式對象
const mapState = reactive({
  center: [120.982025, 23.973875],
  zoom: 16,
});
```

#### 生命週期管理

```javascript
// 組件掛載
onMounted(() => {
  initMap();
  setupResizeObserver();
});

// 組件卸載
onUnmounted(() => {
  cleanup();
});
```

#### 事件處理

```javascript
// 自定義事件發射
emit('map-ready', mapInterface);

// 事件監聽
const setupResizeObserver = () => {
  resizeObserver = new ResizeObserver(() => {
    invalidateSize();
  });
};
```

### Pinia 狀態管理

#### Store 定義

```javascript
export const useDataStore = defineStore('data', () => {
  // 狀態
  const visitedCountries = ref([...]);

  // 計算屬性
  const isCountryVisited = computed(() => {
    return (countryName) => {
      return visitedCountries.value.includes(countryName);
    };
  });

  // 方法
  const navigateToTaiwan = () => {
    // 導航邏輯
  };

  return {
    visitedCountries,
    isCountryVisited,
    navigateToTaiwan
  };
});
```

#### 持久化配置

```javascript
export const useDataStore = defineStore(
  'data',
  () => {
    // store 邏輯
  },
  {
    persist: true, // 啟用持久化
  }
);
```

### CSS 變數系統

#### 變數定義

```css
:root {
  /* 顏色系統 */
  --my-color-white: #ffffff;
  --my-color-gray-900: #212121;
  --my-color-taiwan: #ff9999;
  --my-color-visited-countries: #666666;

  /* 字體系統 */
  --my-font-family-primary: 'Roboto', sans-serif;
  --my-font-size-sm: 1rem;
  --my-font-size-lg: 2rem;

  /* 間距系統 */
  --my-letter-spacing: 0.2px;
}
```

#### 響應式設計

```css
/* 移動端適配 */
@media (max-width: 768px) {
  :root {
    --my-font-size-sm: 0.875rem;
    --my-font-size-lg: 1.5rem;
  }
}
```

## 🐛 故障排除

### 常見問題

#### 1. 地圖無法載入

**問題**: 地圖容器為空白 **解決方案**:

- 檢查 GeoJSON 文件路徑是否正確
- 確認網路連接正常
- 檢查瀏覽器控制台錯誤訊息

#### 2. 國家不顯示

**問題**: 某些國家沒有顯示在地圖上 **解決方案**:

- 檢查國家名稱是否與 GeoJSON 數據匹配
- 確認國家在已造訪列表中
- 檢查過濾邏輯是否正確

#### 3. 地圖尺寸問題

**問題**: 地圖尺寸不正確 **解決方案**:

- 檢查容器 CSS 樣式
- 確認 ResizeObserver 是否正常工作
- 檢查投影縮放計算

#### 4. 性能問題

**問題**: 地圖載入緩慢 **解決方案**:

- 檢查 GeoJSON 文件大小
- 優化國家合併算法
- 使用更小的地理數據集

### 調試技巧

#### 1. 瀏覽器開發者工具

```javascript
// 檢查地圖實例
console.log('Map instance:', mapInstance.value);

// 檢查投影參數
console.log('Projection:', projection);

// 檢查國家數據
console.log('Visited countries:', visitedCountries.value);
```

#### 2. Vue DevTools

- 檢查組件狀態
- 監控響應式數據變化
- 調試組件生命週期

#### 3. 網路面板

- 檢查 GeoJSON 文件載入
- 確認資源載入時間
- 檢查 HTTP 狀態碼

### 錯誤處理

#### 1. 數據載入錯誤

```javascript
const loadWorldData = async () => {
  try {
    const response = await fetch(geoJsonUrl);
    if (!response.ok) {
      throw new Error(`HTTP 錯誤! 狀態: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('數據載入失敗:', error);
    return null;
  }
};
```

#### 2. 地圖初始化錯誤

```javascript
const initMap = async () => {
  let attempts = 0;
  const maxAttempts = 20;

  const tryCreateMap = async () => {
    if (attempts >= maxAttempts) {
      console.error('地圖初始化失敗');
      return;
    }

    attempts++;
    if (createMap()) {
      await drawWorldMap();
    } else {
      setTimeout(tryCreateMap, 100);
    }
  };

  tryCreateMap();
};
```

## 🤝 貢獻指南

### 貢獻流程

#### 1. Fork 專案

- 點擊 GitHub 頁面的 "Fork" 按鈕
- 克隆你的 fork 到本地

#### 2. 創建功能分支

```bash
git checkout -b feature/AmazingFeature
```

#### 3. 提交更改

```bash
git add .
git commit -m 'Add some AmazingFeature'
```

#### 4. 推送到分支

```bash
git push origin feature/AmazingFeature
```

#### 5. 開啟 Pull Request

- 在 GitHub 上開啟 Pull Request
- 詳細描述你的更改
- 等待代碼審查

### 代碼規範

#### 1. 提交訊息規範

```
feat: 添加新功能
fix: 修復 bug
docs: 更新文檔
style: 代碼格式調整
refactor: 代碼重構
test: 添加測試
chore: 構建過程或輔助工具的變動
```

#### 2. 代碼風格

- 使用 ESLint 和 Prettier
- 遵循 Vue 3 最佳實踐
- 適當的註解和文檔

#### 3. 測試要求

- 確保代碼可以正常運行
- 測試不同瀏覽器兼容性
- 檢查響應式設計

### 問題報告

#### 1. Bug 報告

- 使用 GitHub Issues
- 提供詳細的重現步驟
- 包含錯誤截圖和日誌

#### 2. 功能請求

- 描述期望的功能
- 說明使用場景
- 提供設計建議

## 📄 授權條款

本專案採用 MIT 授權條款 - 查看 [LICENSE](LICENSE) 文件了解詳情。

### MIT 授權條款摘要

- ✅ 允許商業使用
- ✅ 允許修改
- ✅ 允許分發
- ✅ 允許私人使用
- ❌ 不提供擔保
- ❌ 不承擔責任

## 📞 聯繫方式

- **專案維護者**: Kevin Cheng
- **電子郵件**: [your.email@example.com]
- **GitHub**: [kevin7261](https://github.com/kevin7261)
- **專案連結**:
  [30DayMapChallenge-29_Raster](https://github.com/kevin7261/30DayMapChallenge-29_Raster)

## 🙏 致謝

### 開源項目

- [D3.js](https://d3js.org/) - 數據可視化庫
- [Vue.js](https://vuejs.org/) - 漸進式 JavaScript 框架
- [Pinia](https://pinia.vuejs.org/) - Vue 狀態管理庫
- [Bootstrap](https://getbootstrap.com/) - CSS 框架
- [Font Awesome](https://fontawesome.com/) - 圖示庫

### 數據來源

- [Natural Earth](https://www.naturalearthdata.com/) - 世界地理數據
- [OpenStreetMap](https://www.openstreetmap.org/) - 開放地圖數據

### 靈感來源

- [30DayMapChallenge](https://30daymapchallenge.com/) - 地圖挑戰活動
- [D3.js Gallery](https://observablehq.com/@d3/gallery) - D3.js 範例集合

---

**30DayMapChallenge-29_Raster** - 探索世界國家的點之美 🌍✨

_最後更新: 2024年12月_
