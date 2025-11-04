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
            `${process.env.BASE_URL}data/twdtm100_points_pixel_aggregated_100.geojson`
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
          // 統一使用地圖高度的 7.5% 作為最大高度偏移（放大1.5倍：從5%到7.5%）
          const rect = mapContainer.value.getBoundingClientRect();
          const maxHeightOffset = rect.height * 0.075; // 統一放大1.5倍
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
              group.points.push({ lon, lat, value });
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
              group.points.push({ lon, lat, value });
            }
          });

          // 轉換為折線數據：根據繪製方向排序和閉合
          // 過濾掉grid座標為奇數的線（只保留偶數）
          const lineData = Array.from(groups.values())
            .filter((group) => {
              // 如果grid座標是單數（奇數），則過濾掉
              if (group.gridCoord !== undefined) {
                return group.gridCoord % 2 === 0; // 只保留偶數
              }
              // 如果沒有grid座標，則保留
              return true;
            })
            .map((group) => {
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

              // 不閉合頭尾，直接使用所有點
              const closedPoints = [...sortedPoints];

              return {
                coord: group.coord, // 座標代表值（緯度或經度）
                gridCoord: group.gridCoord, // 網格座標
                isYAxis: group.isYAxis, // 是否為y軸模式
                points: sortedPoints, // 原始點（用於tooltip）
                closedPoints: closedPoints, // 閉合的點（用於繪製）
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

          // 創建折線生成器（根據繪製方向調整高度偏移）
          const lineGenerator = d3
            .line()
            .x((d) => {
              const baseCoords = projection([d.lon, d.lat]);
              if (!baseCoords) return 0;
              // y軸模式：x座標正常
              // x軸模式：x座標向右偏移（x增加），value越大，點越右
              if (drawDirection.value === 'x') {
                return baseCoords[0] + heightScale(d.value);
              }
              return baseCoords[0];
            })
            .y((d) => {
              const baseCoords = projection([d.lon, d.lat]);
              if (!baseCoords) return 0;
              // y軸模式：y座標向上偏移（y減少），value越大，點越高
              // x軸模式：y座標正常
              if (drawDirection.value === 'y') {
                return baseCoords[1] - heightScale(d.value);
              }
              return baseCoords[1];
            })
            .curve(d3.curveBasis); // 使用B-spline曲線

          // 繪製折線
          const lines = g
            .selectAll('path.horizontal-line')
            .data(lineData, (d) => `${d.isYAxis ? 'y' : 'x'}_${d.coord}`);

          // 進入的線條
          const enterLines = lines
            .enter()
            .append('path')
            .attr('class', 'horizontal-line')
            .attr('opacity', 0.8)
            .attr('fill', 'none')
            .style('pointer-events', 'none'); // 折線不攔截鼠標事件，讓點可以接收事件

          // 合併進入和更新的線條 - 使用有質感的金色，4px寬度
          enterLines
            .merge(lines)
            .attr('d', (d) => lineGenerator(d.closedPoints)) // 使用閉合的點
            .attr('stroke', '#FFC125') // 更亮的金色（Goldenrod）
            .attr('stroke-width', 4) // 統一4px
            .attr('stroke-linecap', 'round')
            .attr('stroke-linejoin', 'round')
            .attr('opacity', 0.95)
            .attr('fill', 'none') // 不填充
            .style('pointer-events', 'none'); // 折線不攔截鼠標事件

          // 移除退出的線條
          lines.exit().remove();

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
              .style('white-space', 'nowrap')
              .style('line-height', '1.6')
              .style('max-width', '200px');

            console.log('[MapTab] Tooltip element created'); // 調試日誌
          } else {
            console.log('[MapTab] Tooltip element already exists'); // 調試日誌
          }

          // 繪製點並添加hover效果
          // 確保點在折線之上，使用一個新的group（如果不存在則創建）
          let pointsGroup = g.select('g.points-group');
          if (pointsGroup.empty()) {
            pointsGroup = g.append('g').attr('class', 'points-group');
          }

          const points = pointsGroup.selectAll('circle.data-point').data(features, (d) => {
            // 使用經緯度作為唯一標識
            return `${d.geometry.coordinates[0]}_${d.geometry.coordinates[1]}`;
          });

          // 定義hover事件處理函數
          const handleMouseover = function (event, d) {
            event.stopPropagation();

            const value = d.properties?.value || 0;
            const lat = d.geometry.coordinates[1];
            const lon = d.geometry.coordinates[0];

            console.log('[MapTab] Mouseover triggered, value:', value); // 調試日誌

            // 計算tooltip位置，避免超出視窗邊界
            const tooltipWidth = 180;
            const tooltipHeight = 80;
            const padding = 10;
            let left = event.pageX + padding;
            let top = event.pageY - padding;

            // 如果超出右邊界，顯示在左側
            if (left + tooltipWidth > window.innerWidth) {
              left = event.pageX - tooltipWidth - padding;
            }

            // 如果超出下邊界，顯示在上方
            if (top + tooltipHeight > window.innerHeight) {
              top = event.pageY - tooltipHeight - padding;
            }

            // 如果超出左邊界，顯示在右側
            if (left < 0) {
              left = padding;
            }

            // 如果超出上邊界，顯示在下方
            if (top < 0) {
              top = event.pageY + padding;
            }

            // 顯示tooltip - 使用更簡單直接的方式
            const tooltipNode = tooltip.node();
            if (!tooltipNode) {
              console.error('[MapTab] Tooltip element not found!');
              return;
            }

            tooltip
              .html(
                `<div style="font-weight: 600; margin-bottom: 4px;">Value: <span style="color: #4dd0e1;">${value.toFixed(2)}</span></div>
                 <div style="font-size: 11px; color: #ccc;">緯度: ${lat.toFixed(4)}</div>
                 <div style="font-size: 11px; color: #ccc;">經度: ${lon.toFixed(4)}</div>`
              )
              .style('left', left + 'px')
              .style('top', top + 'px');

            // 強制顯示tooltip
            tooltipNode.style.display = 'block';
            tooltipNode.style.visibility = 'visible';
            tooltipNode.style.opacity = '1';
            tooltipNode.style.zIndex = '99999';

            console.log('[MapTab] Tooltip shown at:', left, top); // 調試日誌

            // 點不可見，不需要高亮效果
          };

          const handleMousemove = function (event) {
            event.stopPropagation();
            // 計算tooltip位置，避免超出視窗邊界
            const tooltipWidth = 180;
            const tooltipHeight = 80;
            const padding = 10;
            let left = event.pageX + padding;
            let top = event.pageY - padding;

            if (left + tooltipWidth > window.innerWidth) {
              left = event.pageX - tooltipWidth - padding;
            }
            if (top + tooltipHeight > window.innerHeight) {
              top = event.pageY - tooltipHeight - padding;
            }
            if (left < 0) {
              left = padding;
            }
            if (top < 0) {
              top = event.pageY + padding;
            }

            const tooltipNode = tooltip.node();
            if (tooltipNode) {
              tooltipNode.style.left = left + 'px';
              tooltipNode.style.top = top + 'px';
            }
          };

          const handleMouseout = function () {
            const tooltipNode = tooltip.node();
            if (tooltipNode) {
              tooltipNode.style.opacity = '0';
              setTimeout(() => {
                tooltipNode.style.display = 'none';
                tooltipNode.style.visibility = 'hidden';
              }, 200);
            }

            // 點不可見，不需要恢復樣式
          };

          // 進入的點，不顯示但保留hover功能
          const enterPoints = points
            .enter()
            .append('circle')
            .attr('class', 'data-point')
            .attr('r', 8) // 增大hover區域到8，更容易hover
            .attr('fill', 'transparent') // 透明，不顯示
            .attr('stroke', 'none') // 無邊框
            .attr('opacity', 0) // 完全透明
            .style('cursor', 'pointer')
            .style('pointer-events', 'all') // 確保可以接收事件
            .on('mouseover', handleMouseover)
            .on('mousemove', handleMousemove)
            .on('mouseout', handleMouseout);

          // 合併進入和更新的點（不顯示，但保留hover功能）
          const allPoints = enterPoints
            .merge(points)
            .attr('cx', (d) => {
              const baseCoords = projection([d.geometry.coordinates[0], d.geometry.coordinates[1]]);
              if (!baseCoords) return 0;
              const value = d.properties?.value || 0;
              // y軸模式：x座標正常
              // x軸模式：x座標向右偏移（x增加），value越大，點越右
              if (drawDirection.value === 'x') {
                return baseCoords[0] + heightScale(value);
              }
              return baseCoords[0];
            })
            .attr('cy', (d) => {
              const baseCoords = projection([d.geometry.coordinates[0], d.geometry.coordinates[1]]);
              if (!baseCoords) return 0;
              const value = d.properties?.value || 0;
              // y軸模式：y座標向上偏移（y減少），value越大，點越高
              // x軸模式：y座標正常
              if (drawDirection.value === 'y') {
                return baseCoords[1] - heightScale(value);
              }
              return baseCoords[1];
            })
            .attr('fill', 'transparent') // 透明，不顯示
            .attr('stroke', 'none') // 無邊框
            .attr('opacity', 0) // 完全透明
            .attr('r', 8) // 確保合併後的點也是較大的半徑（hover區域）
            .style('pointer-events', 'all') // 確保可以接收事件
            .style('cursor', 'pointer');

          // 確保所有點都有事件綁定（包括更新的點）
          allPoints
            .on('mouseover', handleMouseover)
            .on('mousemove', handleMousemove)
            .on('mouseout', handleMouseout);

          // 移除退出的點
          points.exit().remove();

          console.log('[MapTab] 折線圖地圖繪製完成，線條數量:', lineData.length);
          console.log('[MapTab] 點數量:', features.length);
          console.log('[MapTab] Value 範圍:', minValue, '到', maxValue);
          console.log('[MapTab] 高度偏移範圍: 0 到', maxHeightOffset, 'px');
          console.log('[MapTab] 點已繪製，請嘗試點擊圓點查看 alert，或懸停查看 tooltip');
          console.log('[MapTab] 點的 pointer-events:', allPoints.style('pointer-events'));
          console.log('[MapTab] 點的 cursor:', allPoints.style('cursor'));
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

        // 計算高度比例尺（統一放大1.5倍）
        const rect = mapContainer.value.getBoundingClientRect();
        const maxHeightOffset = rect.height * 0.075; // 統一放大1.5倍
        const heightScale = d3
          .scaleLinear()
          .domain([minValue, maxValue])
          .range([0, maxHeightOffset]);

        // 創建折線生成器（根據繪製方向調整高度偏移）
        const lineGenerator = d3
          .line()
          .x((d) => {
            const baseCoords = projection([d.lon, d.lat]);
            if (!baseCoords) return 0;
            // y軸模式：x座標正常
            // x軸模式：x座標向右偏移（x增加），value越大，點越右
            if (drawDirection.value === 'x') {
              return baseCoords[0] + heightScale(d.value);
            }
            return baseCoords[0];
          })
          .y((d) => {
            const baseCoords = projection([d.lon, d.lat]);
            if (!baseCoords) return 0;
            // y軸模式：y座標向上偏移（y減少），value越大，點越高
            // x軸模式：y座標正常
            if (drawDirection.value === 'y') {
              return baseCoords[1] - heightScale(d.value);
            }
            return baseCoords[1];
          })
          .curve(d3.curveBasis); // 使用B-spline曲線

        // 更新所有折線路徑（從綁定的數據中獲取closedPoints）
        g.selectAll('path.horizontal-line').attr('d', (d) => {
          if (d && d.closedPoints) {
            return lineGenerator(d.closedPoints);
          } else if (d && d.points) {
            // 如果沒有closedPoints，則直接使用points（不閉合）
            return lineGenerator(d.points);
          }
          return '';
        });

        // 更新所有點的位置
        g.select('g.points-group')
          .selectAll('circle.data-point')
          .attr('cx', (d) => {
            const coords = projection([d.geometry.coordinates[0], d.geometry.coordinates[1]]);
            return coords ? coords[0] : 0;
          })
          .attr('cy', (d) => {
            const baseCoords = projection([d.geometry.coordinates[0], d.geometry.coordinates[1]]);
            if (!baseCoords) return 0;
            const value = d.properties?.value || 0;
            return baseCoords[1] - heightScale(value);
          });
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
          // 清除現有的線條和點
          g.selectAll('path.horizontal-line').remove();
          g.selectAll('circle.data-point').remove();
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
    transition:
      stroke-width 0.2s ease,
      opacity 0.2s ease;
  }

  :deep(.horizontal-line:hover) {
    opacity: 1;
    stroke-width: 4;
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
