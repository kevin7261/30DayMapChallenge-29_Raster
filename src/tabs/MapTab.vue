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

      // 繪製方向：'y' 表示依y軸（緯度）繪製，'x' 表示依x軸（經度）繪製
      const drawDirection = ref('y');

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

          // 創建defs元素（用於定義filters等）
          let defs = svg.select('defs');
          if (defs.empty()) {
            defs = svg.append('defs');
          }

          // 創建陰影 filter（用於線條投影）
          let shadowFilter = defs.select('#line-shadow-filter');
          if (shadowFilter.empty()) {
            shadowFilter = defs
              .append('filter')
              .attr('id', 'line-shadow-filter')
              .attr('x', '-100%')
              .attr('y', '-100%')
              .attr('width', '300%')
              .attr('height', '300%')
              .attr('filterUnits', 'userSpaceOnUse');

            // 製作柔和陰影（適配 16px 粗線）
            shadowFilter
              .append('feColorMatrix')
              .attr('in', 'SourceAlpha')
              .attr('type', 'matrix')
              .attr('values', '0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.35 0')
              .attr('result', 'alpha');

            shadowFilter
              .append('feGaussianBlur')
              .attr('in', 'alpha')
              .attr('stdDeviation', 4)
              .attr('result', 'blur');

            shadowFilter
              .append('feOffset')
              .attr('in', 'blur')
              .attr('dx', 2)
              .attr('dy', 2)
              .attr('result', 'offsetBlur');

            const feMerge = shadowFilter.append('feMerge');
            feMerge.append('feMergeNode').attr('in', 'offsetBlur');
            feMerge.append('feMergeNode').attr('in', 'SourceGraphic');
          }

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
       * 🎨 繪製點數據地圖 - 按緯度或經度繪製折線圖（每個點高度由value決定）
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

          // 計算 value 的範圍用於顏色映射和高度映射
          const values = features.map((f) => f.properties?.value || 0);
          const minValue = Math.min(...values);
          const maxValue = Math.max(...values);

          // 創建顏色比例尺
          const colorScale = d3
            .scaleSequential()
            .domain([minValue, maxValue])
            .interpolator(d3.interpolateViridis);

          // 線條寬度統一為2px，不再需要動態計算

          // 計算高度比例尺（value 映射到像素高度）
          // 統一使用地圖高度的 10% 作為最大高度偏移（放大2倍：從5%到10%）
          const rect = mapContainer.value.getBoundingClientRect();
          const maxHeightOffset = rect.height * 0.1; // 統一放大2倍
          const heightScale = d3
            .scaleLinear()
            .domain([minValue, maxValue])
            .range([0, maxHeightOffset]);

          // 根據繪製方向分組：'y' 表示依y軸（緯度）繪製，'x' 表示依x軸（經度）繪製
          const groups = new Map();

          features.forEach((feature) => {
            const lat = feature.geometry.coordinates[1]; // 緯度
            const lon = feature.geometry.coordinates[0]; // 經度
            const value = feature.properties?.value || 0;
            const gridY = feature.properties?.grid_y; // 網格Y座標
            const gridX = feature.properties?.grid_x; // 網格X座標

            if (drawDirection.value === 'y') {
              // 按緯度（y座標）分組
              const latKey = gridY !== undefined ? `grid_${gridY}` : Math.round(lat * 100) / 100;

              if (!groups.has(latKey)) {
                groups.set(latKey, {
                  key: latKey,
                  coord: lat, // 緯度代表值
                  gridCoord: gridY, // 網格座標
                  points: [], // 存儲 {lon, lat, value} 對
                  isYAxis: true, // 標記為y軸分組
                });
              }

              const group = groups.get(latKey);
              group.points.push({ lon, lat, value, properties: { ...feature.properties } });
            } else {
              // 按經度（x座標）分組
              const lonKey = gridX !== undefined ? `grid_${gridX}` : Math.round(lon * 100) / 100;

              if (!groups.has(lonKey)) {
                groups.set(lonKey, {
                  key: lonKey,
                  coord: lon, // 經度代表值
                  gridCoord: gridX, // 網格座標
                  points: [], // 存儲 {lon, lat, value} 對
                  isYAxis: false, // 標記為x軸分組
                });
              }

              const group = groups.get(lonKey);
              group.points.push({ lon, lat, value, properties: { ...feature.properties } });
            }
          });

          // 轉換為折線數據：根據繪製方向排序和閉合
          // 畫所有線，不過濾奇數
          const lineData = Array.from(groups.values()).map((group) => {
            // 根據方向排序
            let sortedPoints;
            if (group.isYAxis) {
              // y軸模式：按經度排序（從左到右）
              sortedPoints = group.points.sort((a, b) => a.lon - b.lon);
            } else {
              // x軸模式：按緯度排序（從下到上）
              sortedPoints = group.points.sort((a, b) => a.lat - b.lat);
            }

            // 計算該組上所有點的平均值來決定線條顏色
            const avgValue =
              sortedPoints.reduce((sum, p) => sum + p.value, 0) / sortedPoints.length;
            const maxValueInGroup = Math.max(...sortedPoints.map((p) => p.value));

            // 在頭尾添加基準線上的點（連接到原點）
            const closedPoints = [];

            if (sortedPoints.length > 0) {
              const firstPoint = sortedPoints[0];
              const lastPoint = sortedPoints[sortedPoints.length - 1];

              if (group.isYAxis) {
                // y軸模式：基準是緯度（水平軸）
                // 計算經度間距（相鄰點的經度差）
                const lonStep =
                  sortedPoints.length > 1
                    ? (lastPoint.lon - firstPoint.lon) / (sortedPoints.length - 1)
                    : 0.01; // 如果只有一個點，使用默認值

                // 第一個基準點：第一個點的經度減去一個刻度，基準緯度，value=0
                const firstBasePoint = {
                  lon: firstPoint.lon - lonStep,
                  lat: group.coord,
                  value: 0,
                  isBasePoint: true, // 標記為基準點
                  properties: { ...(firstPoint.properties || {}), value: 0, isBasePoint: true },
                };

                // 最後一個基準點：最後一個點的經度加上一個刻度，基準緯度，value=0
                const lastBasePoint = {
                  lon: lastPoint.lon + lonStep,
                  lat: group.coord,
                  value: 0,
                  isBasePoint: true, // 標記為基準點
                  properties: { ...(lastPoint.properties || {}), value: 0, isBasePoint: true },
                };

                // 第一個基準點 -> 所有數據點 -> 最後一個基準點
                closedPoints.push(firstBasePoint);
                closedPoints.push(...sortedPoints);
                closedPoints.push(lastBasePoint);
              } else {
                // x軸模式：基準是經度（垂直軸）
                // 計算緯度間距（相鄰點的緯度差）
                const latStep =
                  sortedPoints.length > 1
                    ? (lastPoint.lat - firstPoint.lat) / (sortedPoints.length - 1)
                    : 0.01; // 如果只有一個點，使用默認值

                // 第一個基準點：基準經度，第一個點的緯度減去一個刻度，value=0
                const firstBasePoint = {
                  lon: group.coord,
                  lat: firstPoint.lat - latStep,
                  value: 0,
                  isBasePoint: true, // 標記為基準點
                  properties: { ...(firstPoint.properties || {}), value: 0, isBasePoint: true },
                };

                // 最後一個基準點：基準經度，最後一個點的緯度加上一個刻度，value=0
                const lastBasePoint = {
                  lon: group.coord,
                  lat: lastPoint.lat + latStep,
                  value: 0,
                  isBasePoint: true, // 標記為基準點
                  properties: { ...(lastPoint.properties || {}), value: 0, isBasePoint: true },
                };

                // 第一個基準點 -> 所有數據點 -> 最後一個基準點
                closedPoints.push(firstBasePoint);
                closedPoints.push(...sortedPoints);
                closedPoints.push(lastBasePoint);
              }
            }

            return {
              coord: group.coord,
              gridCoord: group.gridCoord,
              isYAxis: group.isYAxis,
              points: sortedPoints,
              closedPoints: closedPoints, // 包含基準點和數據點
              avgValue,
              maxValue: maxValueInGroup,
            };
          });

          // 創建座標到折線顏色的映射，用於點的顏色
          const coordToColorMap = new Map();
          lineData.forEach((line) => {
            const coordKey =
              line.gridCoord !== undefined
                ? `${line.isYAxis ? 'y' : 'x'}_grid_${line.gridCoord}`
                : `${line.isYAxis ? 'y' : 'x'}_${Math.round(line.coord * 100) / 100}`;
            coordToColorMap.set(coordKey, colorScale(line.avgValue));
          });

          // 創建折線生成器（依軸向偏移：y軸向上、x軸向左）
          const lineGenerator = d3
            .line()
            .x((d) => {
              const baseCoords = projection([d.lon, d.lat]);
              if (!baseCoords) return 0;
              // x軸模式：x 座標向左偏移；y軸模式：x 座標正常
              if (drawDirection.value === 'x') {
                return baseCoords[0] - heightScale(d.value);
              }
              return baseCoords[0];
            })
            .y((d) => {
              const baseCoords = projection([d.lon, d.lat]);
              if (!baseCoords) return 0;
              // y軸模式：y 座標向上偏移；x軸模式：y 座標正常
              if (drawDirection.value === 'y') {
                return baseCoords[1] - heightScale(d.value);
              }
              return baseCoords[1];
            })
            .curve(d3.curveCatmullRom.alpha(1)); // 使用 curveCatmullRom.alpha(1)

          // 繪製折線
          const lines = g
            .selectAll('path.horizontal-line')
            .data(lineData, (d) => `${d.isYAxis ? 'y' : 'x'}_${d.coord}`);

          // 移除退出的線條
          lines.exit().remove();

          // 合併進入和更新的線條 - 繪製黃線（數據線，點線樣式）
          const enterLines = lines.enter().append('path').attr('class', 'horizontal-line');

          // 合併後統一設置所有屬性，確保 stroke-width 在 filter 之前設置
          enterLines
            .merge(lines)
            .attr('stroke', '#FFC125') // 金色邊框
            .attr('stroke-width', 16) // 16px寬度（所有線條統一設置）- 必須在 filter 之前
            .attr('stroke-linecap', 'round')
            .attr('stroke-linejoin', 'round')
            .attr('opacity', 0.95)
            .attr('fill', 'none') // 不填充
            .attr('filter', 'url(#line-shadow-filter)') // 陰影效果
            .attr('d', (d) => {
              if (d && d.closedPoints && d.closedPoints.length > 0) {
                // 使用包含數據點和基準點的點（用於繪製黃線）
                return lineGenerator(d.closedPoints);
              }
              return '';
            })
            .style('pointer-events', 'none'); // 折線不攔截鼠標事件

          // 不再單獨繪製黑線，因為已經包含在閉合多邊形中

          // 繪製所有點（包括基準點和數據點）
          // 收集所有 closedPoints 中的點
          const allPoints = [];
          lineData.forEach((line) => {
            if (line.closedPoints && line.closedPoints.length > 0) {
              line.closedPoints.forEach((point) => {
                // 添加點數據，包含必要的屬性
                // 確保點有正確的 lon 和 lat 屬性
                const pointData = {
                  lon: point.lon !== undefined ? point.lon : point.geometry?.coordinates[0],
                  lat: point.lat !== undefined ? point.lat : point.geometry?.coordinates[1],
                  value: point.value !== undefined ? point.value : point.properties?.value || 0,
                  isBasePoint:
                    point.isBasePoint !== undefined
                      ? point.isBasePoint
                      : point.value === 0 || point.properties?.value === 0,
                  // 保留原始 properties，如果没有则使用空对象
                  originalProperties: point.properties || {},
                };
                // 確保 lon 和 lat 是有效的數字
                if (
                  pointData.lon != null &&
                  pointData.lat != null &&
                  !isNaN(pointData.lon) &&
                  !isNaN(pointData.lat)
                ) {
                  // 合并所有 properties，确保包含所有原始属性
                  const allProperties = {
                    ...pointData.originalProperties,
                    value: pointData.value,
                    isBasePoint: pointData.isBasePoint,
                    lon: pointData.lon,
                    lat: pointData.lat,
                  };
                  allPoints.push({
                    lon: pointData.lon,
                    lat: pointData.lat,
                    value: pointData.value,
                    isBasePoint: pointData.isBasePoint,
                    geometry: {
                      coordinates: [pointData.lon, pointData.lat],
                    },
                    properties: allProperties,
                  });
                }
              });
            }
          });

          console.log(
            `[MapTab] 繪製方向: ${drawDirection.value}, 收集到的點數量: ${allPoints.length}, 線條數量: ${lineData.length}`
          );

          // 創建或獲取點組
          let pointsGroup = g.select('g.points-group');
          if (pointsGroup.empty()) {
            pointsGroup = g.append('g').attr('class', 'points-group');
          }

          // 選擇所有點
          // 使用更唯一的鍵來識別點（包括經緯度和value，避免重複）
          const points = pointsGroup.selectAll('circle.data-point').data(allPoints, (d, i) => {
            const lon = d.geometry.coordinates[0];
            const lat = d.geometry.coordinates[1];
            const value = d.properties?.value || 0;
            const isBasePoint = d.properties?.isBasePoint || false;
            return `${drawDirection.value}_${lon}_${lat}_${value}_${isBasePoint}_${i}`;
          });

          // 進入的點
          const enterPoints = points
            .enter()
            .append('circle')
            .attr('class', 'data-point')
            .attr('r', 3)
            .style('pointer-events', 'all')
            .style('cursor', 'pointer')
            .on('mouseover', function (event, d) {
              const tooltip = d3.select('.map-tooltip');
              const props = d.properties || {};
              // 按鍵名排序，確保顯示順序一致
              const sortedEntries = Object.entries(props).sort(([a], [b]) => a.localeCompare(b));
              const rows = sortedEntries
                .map(([k, v]) => {
                  let displayValue;
                  if (v === null || v === undefined) {
                    displayValue = 'null';
                  } else if (typeof v === 'number') {
                    displayValue = Number.isInteger(v) ? v.toString() : v.toFixed(3);
                  } else if (typeof v === 'object') {
                    displayValue = JSON.stringify(v);
                  } else {
                    displayValue = String(v);
                  }
                  return `<div style="margin: 2px 0;"><b>${k}</b>: ${displayValue}</div>`;
                })
                .join('');
              tooltip
                .style('display', 'block')
                .style('visibility', 'visible')
                .style('opacity', '1')
                .html(rows || '<i>No properties</i>')
                .style('left', event.pageX + 10 + 'px')
                .style('top', event.pageY - 10 + 'px');
            })
            .on('mousemove', function (event) {
              const tooltip = d3.select('.map-tooltip');
              tooltip.style('left', event.pageX + 10 + 'px').style('top', event.pageY - 10 + 'px');
            })
            .on('mouseout', function () {
              const tooltip = d3.select('.map-tooltip');
              tooltip.style('opacity', '0').style('display', 'none').style('visibility', 'hidden');
            });

          // 合併進入和更新的點
          enterPoints
            .merge(points)
            .attr('cx', (d) => {
              const lon = d.geometry.coordinates[0];
              const lat = d.geometry.coordinates[1];
              const coords = projection([lon, lat]);
              if (!coords || isNaN(coords[0]) || isNaN(coords[1])) {
                console.warn(`[MapTab] 無法投影點: lon=${lon}, lat=${lat}`);
                return 0;
              }

              // x軸模式：x 座標向左偏移；y軸模式：x 座標正常
              const value = d.properties?.value || 0;
              if (drawDirection.value === 'x') {
                return coords[0] - heightScale(value);
              }
              return coords[0];
            })
            .attr('cy', (d) => {
              const lon = d.geometry.coordinates[0];
              const lat = d.geometry.coordinates[1];
              const coords = projection([lon, lat]);
              if (!coords || isNaN(coords[0]) || isNaN(coords[1])) {
                return 0;
              }

              // y軸模式：y 座標向上偏移；x軸模式：y 座標正常
              const value = d.properties?.value || 0;
              if (drawDirection.value === 'y') {
                return coords[1] - heightScale(value);
              }
              return coords[1];
            })
            .attr('fill', (d) => {
              const value = d.properties?.value || 0;
              const isBasePoint = d.properties?.isBasePoint || value === 0;
              // 基準點（前後添加的點）畫黑色，數據點畫金色
              return isBasePoint ? '#000000' : '#FFC125';
            })
            .attr('stroke', '#fff') // 所有點都用白色邊框
            .attr('stroke-width', 1)
            .attr('opacity', 0.95)
            .on('mouseover', function (event, d) {
              const tooltip = d3.select('.map-tooltip');
              const props = d.properties || {};
              // 按鍵名排序，確保顯示順序一致
              const sortedEntries = Object.entries(props).sort(([a], [b]) => a.localeCompare(b));
              const rows = sortedEntries
                .map(([k, v]) => {
                  let displayValue;
                  if (v === null || v === undefined) {
                    displayValue = 'null';
                  } else if (typeof v === 'number') {
                    displayValue = Number.isInteger(v) ? v.toString() : v.toFixed(3);
                  } else if (typeof v === 'object') {
                    displayValue = JSON.stringify(v);
                  } else {
                    displayValue = String(v);
                  }
                  return `<div style="margin: 2px 0;"><b>${k}</b>: ${displayValue}</div>`;
                })
                .join('');
              tooltip
                .style('display', 'block')
                .style('visibility', 'visible')
                .style('opacity', '1')
                .html(rows || '<i>No properties</i>')
                .style('left', event.pageX + 10 + 'px')
                .style('top', event.pageY - 10 + 'px');
            })
            .on('mousemove', function (event) {
              const tooltip = d3.select('.map-tooltip');
              tooltip.style('left', event.pageX + 10 + 'px').style('top', event.pageY - 10 + 'px');
            })
            .on('mouseout', function () {
              const tooltip = d3.select('.map-tooltip');
              tooltip.style('opacity', '0').style('display', 'none').style('visibility', 'hidden');
            });

          // 移除退出的點
          points.exit().remove();

          // 確保所有點都有hover事件（包括新進入和更新的點）
          pointsGroup
            .selectAll('circle.data-point')
            .on('mouseover', function (event, d) {
              const tooltip = d3.select('.map-tooltip');
              const props = d.properties || {};
              // 按鍵名排序，確保顯示順序一致
              const sortedEntries = Object.entries(props).sort(([a], [b]) => a.localeCompare(b));
              const rows = sortedEntries
                .map(([k, v]) => {
                  let displayValue;
                  if (v === null || v === undefined) {
                    displayValue = 'null';
                  } else if (typeof v === 'number') {
                    displayValue = Number.isInteger(v) ? v.toString() : v.toFixed(3);
                  } else if (typeof v === 'object') {
                    displayValue = JSON.stringify(v);
                  } else {
                    displayValue = String(v);
                  }
                  return `<div style="margin: 2px 0;"><b>${k}</b>: ${displayValue}</div>`;
                })
                .join('');
              tooltip
                .style('display', 'block')
                .style('visibility', 'visible')
                .style('opacity', '1')
                .html(rows || '<i>No properties</i>')
                .style('left', event.pageX + 10 + 'px')
                .style('top', event.pageY - 10 + 'px');
            })
            .on('mousemove', function (event) {
              const tooltip = d3.select('.map-tooltip');
              tooltip.style('left', event.pageX + 10 + 'px').style('top', event.pageY - 10 + 'px');
            })
            .on('mouseout', function () {
              const tooltip = d3.select('.map-tooltip');
              tooltip.style('opacity', '0').style('display', 'none').style('visibility', 'hidden');
            });

          // 創建tooltip元素（如果不存在）
          let tooltip = d3.select('body').select('.map-tooltip');
          if (tooltip.empty()) {
            tooltip = d3
              .select('body')
              .append('div')
              .attr('class', 'map-tooltip')
              .style('position', 'fixed') // 使用fixed而不是absolute
              .style('padding', '10px 14px')
              .style('background', 'rgba(0, 0, 0, 0.9)')
              .style('color', '#fff')
              .style('border-radius', '6px')
              .style('font-size', '13px')
              .style('font-family', 'system-ui, -apple-system, sans-serif')
              .style('pointer-events', 'none')
              .style('opacity', '0')
              .style('display', 'none')
              .style('visibility', 'hidden')
              .style('z-index', '99999')
              .style('box-shadow', '0 4px 12px rgba(0,0,0,0.4)')
              .style('transition', 'opacity 0.2s ease')
              .style('line-height', '1.6')
              .style('max-width', '300px')
              .style('white-space', 'normal')
              .style('word-wrap', 'break-word');

            console.log('[MapTab] Tooltip element created'); // 調試日誌
          } else {
            console.log('[MapTab] Tooltip element already exists'); // 調試日誌
          }

          // 保留點圖層，避免在繪製後被移除

          console.log('[MapTab] 折線圖地圖繪製完成，線條數量:', lineData.length);
          console.log('[MapTab] 點數量:', features.length);
          console.log('[MapTab] Value 範圍:', minValue, '到', maxValue);
          console.log('[MapTab] 高度偏移範圍: 0 到', maxHeightOffset, 'px');
        } catch (error) {
          console.error('[MapTab] 折線圖地圖繪製失敗:', error);
        }
      };

      // addCityMarkers 函數已移除 - 不再需要城市標記

      /**
       * 🔄 更新折線路徑（用於投影變化後更新折線位置）
       */
      const updateLinePaths = () => {
        if (!g || !pointsData.value || !projection) return;

        const features = pointsData.value.features || [];
        if (features.length === 0) return;

        // 計算 value 的範圍用於高度映射
        const values = features.map((f) => f.properties?.value || 0);
        const minValue = Math.min(...values);
        const maxValue = Math.max(...values);

        // 計算高度比例尺（統一放大2倍）
        const rect = mapContainer.value.getBoundingClientRect();
        const maxHeightOffset = rect.height * 0.1; // 統一放大2倍
        const heightScale = d3
          .scaleLinear()
          .domain([minValue, maxValue])
          .range([0, maxHeightOffset]);

        // 創建折線生成器（x軸和y軸都使用相同的偏移方向：向上）
        const lineGenerator = d3
          .line()
          .x((d) => {
            const baseCoords = projection([d.lon, d.lat]);
            if (!baseCoords) return 0;
            // x軸和y軸模式：x座標都正常（不偏移）
            return baseCoords[0];
          })
          .y((d) => {
            const baseCoords = projection([d.lon, d.lat]);
            if (!baseCoords) return 0;
            // x軸和y軸模式：y座標都向上偏移（y減少），value越大，點越高
            return baseCoords[1] - heightScale(d.value);
          })
          .curve(d3.curveCatmullRom.alpha(1)); // 使用 curveCatmullRom.alpha(1)

        // 更新所有折線路徑（從綁定的數據中獲取closedPoints）
        const allLines = g.selectAll('path.horizontal-line');

        // 確保 stroke-width 在 filter 之前設置，避免 filter 影響線條寬度
        allLines
          .attr('stroke', '#FFC125') // 確保顏色一致
          .attr('stroke-width', 16) // 首先設置所有線條為16px - 必須在 filter 之前
          .attr('stroke-linecap', 'round')
          .attr('stroke-linejoin', 'round')
          .attr('opacity', 0.95)
          .attr('fill', 'none')
          .attr('filter', 'url(#line-shadow-filter)') // 陰影效果
          .attr('d', (d) => {
            if (d && d.closedPoints && d.closedPoints.length > 0) {
              return lineGenerator(d.closedPoints);
            } else if (d && d.points) {
              // 如果沒有closedPoints，則直接使用points（不閉合）
              return lineGenerator(d.points);
            }
            return '';
          })
          .style('pointer-events', 'none');

        // 不再單獨更新黑線，因為已經包含在閉合多邊形中

        // 更新所有點的位置
        const allPoints = [];
        g.selectAll('path.horizontal-line').each(function (d) {
          if (d && d.closedPoints && d.closedPoints.length > 0) {
            d.closedPoints.forEach((point) => {
              // 確保點有正確的 lon 和 lat 屬性
              const pointData = {
                lon: point.lon !== undefined ? point.lon : point.geometry?.coordinates[0],
                lat: point.lat !== undefined ? point.lat : point.geometry?.coordinates[1],
                value: point.value !== undefined ? point.value : point.properties?.value || 0,
                isBasePoint:
                  point.isBasePoint !== undefined
                    ? point.isBasePoint
                    : point.value === 0 || point.properties?.value === 0,
                // 保留原始 properties，如果没有则使用空对象
                originalProperties: point.properties || {},
              };
              // 確保 lon 和 lat 是有效的數字
              if (
                pointData.lon != null &&
                pointData.lat != null &&
                !isNaN(pointData.lon) &&
                !isNaN(pointData.lat)
              ) {
                // 合并所有 properties，确保包含所有原始属性
                const allProperties = {
                  ...pointData.originalProperties,
                  value: pointData.value,
                  isBasePoint: pointData.isBasePoint,
                  lon: pointData.lon,
                  lat: pointData.lat,
                };
                allPoints.push({
                  lon: pointData.lon,
                  lat: pointData.lat,
                  value: pointData.value,
                  isBasePoint: pointData.isBasePoint,
                  geometry: {
                    coordinates: [pointData.lon, pointData.lat],
                  },
                  properties: allProperties,
                });
              }
            });
          }
        });

        // 獲取或創建點組
        let pointsGroup = g.select('g.points-group');
        if (pointsGroup.empty()) {
          pointsGroup = g.append('g').attr('class', 'points-group');
        }

        // 更新點的位置
        // 使用更唯一的鍵來識別點（包括經緯度和value，避免重複）
        const points = pointsGroup.selectAll('circle.data-point').data(allPoints, (d, i) => {
          const lon = d.geometry.coordinates[0];
          const lat = d.geometry.coordinates[1];
          const value = d.properties?.value || 0;
          const isBasePoint = d.properties?.isBasePoint || false;
          return `${drawDirection.value}_${lon}_${lat}_${value}_${isBasePoint}_${i}`;
        });

        // 進入的點
        const enterPoints = points
          .enter()
          .append('circle')
          .attr('class', 'data-point')
          .attr('r', 3)
          .style('pointer-events', 'all')
          .style('cursor', 'pointer')
          .on('mouseover', function (event, d) {
            const tooltip = d3.select('.map-tooltip');
            const props = d.properties || {};
            const rows = Object.entries(props)
              .map(
                ([k, v]) =>
                  `<div><b>${k}</b>: ${typeof v === 'number' ? v.toFixed(3) : String(v)}</div>`
              )
              .join('');
            tooltip
              .style('display', 'block')
              .style('visibility', 'visible')
              .style('opacity', '1')
              .html(rows || '<i>No properties</i>')
              .style('left', event.pageX + 10 + 'px')
              .style('top', event.pageY - 10 + 'px');
          })
          .on('mousemove', function (event) {
            const tooltip = d3.select('.map-tooltip');
            tooltip.style('left', event.pageX + 10 + 'px').style('top', event.pageY - 10 + 'px');
          })
          .on('mouseout', function () {
            const tooltip = d3.select('.map-tooltip');
            tooltip.style('opacity', '0').style('display', 'none').style('visibility', 'hidden');
          });

        // 合併進入和更新的點
        enterPoints
          .merge(points)
          .attr('cx', (d) => {
            const lon = d.geometry.coordinates[0];
            const lat = d.geometry.coordinates[1];
            const coords = projection([lon, lat]);
            if (!coords || isNaN(coords[0]) || isNaN(coords[1])) {
              return 0;
            }

            const value = d.properties?.value || 0;
            // x軸模式：x 向左偏移；y軸模式：x 不偏移
            if (drawDirection.value === 'x') {
              return coords[0] - heightScale(value);
            }
            return coords[0];
          })
          .attr('cy', (d) => {
            const lon = d.geometry.coordinates[0];
            const lat = d.geometry.coordinates[1];
            const coords = projection([lon, lat]);
            if (!coords || isNaN(coords[0]) || isNaN(coords[1])) {
              return 0;
            }

            const value = d.properties?.value || 0;
            // y軸模式：y 向上偏移；x軸模式：y 不偏移
            if (drawDirection.value === 'y') {
              return coords[1] - heightScale(value);
            }
            return coords[1];
          })
          .attr('fill', (d) => {
            const value = d.properties?.value || 0;
            const isBasePoint = d.properties?.isBasePoint || value === 0;
            return isBasePoint ? '#000000' : '#FFC125';
          })
          .attr('stroke', '#fff')
          .attr('stroke-width', 1)
          .attr('opacity', 0.95)
          .on('mouseover', function (event, d) {
            const tooltip = d3.select('.map-tooltip');
            const props = d.properties || {};
            const rows = Object.entries(props)
              .map(
                ([k, v]) =>
                  `<div><b>${k}</b>: ${typeof v === 'number' ? v.toFixed(3) : String(v)}</div>`
              )
              .join('');
            tooltip
              .style('display', 'block')
              .style('visibility', 'visible')
              .style('opacity', '1')
              .html(rows || '<i>No properties</i>')
              .style('left', event.pageX + 10 + 'px')
              .style('top', event.pageY - 10 + 'px');
          })
          .on('mousemove', function (event) {
            const tooltip = d3.select('.map-tooltip');
            tooltip.style('left', event.pageX + 10 + 'px').style('top', event.pageY - 10 + 'px');
          })
          .on('mouseout', function () {
            const tooltip = d3.select('.map-tooltip');
            tooltip.style('opacity', '0').style('display', 'none').style('visibility', 'hidden');
          });

        // 移除退出的點
        points.exit().remove();
      };

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

        // 更新所有折線的位置
        updateLinePaths();

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

        // 更新所有折線的位置
        updateLinePaths();

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

        // 清理tooltip
        d3.select('body').select('.map-tooltip').remove();

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

      /**
       * 🔄 切換繪製方向
       */
      const toggleDrawDirection = (direction) => {
        drawDirection.value = direction;
        // 重新繪製地圖
        if (g && pointsData.value) {
          // 清除現有的線條和點組
          g.selectAll('path.horizontal-line').remove();
          g.selectAll('g.points-group').remove();
          // 重新繪製
          drawPointsMap();
        }
      };

      // 📤 返回組件公開的屬性和方法
      return {
        mapContainer,
        mapContainerId,
        navigateToLocation,
        drawDirection,
        toggleDrawDirection,
      };
    },
  };
