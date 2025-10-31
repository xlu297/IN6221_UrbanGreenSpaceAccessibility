import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

export function initChartTooltip({ container, data }) {
  let containerRect, tooltipRect;

  const tooltip = container.append("div").attr("class", "tip");

  function show(id) {
    tooltip.html(tooltipHtml(id)).classed("visible", true);

    containerRect = container.node().getBoundingClientRect();
    tooltipRect = tooltip.node().getBoundingClientRect();
  }

  function tooltipHtml(id) {
    const d = data.get(id);
    const formattedArea = d3.format(",.3~s")(d.area) + " m²";
    return `
    <div><strong>${d.name}</strong></div>
    <div>Park Area: <strong>${formattedArea}</strong></div>
    <div>Planning Area: <strong>${d.planningAreaName}</strong></div>
    `;
  }

  function move(event) {
    const [px, py] = d3.pointer(event, container.node());

    let transX = px - tooltipRect.width / 2;
    if (transX < 0) {
      transX = 0;
    }
    if (transX + tooltipRect.width > containerRect.width) {
      transX = containerRect.width - tooltipRect.width;
    }

    let transY = py - tooltipRect.height - 12;
    if (transY < 0) {
      transY = py + 12;
    }

    tooltip.style("transform", `translate(${transX}px,${transY}px)`);
  }

  function hide() {
    tooltip.classed("visible", false);
  }

  return {
    show,
    move,
    hide,
  };
}
