# **Dashboard 5: 绿地干预模拟器 (SDG 11.7) \- 开发文档**

## **1\. 核心目标 (Core Objective)**

本仪表板 (Dashboard) 的目标是 **"从'现状分析'转向'未来建议'"**。

它将作为一个动态的决策支持工具，与 **SDG 11 (可持续城市和社区)** 的 **Target 11.7**（提供普遍可及的绿色公共空间）紧密相连。

我们将实现一个 **"诊断 (Diagnosis) \-\> 模拟 (Simulation) \-\> 评估 (Evaluation)"** 的交互闭环。

## **2\. 布局与组件 (Layout & Components)**

页面布局分为两个主要部分：

1. **主面板 (Main Panel) (占 70% 宽度):**  
   * div\#map-container: 用于承载“诊断热点图”和“模拟交互”。  
   * div\#controls: 浮动在地图上方的控制栏。  
2. **侧边栏 (Sidebar Panel) (占 30% 宽度):**  
   * div\#evaluation-panel: 用于承载“评估”部分的实时 KPI 和动态图表。

## **3\. 组件 1: “诊断” \- 绿地短缺热点图**

* **元素 ID:** div\#map-container  
* **目的:** 在地图上可视化“最需要”干预的区域。  
* **数据源:**  
  * sg\_pa.geojson: 新加坡规划区 (Planning Areas) 的地理边界。  
  * pa\_metrics.csv: D3 的数据，包含每个 PA 的**人均绿地 (per\_capita\_green\_space)**。  
  * residential\_distances.csv: D4 的数据，包含住宅区到最近公园的**距离 (distance)**。  
* **开发步骤:**  
  1. **加载数据:** 使用 d3.json 加载 sg\_pa.geojson，使用 d3.csv 加载 pa\_metrics.csv 和 residential\_distances.csv。  
  2. **计算“短缺指数” (Deficit Index):**  
     * 首先，聚合 residential\_distances.csv，计算出每个 PA 的**平均住宅-公园距离 (avg\_distance)**。  
     * 将“人均绿地”和“平均距离”两项指标进行标准化（例如 Min-Max Scaling）。  
     * **注意:** 对于“人均绿地”，我们关心的是“低”值 (越低越差)，所以使用 (1 \- normalized\_per\_capita\_space)。对于“平均距离”，我们关心的是“高”值 (越高越差)，使用 normalized\_avg\_distance。  
     * **指数公式:** Deficit\_Score \= (1 \- norm\_per\_capita\_space) \+ norm\_avg\_distance。  
  3. **渲染地图 (D3.js):**  
     * 使用 D3.js 绘制 sg\_pa.geojson。  
     * 创建一个 d3.scaleSequential 顺序色阶 (如 d3.interpolateYlOrRd)。  
     * 根据每个 PA 的 Deficit\_Score 为其填充颜色（分数越高，颜色越深）。  
  4. **交互:**  
     * 添加 D3 的 mouseover 事件显示工具提示 (Tooltip)，显示该 PA 的具体指数。  
     * 为地图的 svg 元素添加一个 click 事件监听器，用于“模拟”步骤。

## **4\. 组件 2: “模拟” \- 交互式控制**

* **元素 ID:** div\#controls  
* **目的:** 提供用户进行“What-if”分析的工具。  
* **组件:**  
  * \<button id="btn-add-park"\>模式：添加新公园\</button\>  
  * \<button id="btn-reset-sim"\>重置模拟\</button\>  
* **交互逻辑:**  
  1. **全局状态:** 创建一个全局变量 let isAddingPark \= false; 和一个数组 let tempParks \= \[\]; 用于存储模拟中添加的公园。  
  2. **点击 btn-add-park:**  
     * 切换 isAddingPark \= true;。  
     * 按钮高亮，提示用户“请在地图上点击以添加公园”。  
  3. **点击地图 (在 isAddingPark \=== true 时):**  
     * 获取点击位置的地理坐标 \[lng, lat\]。  
     * 使用 prompt() 弹窗，让用户输入新公园的面积（平方米，newArea）。  
     * 创建一个新的 GeoJSON Point Feature：  
       const newParkFeature \= {  
         type: 'Feature',  
         geometry: { type: 'Point', coordinates: \[lng, lat\] },  
         properties: { area\_sqm: newArea, is\_simulated: true }  
       };

     * 将 newParkFeature 添加到 tempParks 数组中。  
     * 调用主更新函数 updateEvaluation(newParkFeature);。  
     * 在地图上用 D3.js 绘制一个临时的圆点 (Circle) 来标记新公园。  
     * 重置 isAddingPark \= false;。  
  4. **点击 btn-reset-sim:**  
     * 清空 tempParks \= \[\];。  
     * 移除地图上所有临时的圆点。  
     * 调用 updateEvaluation(null); 或一个专门的 resetEvaluation(); 函数，使所有 KPI 和图表恢复到初始状态。