</script>

<template>
  <!-- 🗺️ 地圖主容器 -->
  <div id="map-container" class="h-100 w-100 position-relative bg-transparent z-0">
    <!-- 🗺️ D3.js 地圖容器 -->
    <div :id="mapContainerId" ref="mapContainer" class="h-100 w-100"></div>

    <!-- 🎛️ 左側中間控制面板 -->
    <div
      class="position-absolute"
      style="top: 50%; left: 0; transform: translateY(-50%); z-index: 1000; padding: 1rem"
    >
      <div class="bg-dark bg-opacity-75 rounded-3 p-3">
        <!-- 🎛️ 繪製方向選擇區域 -->
        <div class="">
          <div class="d-flex flex-column gap-1">
            <button
              type="button"
              class="btn border-0 my-country-btn my-font-sm-white px-4 py-3"
              :class="[drawDirection === 'y' ? 'active' : '']"
              @click="toggleDrawDirection('y')"
            >
              依Y軸繪製
            </button>
            <button
              type="button"
              class="btn border-0 my-country-btn my-font-sm-white px-4 py-3"
              :class="[drawDirection === 'x' ? 'active' : '']"
              @click="toggleDrawDirection('x')"
            >
              依X軸繪製
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  @import '../assets/css/common.css';

  #map-container {
    overflow: hidden;
  }

  /* 距離圓圈使用 D3.js 繪製，包含 5000km 虛線圓圈和地球邊界實線圓圈 */

  :deep(.horizontal-line) {
    /* 預設 16px */
    stroke-width: 16;
    transition:
      stroke-width 0.2s ease,
      opacity 0.2s ease;
  }

  :deep(.horizontal-line:hover) {
    opacity: 1;
    /* hover 同為 16px（不變粗） */
    stroke-width: 16;
  }

  /* 點hover效果 */
  :deep(.data-point) {
    transition:
      r 0.2s ease,
      opacity 0.2s ease,
      stroke-width 0.2s ease;
  }

  :deep(.data-point:hover) {
    cursor: pointer;
  }
</style>

<style>
  /* 全域tooltip樣式 */
  .map-tooltip {
    position: absolute;
    padding: 10px 14px;
    background: rgba(0, 0, 0, 0.85);
    color: #fff;
    border-radius: 6px;
    font-size: 13px;
    font-family:
      system-ui,
      -apple-system,
      sans-serif;
    pointer-events: none;
    opacity: 0;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    transition: opacity 0.2s ease;
    white-space: nowrap;
    line-height: 1.6;
  }
</style>
