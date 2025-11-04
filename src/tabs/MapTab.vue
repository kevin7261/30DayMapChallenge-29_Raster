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
          // 對於點數據，使用更大的縮放比例以便更好地顯示
          const scale = Math.min(availableWidth, availableHeight) / 2;

          projection = d3
            .geoAzimuthalEquidistant()
            .rotate([-120.982025, -23.973875]) // 以台灣地理中心為中心
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

      // 距離圓圈相關變數
      let ringsGroup = null;

      /**
       * 🔵 繪製以投影中心為圓心的同心距離圓
       * 每 5000 公里一圈，淺灰虛線，永遠位於地圖上層
       * 最多繪製到 15000 公里（3 圈）
       * 地球邊界（180°）繪製實線圓圈
       */
      const drawDistanceRings = () => {
        if (!svg || !projection || !mapContainer.value) return;

        const rect = mapContainer.value.getBoundingClientRect();
        const cx = rect.width / 2;
        const cy = rect.height / 2;
        const scale = projection.scale();

        // 地球半徑（公里）
        const earthRadiusMeters = 6371000;
        const stepMeters = 5000000; // 5000 公里
        const maxDistanceMeters = 15000000; // 15000 公里

        const rings = [];
        for (let i = 1; i <= 10; i++) {
          const distanceMeters = stepMeters * i;
          if (distanceMeters > maxDistanceMeters) break;
          const radiusPx = scale * (distanceMeters / earthRadiusMeters);
          rings.push({ index: i, radiusPx, type: 'distance' });
        }

        // 加入地球邊界圓（180° = π * R，在方位等距投影中對應到 scale * π）
        const earthBoundaryRadiusPx = scale * Math.PI;
        rings.push({ index: 999, radiusPx: earthBoundaryRadiusPx, type: 'boundary' });

        if (!ringsGroup) {
          ringsGroup = svg
            .append('g')
            .attr('class', 'distance-rings')
            .style('pointer-events', 'none');
        }

        const selection = ringsGroup.selectAll('circle.ring').data(rings, (d) => d.index);

        selection
          .enter()
          .append('circle')
          .attr('class', 'ring')
          .attr('fill', 'none')
          .merge(selection)
          .attr('cx', cx)
          .attr('cy', cy)
          .attr('r', (d) => d.radiusPx)
          .attr('stroke', (d) => (d.type === 'boundary' ? '#666666' : '#cccccc'))
          .attr('stroke-width', (d) => (d.type === 'boundary' ? 2 : 1))
          .attr('stroke-dasharray', (d) => (d.type === 'boundary' ? 'none' : '6,6'));

        selection.exit().remove();
      };

      /**
       * 🎨 繪製點數據地圖
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

          // 創建顏色比例尺（使用藍色到紅色的漸變）
          const colorScale = d3
            .scaleSequential()
            .domain([minValue, maxValue])
            .interpolator(d3.interpolateViridis);

          // 計算點的大小範圍（根據 value）
          const minRadius = 1;
          const maxRadius = 8;
          const radiusScale = d3
            .scaleLinear()
            .domain([minValue, maxValue])
            .range([minRadius, maxRadius]);

          // 繪製點
          const points = g.selectAll('circle.point').data(features, (d, i) => i);

          // 進入的點
          const enterPoints = points
            .enter()
            .append('circle')
            .attr('class', 'point')
            .attr('opacity', 0.7)
            .attr('stroke', '#fff')
            .attr('stroke-width', 0.5);

          // 合併進入和更新的點
          enterPoints
            .merge(points)
            .attr('cx', (d) => {
              const coords = projection(d.geometry.coordinates);
              return coords ? coords[0] : 0;
            })
            .attr('cy', (d) => {
              const coords = projection(d.geometry.coordinates);
              return coords ? coords[1] : 0;
            })
            .attr('r', (d) => {
              const value = d.properties?.value || 0;
              return radiusScale(value);
            })
            .attr('fill', (d) => {
              const value = d.properties?.value || 0;
              return colorScale(value);
            });

          // 移除退出的點
          points.exit().remove();

          console.log('[MapTab] 點數據地圖繪製完成，點數量:', features.length);
          console.log('[MapTab] Value 範圍:', minValue, '到', maxValue);

          // 繪製距離圓圈
          drawDistanceRings();
        } catch (error) {
          console.error('[MapTab] 點數據地圖繪製失敗:', error);
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
        // 對於點數據，使用更大的縮放比例以便更好地顯示
        const scale = Math.min(availableWidth, availableHeight) / 2;

        projection.rotate([-center[0], -center[1]]).scale(scale);

        // 更新所有點的位置
        g.selectAll('circle.point').attr('cx', (d) => {
          const coords = projection(d.geometry.coordinates);
          return coords ? coords[0] : 0;
        }).attr('cy', (d) => {
          const coords = projection(d.geometry.coordinates);
          return coords ? coords[1] : 0;
        });

        // 更新距離圓圈
        drawDistanceRings();

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
        // 對於點數據，使用更大的縮放比例以便更好地顯示
        const scale = Math.min(availableWidth, availableHeight) / 2;

        projection.translate([width / 2, height / 2]).scale(scale);

        // 更新所有點的位置
        g.selectAll('circle.point').attr('cx', (d) => {
          const coords = projection(d.geometry.coordinates);
          return coords ? coords[0] : 0;
        }).attr('cy', (d) => {
          const coords = projection(d.geometry.coordinates);
          return coords ? coords[1] : 0;
        });

        // 更新距離圓圈
        drawDistanceRings();

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
        ringsGroup = null;
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

  :deep(.point) {
    transition: r 0.2s ease, opacity 0.2s ease;
  }

  :deep(.point:hover) {
    opacity: 1;
    stroke-width: 1;
  }
</style>
