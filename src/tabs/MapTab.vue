<script>
  /**
   * 🗺️ MapTab.vue - D3.js 點數據地圖組件 (D3.js Points Map Component)
   *
   * 使用 D3.js 繪製點數據地圖，專為柵格數據點集合展示設計。
   * 主要功能：
   * - 使用 D3.js 顯示點數據地圖
   * - 根據 value 屬性動態設置點的顏色和大小
   * - 支援方位等距投影
   * - 響應式設計
   *
   * 技術架構：
   * - Vue 3 Composition API
   * - D3.js 地圖繪製
   * - Bootstrap 5 樣式
   */

  import { ref, onMounted, onUnmounted } from 'vue';
  import * as d3 from 'd3';

  export default {
    name: 'MapTab',
    emits: ['map-ready'],
    setup(props, { emit }) {

      // 地圖相關變數
      const mapContainer = ref(null);
      const svgElement = ref(null);
      let svg = null;
      let projection = null;
      let path = null;
      let zoom = null;
      let g = null;

      // 地圖控制狀態
      const isMapReady = ref(false);
      const mapContainerId = ref(`d3-map-${Math.random().toString(36).substr(2, 9)}`);

      // 點數據
      const pointsData = ref(null);

      /**
       * 📥 載入點數據
       */
      const loadPointsData = async () => {
        try {
          // 使用本地的 GeoJSON 檔案
          console.log('[MapTab] 開始載入點數據...');
          const response = await fetch(
            `${process.env.BASE_URL}data/twdtm100_points_pixel_aggregated_200.geojson`
          );

          if (!response.ok) {
            throw new Error(`HTTP 錯誤! 狀態: ${response.status}`);
          }

          const data = await response.json();
          pointsData.value = data;
          console.log('[MapTab] 點數據載入成功，特徵數量:', data.features?.length);
          return true;
        } catch (error) {
          console.error('[MapTab] 點數據載入失敗:', error);
          return false;
        }
      };

      /**
       * 🏗️ 創建地圖實例
       * 初始化 D3 地圖並設定基本配置
       */
      const createMap = () => {
        if (!mapContainer.value) return false;

        const rect = mapContainer.value.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
          console.warn('[MapTab] 容器尺寸為零，延遲初始化');
          return false;
        }

        try {
          const width = rect.width;
          const height = rect.height;

          // 創建 SVG 元素
          svg = d3
            .select(mapContainer.value)
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .style('background', '#f0f0f0');

          svgElement.value = svg.node();

          // 創建投影 - 使用方位等距投影 (Azimuthal Equidistant Projection)
          // 預設以台灣地理中心為投影中心
          // 添加32px padding，確保地圖不會貼邊
          const padding = 32;
          const availableWidth = width - padding * 2;
          const availableHeight = height - padding * 2;
          // 調整縮放比例以顯示整個點數據範圍（經度跨度約1.88度，緯度跨度約3.25度）
          // 使用較小的除數以獲得更大的縮放（地圖更大）
          const scale = Math.min(availableWidth, availableHeight) / 0.08;

          projection = d3
            .geoAzimuthalEquidistant()
            .rotate([-121.057677, -23.608688]) // 以點數據中心為中心
            .scale(scale) // 使用計算後的縮放比例
            .translate([width / 2, height / 2])
            .clipAngle(180);

          // 創建路徑生成器
          path = d3.geoPath().projection(projection);

          // 創建容器組
          g = svg.append('g');

          // 設置縮放行為（禁用所有互動）
          zoom = d3
            .zoom()
            .scaleExtent([1, 1]) // 禁用縮放
            .on('zoom', null); // 禁用縮放事件

          svg.call(zoom).on('wheel.zoom', null).on('dblclick.zoom', null);

          isMapReady.value = true;

          // 將地圖實例和方法一起傳遞
          const mapInterface = {
            svg,
            projection,
            path,
            navigateToLocation: (center) => navigateToLocation(center),
          };

          emit('map-ready', mapInterface);

          console.log('[MapTab] D3 地圖創建成功');
          return true;
        } catch (error) {
          console.error('[MapTab] D3 地圖創建失敗:', error);
          return false;
        }
      };

      /**
       * 🎨 繪製點數據地圖 - 按緯度繪製橫線
       */
      const drawPointsMap = async () => {
        if (!g || !pointsData.value) {
          console.error('[MapTab] 無法繪製地圖: g=', !!g, 'pointsData=', !!pointsData.value);
          return;
        }

        try {
          const features = pointsData.value.features || [];
          console.log('[MapTab] 開始繪製點數據地圖，點數量:', features.length);

          if (features.length === 0) {
            console.warn('[MapTab] 沒有點數據可繪製');
            return;
          }

          // 計算 value 的範圍用於顏色映射
          const values = features.map((f) => f.properties?.value || 0);
          const minValue = Math.min(...values);
          const maxValue = Math.max(...values);

          // 創建顏色比例尺
          const colorScale = d3
            .scaleSequential()
            .domain([minValue, maxValue])
            .interpolator(d3.interpolateViridis);

          // 計算線條寬度範圍（根據 value）
          const minStrokeWidth = 0.5;
          const maxStrokeWidth = 3;
          const strokeWidthScale = d3
            .scaleLinear()
            .domain([minValue, maxValue])
            .range([minStrokeWidth, maxStrokeWidth]);

          // 按緯度（y座標）分組
          const latGroups = new Map();
          features.forEach((feature) => {
            const lat = feature.geometry.coordinates[1]; // 緯度
            const lon = feature.geometry.coordinates[0]; // 經度
            const value = feature.properties?.value || 0;

            if (!latGroups.has(lat)) {
              latGroups.set(lat, {
                lat,
                lons: [],
                values: [],
              });
            }

            const group = latGroups.get(lat);
            group.lons.push(lon);
            group.values.push(value);
          });

          // 轉換為線條數據
          const lineData = Array.from(latGroups.values()).map((group) => {
            const minLon = Math.min(...group.lons);
            const maxLon = Math.max(...group.lons);
            // 使用該緯度上所有點的平均值或最大值來決定線條顏色和寬度
            const avgValue = group.values.reduce((a, b) => a + b, 0) / group.values.length;
            const maxValueInGroup = Math.max(...group.values);

            return {
              lat: group.lat,
              minLon,
              maxLon,
              avgValue,
              maxValue: maxValueInGroup,
            };
          });

          // 繪製橫線
          const lines = g.selectAll('line.horizontal-line').data(lineData, (d) => d.lat);

          // 進入的線條
          const enterLines = lines
            .enter()
            .append('line')
            .attr('class', 'horizontal-line')
            .attr('opacity', 0.8);

          // 合併進入和更新的線條
          enterLines
            .merge(lines)
            .attr('x1', (d) => {
              const coords = projection([d.minLon, d.lat]);
              return coords ? coords[0] : 0;
            })
            .attr('y1', (d) => {
              const coords = projection([d.minLon, d.lat]);
              return coords ? coords[1] : 0;
            })
            .attr('x2', (d) => {
              const coords = projection([d.maxLon, d.lat]);
              return coords ? coords[0] : 0;
            })
            .attr('y2', (d) => {
              const coords = projection([d.maxLon, d.lat]);
              return coords ? coords[1] : 0;
            })
            .attr('stroke', (d) => colorScale(d.avgValue))
            .attr('stroke-width', (d) => strokeWidthScale(d.maxValue))
            .attr('stroke-linecap', 'round');

          // 移除退出的線條
          lines.exit().remove();

          console.log('[MapTab] 橫線地圖繪製完成，線條數量:', lineData.length);
          console.log('[MapTab] Value 範圍:', minValue, '到', maxValue);
        } catch (error) {
          console.error('[MapTab] 橫線地圖繪製失敗:', error);
        }
      };

      // addCityMarkers 函數已移除 - 不再需要城市標記

      /**
       * 🌍 導航到指定位置
       * 使用方位等距投影，將選定的位置設為地圖中心
       * 地球大小保持不變，只改變旋轉中心
       */
      const navigateToLocation = (center) => {
        if (!svg || !projection) return;

        const rect = mapContainer.value.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;

        // 方位等距投影：使用 rotate 將選定位置旋轉到中心
        // rotate 接受 [lambda, phi, gamma]，其中 lambda 和 phi 是經緯度的負值
        // 地球大小保持固定，不隨導航改變
        // 添加32px padding，確保地圖不會貼邊
        const padding = 32;
        const availableWidth = width - padding * 2;
        const availableHeight = height - padding * 2;
        // 調整縮放比例以顯示整個點數據範圍
        const scale = Math.min(availableWidth, availableHeight) / 0.08;

        projection.rotate([-center[0], -center[1]]).scale(scale);

        // 更新所有橫線的位置
        g.selectAll('line.horizontal-line').attr('x1', (d) => {
          const coords = projection([d.minLon, d.lat]);
          return coords ? coords[0] : 0;
        }).attr('y1', (d) => {
          const coords = projection([d.minLon, d.lat]);
          return coords ? coords[1] : 0;
        }).attr('x2', (d) => {
          const coords = projection([d.maxLon, d.lat]);
          return coords ? coords[0] : 0;
        }).attr('y2', (d) => {
          const coords = projection([d.maxLon, d.lat]);
          return coords ? coords[1] : 0;
        });

        console.log('[MapTab] 地圖導航完成，中心:', center);
      };

      /**
       * 📏 刷新地圖尺寸
       * 當容器大小改變時重新計算地圖尺寸
       */
      const invalidateSize = () => {
        if (!svg || !mapContainer.value) return;

        const rect = mapContainer.value.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;

        svg.attr('width', width).attr('height', height);

        // 添加32px padding，確保地圖不會貼邊
        const padding = 32;
        const availableWidth = width - padding * 2;
        const availableHeight = height - padding * 2;
        // 調整縮放比例以顯示整個點數據範圍
        const scale = Math.min(availableWidth, availableHeight) / 0.08;

        projection.translate([width / 2, height / 2]).scale(scale);

        // 更新所有橫線的位置
        g.selectAll('line.horizontal-line').attr('x1', (d) => {
          const coords = projection([d.minLon, d.lat]);
          return coords ? coords[0] : 0;
        }).attr('y1', (d) => {
          const coords = projection([d.minLon, d.lat]);
          return coords ? coords[1] : 0;
        }).attr('x2', (d) => {
          const coords = projection([d.maxLon, d.lat]);
          return coords ? coords[0] : 0;
        }).attr('y2', (d) => {
          const coords = projection([d.maxLon, d.lat]);
          return coords ? coords[1] : 0;
        });

        console.log('[MapTab] 地圖尺寸更新完成');
      };

      /**
       * 🚀 初始化地圖
       * 創建地圖並載入初始數據
       */
      const initMap = async () => {
        let attempts = 0;
        const maxAttempts = 20;

        // 先載入點數據
        const loaded = await loadPointsData();
        if (!loaded) {
          console.error('[MapTab] 無法載入點數據');
          return;
        }

        const tryCreateMap = async () => {
          if (attempts >= maxAttempts) {
            console.error('[MapTab] 地圖初始化失敗，已達到最大嘗試次數');
            return;
          }

          attempts++;
          console.log(`[MapTab] 嘗試創建地圖 (${attempts}/${maxAttempts})`);

          if (createMap()) {
            console.log('[MapTab] 地圖創建成功，開始繪製點數據地圖');
            await drawPointsMap();
          } else {
            console.log('[MapTab] 地圖創建失敗，100ms 後重試');
            setTimeout(tryCreateMap, 100);
          }
        };

        tryCreateMap();
      };

      // 📏 設置 ResizeObserver 監聽容器大小變化
      let resizeObserver = null;
      let resizeTimeout = null;

      const setupResizeObserver = () => {
        if (!mapContainer.value || !window.ResizeObserver) return;

        resizeObserver = new ResizeObserver(() => {
          if (resizeTimeout) {
            clearTimeout(resizeTimeout);
          }

          resizeTimeout = setTimeout(() => {
            console.log('🔄 容器大小變化，刷新地圖');
            invalidateSize();
          }, 200);
        });

        resizeObserver.observe(mapContainer.value);
        console.log('✅ ResizeObserver 已設置');
      };

      // 🧹 生命週期：組件掛載
      onMounted(() => {
        initMap();
        setupResizeObserver();
      });

      // 🧹 生命週期：組件卸載
      onUnmounted(() => {
        if (resizeTimeout) {
          clearTimeout(resizeTimeout);
        }

        if (resizeObserver) {
          resizeObserver.disconnect();
        }

        if (svg) {
          svg.remove();
          svg = null;
        }

        projection = null;
        path = null;
        zoom = null;
        g = null;
        isMapReady.value = false;
      });

      // 監聽器已移除

      // 📤 返回組件公開的屬性和方法
      return {
        mapContainer,
        mapContainerId,
        navigateToLocation,
      };
    },
  };
</script>

<template>
  <!-- 🗺️ 地圖主容器 -->
  <div id="map-container" class="h-100 w-100 position-relative bg-transparent z-0">
    <!-- 🗺️ D3.js 地圖容器 -->
    <div :id="mapContainerId" ref="mapContainer" class="h-100 w-100"></div>
  </div>
</template>

<style scoped>
  @import '../assets/css/common.css';

  #map-container {
    overflow: hidden;
  }

  /* 距離圓圈使用 D3.js 繪製，包含 5000km 虛線圓圈和地球邊界實線圓圈 */

  :deep(.horizontal-line) {
    transition: stroke-width 0.2s ease, opacity 0.2s ease;
  }

  :deep(.horizontal-line:hover) {
    opacity: 1;
    stroke-width: 4;
  }
</style>
