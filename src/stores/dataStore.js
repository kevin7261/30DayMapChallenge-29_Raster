/**
 * 📦 數據存儲模組 (Data Store Module)
 *
 * 管理已造訪國家數據和地圖導航功能
 * 使用 Pinia 狀態管理系統和 Vue 3 Composition API
 */

// 核心依賴
import { defineStore } from 'pinia';
import { ref } from 'vue';

/**
 * 🏪 數據存儲商店定義 (Data Store Definition)
 */
export const useDataStore = defineStore(
  'data',
  () => {
    // 台灣中心座標（用於地圖投影和導航）
    const taiwanCenter = [120.982025, 23.973875];

    // 台灣國家名稱
    const homeCountry = ref('Taiwan');

    // 已造訪國家列表
    const visitedCountries = ref([
      'Australia',
      'Austria',
      'Belgium',
      'Brunei',
      'China',
      'Czechia',
      'Denmark',
      'Estonia',
      'Finland',
      'France',
      'Germany',
      'Greece',
      'Greenland',
      'Hungary',
      'Iceland',
      'Italy',
      'Japan',
      'Laos',
      'Luxembourg',
      'Malaysia',
      'Mexico',
      'Mongolia',
      'Netherlands',
      'North Korea',
      'Norway',
      'Philippines',
      'Poland',
      'Qatar',
      'Singapore',
      'Slovakia',
      'South Korea',
      'Spain',
      'Sweden',
      'Switzerland',
      'Thailand',
      'United Kingdom',
      'United States of America',
      'Vietnam',
    ]);

    // 檢查國家是否為台灣
    const isHomeCountry = (countryName) => {
      if (!countryName) return false;
      return countryName.trim() === homeCountry.value;
    };

    // 檢查國家是否已造訪
    const isCountryVisited = (countryName) => {
      if (!countryName) return false;
      const normalizedName = countryName.trim();
      return visitedCountries.value.some((visitedCountry) => {
        if (normalizedName === visitedCountry) return true;
        if (normalizedName.includes(visitedCountry) || visitedCountry.includes(normalizedName)) {
          return true;
        }
        return false;
      });
    };

    // 地圖實例
    const mapInstance = ref(null);
    const setMapInstance = (map) => {
      mapInstance.value = map;
    };

    // 導航到台灣
    const navigateToTaiwan = () => {
      if (!mapInstance.value) {
        console.error('❌ 地圖實例未準備就緒');
        setTimeout(() => {
          if (mapInstance.value) {
            navigateToTaiwan();
          }
        }, 1000);
        return;
      }

      try {
        if (mapInstance.value.navigateToLocation) {
          mapInstance.value.navigateToLocation(taiwanCenter);
          console.log('🌍 成功導航到台灣');
        }
      } catch (error) {
        console.error('❌ 地圖導航失敗:', error);
      }
    };

    return {
      taiwanCenter,
      mapInstance,
      setMapInstance,
      navigateToTaiwan,
      homeCountry,
      isHomeCountry,
      visitedCountries,
      isCountryVisited,
    };
  },
  {
    persist: true,
  }
);
