import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

export function initParkAreasChart({ container, tooltip, parkAreaGeoData }) {
  ////////////////////////////////////////////////////////////
  //// Settings //////////////////////////////////////////////
  ////////////////////////////////////////////////////////////
  let width, dotCircle;

  const data = parkAreaGeoData.features
    .map((feature) => ({ ...feature.properties })) // Copy the data so force layout can modify it
    .sort((a, b) => d3.ascending(a.area, b.area));

  const chartTitle = "Park Areas";
  const chartSubtitle = "Park area, m². Each dot represents a park";

  const height = 320;
  const marginTop = 24;
  const marginRight = 8;
  const marginBottom = 0;
  const marginLeft = 8;

  const dotRadius = 6;
  const dotFilledRadius = 5;

  const xScale = d3
    .scaleLog()
    .domain([data[0].area, data[data.length - 1].area]);

  ////////////////////////////////////////////////////////////
  //// Scaffold //////////////////////////////////////////////
  ////////////////////////////////////////////////////////////
  container.append("h2").attr("class", "h2").text(chartTitle);
  container.append("p").attr("class", "subtitle").text(chartSubtitle);

  const chartContainer = container
    .append("div")
    .attr("class", "chart-container");

  const svg = chartContainer
    .append("svg")
    .attr("class", "chart")
    .attr("height", height);

  const xAxisG = svg
    .append("g")
    .attr("class", "axis-g")
    .attr("transform", `translate(0,${marginTop})`);

  const dotsG = svg.append("g").attr("class", "dots-g");

  new ResizeObserver((entries) =>
    entries.forEach((entry) => resized(entry.contentRect))
  ).observe(chartContainer.node());

  function resized(contentRect) {
    if (contentRect.width === 0 || contentRect.width === width) return;
    width = contentRect.width;
    xScale.range([marginLeft, width - marginRight]);
    svg.attr("width", width);
    computeLayout();
    render();
  }

  ////////////////////////////////////////////////////////////
  //// Layout ////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////

  function computeLayout() {
    d3.forceSimulation(data)
      .force(
        "x",
        d3
          .forceX()
          .x((d) => xScale(d.area))
          .strength(1)
      )
      .force(
        "y",
        d3
          .forceY()
          .y((marginTop + height - marginBottom) / 2)
          .strength(0.1)
      )
      .force(
        "collision",
        d3.forceCollide().radius(dotRadius).strength(1).iterations(2)
      )
      .stop()
      .tick(300);
  }

  ////////////////////////////////////////////////////////////
  //// Render ////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////

  function render() {
    xAxisG.call(
      d3
        .axisTop(xScale)
        .tickSize(6)
        .tickPadding(8)
        .ticks((width - marginLeft - marginRight) / 100)
    );

    dotCircle = dotsG
      .selectAll("circle")
      .data(data, (d) => d.id)
      .join((enter) =>
        enter
          .append("circle")
          .attr("class", "dot-circle")
          .attr("r", dotFilledRadius)
          .on("mouseenter", entered)
          .on("mousemove", moved)
          .on("mouseleave", left)
      )
      .attr("transform", (d) => `translate(${d.x},${d.y})`);
  }

  ////////////////////////////////////////////////////////////
  //// Event handlers ////////////////////////////////////////
  ////////////////////////////////////////////////////////////

  function entered(event, d) {
    container.dispatch("highlight", { detail: d.id, bubbles: true });
    tooltip.show(d.id);
  }

  function moved(event) {
    tooltip.move(event);
  }

  function left() {
    container.dispatch("highlight", { detail: null, bubbles: true });
    tooltip.hide();
  }

  function highlight(highlighted) {
    if (highlighted) {
      dotCircle
        .classed("highlighted", (d) => d.id === highlighted)
        .filter((d) => d.id === highlighted)
        .raise();
    } else {
      dotCircle.classed("highlighted", false).order();
    }
  }

  function search(matchedIds) {
    if (matchedIds) {
      dotsG.classed("searching", true);
      dotCircle.classed("matched", (d) => matchedIds.has(d.id));
    } else {
      dotsG.classed("searching", false);
      dotCircle.classed("matched", false);
    }
  }

  return {
    highlight,
    search,
  };
}
