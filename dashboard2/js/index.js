import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { findMatchedIds, processData } from "./helpers.js";
import { initParkPlanningAreasChart } from "./park-planning-areas-chart.js";
import { initParkLocationsChart } from "./park-locations-chart.js";
import { initParkAreasChart } from "./park-areas-chart.js";
import { initChartTooltip } from "./chart-tooltip.js";

const PARK_LOCATION_GEO_DATA_FILE = "Parks.geojson";
const PARK_AREA_GEO_DATA_FILE = "NParksParksandNatureReserves.geojson";
const PLANNING_AREA_GEO_DATA_FILE =
  "MasterPlan2019PlanningAreaBoundaryNoSea.geojson";

export function initDashboard2({ containerId, dataFolderUrl }) {
  Promise.all([
    d3.json(dataFolderUrl + "/" + PARK_LOCATION_GEO_DATA_FILE),
    d3.json(dataFolderUrl + "/" + PARK_AREA_GEO_DATA_FILE),
    d3.json(dataFolderUrl + "/" + PLANNING_AREA_GEO_DATA_FILE),
  ]).then(function ([
    parkLocationGeoData,
    parkAreaGeoData,
    planningAreaGeoData,
  ]) {
    ////////////////////////////////////////////////////////////
    //// Settings //////////////////////////////////////////////
    ////////////////////////////////////////////////////////////
    let highlightedId = null;

    const dashboardTitle = "\"Resource\": Our Green Space Checklist";

    const dataSources = [
      {
        name: "National Parks Board. (2023). Parks (2024) [Dataset]. data.gov.sg. Retrieved October 28, 2025 from",
        url: "https://data.gov.sg/datasets/d_0542d48f0991541706b58059381a6eca/view",
      },
      {
        name: "National Parks Board. (2023). NParks Parks and Nature Reserves (2024) [Dataset]. data.gov.sg. Retrieved October 28, 2025 from",
        url: "https://data.gov.sg/datasets/d_77d7ec97be83d44f61b85454f844382f/view",
      },
      {
        name: "Urban Redevelopment Authority. (2023). Master Plan 2019 Planning Area Boundary (No Sea) (2024) [Dataset]. data.gov.sg. Retrieved October 28, 2025 from",
        url: "https://data.gov.sg/datasets/d_4765db0e87b9c86336792efe8a1f7a66/view",
      },
    ];

    ////////////////////////////////////////////////////////////
    //// Scaffold dashboard ////////////////////////////////////
    ////////////////////////////////////////////////////////////
    const outerContainer = d3
      .select("#" + containerId)
      .classed("db2", true)
      .on("highlight", highlight);

    const container = outerContainer.append("div").attr("class", "grid");

    const header = container.append("div").attr("class", "header");

    const parkLocationContainer = container
      .append("div")
      .attr("class", "park-locations card");
    
    // Add search box to map container
    parkLocationContainer
      .append("input")
      .attr("type", "search")
      .attr("class", "map-search-box")
      .attr("placeholder", "Search parks...")
      .on("input", search);

    const parkAreasContainer = container
      .append("div")
      .attr("class", "park-areas card");

    const parkPlanningAreasContainer = container
      .append("div")
      .attr("class", "park-planning-areas card");

    const footer = container.append("div").attr("class", "footer");
    footer
      .selectAll("p")
      .data(dataSources)
      .join("p")
      .attr("class", "source")
      .html((d) => `${d.name} <a href="${d.url}" target="_blank">${d.url}</a>`);

    ////////////////////////////////////////////////////////////
    //// Initialize dashboard //////////////////////////////////
    ////////////////////////////////////////////////////////////
    const { tooltipData, searchData } = processData({
      parkLocationGeoData,
      parkAreaGeoData,
      planningAreaGeoData,
    });

    const tooltip = initChartTooltip({
      container: outerContainer,
      data: tooltipData,
    });

    const charts = [
      initParkLocationsChart({
        container: parkLocationContainer,
        tooltip,
        parkLocationGeoData,
        parkAreaGeoData,
        planningAreaGeoData,
      }),
      initParkAreasChart({
        container: parkAreasContainer,
        tooltip,
        parkAreaGeoData,
      }),
      initParkPlanningAreasChart({
        container: parkPlanningAreasContainer,
        tooltip,
        planningAreaGeoData,
      }),
    ];

    function highlight(event) {
      highlightedId = event.detail;
      charts.forEach((chart) => chart.highlight(highlightedId));
    }

    function search(event) {
      const searchTerm = event.target.value.trim().toUpperCase();
      if (searchTerm) {
        const matchedIds = findMatchedIds(searchData, searchTerm);
        charts.forEach((chart) => chart.search(matchedIds));
      } else {
        charts.forEach((chart) => chart.search(null));
      }
    }
  });
}