## **5\. 组件 3: “评估” \- 实时影响 KPI**

* **元素 ID:** div\#evaluation-panel  
* **目的:** 实时显示“模拟”操作带来的影响。  
* **数据源 (全局加载):**  
  * Parks.geojson: 原始的公园位置（用于合并计算）。  
  * residential\_distances.csv: 假设此文件包含所有住宅区的点坐标（lat, lon）。如果它只有距离，你需要一个**住宅区点集**的 GeoJSON 文件。  
  * population\_by\_pa.csv: PA 的人口。  
* **主更新函数: updateEvaluation(newParkFeature)**  
  * 此函数在添加新公园或重置时被调用，它将触发以下所有子模块的更新。

### **5.1 评估模块一：SDG 11.7 覆盖率 KPI**

* **元素:** div\#kpi-coverage (用于显示百分比)  
* **指标:** 400米（5分钟步行）内有公园的住宅区覆盖率。  
* **Turf.js 关键函数:** turf.nearestPoint(), turf.distance()  
* **更新逻辑:**  
  1. **合并公园数据:**  
     const originalParkFeatures \= Parks.geojson.features;  
     const allParkFeatures \= originalParkFeatures.concat(tempParks);  
     const allParksCollection \= turf.featureCollection(allParkFeatures);

  2. **加载住宅点:** 加载 residential\_distances.csv（或住宅点 GeoJSON）。  
  3. **重新计算覆盖率:**  
     let coveredCount \= 0;  
     const residentialPoints \= \[...\]; // 你所有住宅区的点数据

     residentialPoints.forEach(point \=\> {  
       // 关键计算：找到最近的公园（包括模拟的）  
       const nearest \= turf.nearestPoint(point, allParksCollection);  
       const dist \= turf.distance(point, nearest, { units: 'meters' });

       if (dist \<= 400\) {  
         coveredCount++;  
       }  
     });

     const coveragePercent \= (coveredCount / residentialPoints.length) \* 100;

  4. **更新 DOM:** 使用 D3.js 的 transition() 和 tween() 来实现数字的平滑滚动，更新 div\#kpi-coverage 的 textContent。

### **5.2 评估模块二：人均绿地公平性图表 (D3)**

* **元素:** div\#chart-per-capita (D3 的背离条形图 Diverging Bar Chart)  
* **指标:** 各 PA 的人均绿地与全国平均水平的对比。  
* **Turf.js 关键函数:** turf.booleanPointInPolygon()  
* **更新逻辑:**  
  1. **定位新公园:** 判断 newParkFeature 落在了哪个 PA 内。  
     let targetPA \= null;  
     const planningAreas \= sg\_pa.geojson.features; // 你加载的 PA 边界

     for (const pa of planningAreas) {  
       if (turf.booleanPointInPolygon(newParkFeature.geometry, pa)) {  
         targetPA \= pa.properties.PA\_NAME; // 或 PA\_ID  
         break;  
       }  
     }

  2. **更新数据:**  
     * 找到图表绑定的数据数组中 targetPA 对应的条目。  
     * 将其 total\_green\_area 加上 newParkFeature.properties.area\_sqm。  
     * 重新计算该 PA 的“人均绿地”。  
     * 重新计算“全国人均绿地”平均值。  
  3. **更新 D3 图表:**  
     * 调用 D3 的 join(), update(), transition() 模式。  
     * 使 targetPA 对应的条形**以动画形式增长**，并可能更新其他所有条形（因为全国平均值变化了）。

### **5.3 评估模块三：公园邻近性距离直方图 (D4)**

* **元素:** div\#chart-distance-hist (D3 的直方图)  
* **指标:** 住宅区到最近公园的距离分布。  
* **Turf.js 关键函数:** turf.nearestPoint(), turf.distance()  
* **更新逻辑:**  
  1. **重新计算所有距离:**  
     const allParksCollection \= turf.featureCollection(  
       Parks.geojson.features.concat(tempParks)  
     );  
     const newDistances \= \[\];

     residentialPoints.forEach(point \=\> {  
       const nearest \= turf.nearestPoint(point, allParksCollection);  
       const dist \= turf.distance(point, nearest, { units: 'meters' });  
       newDistances.push(dist);  
     });

  2. **更新 D3 直方图:**  
     * newDistances 数组现在是直方图的新数据源。  
     * 重新计算 D3 的 bins。  
     * 将新 bins 数据绑定到 rect 元素上。  
     * 使用 transition() 更新 rect 的 y 坐标和 height，以显示分布的变化（应看到长距离的柱子变短，短距离的柱子变高）。