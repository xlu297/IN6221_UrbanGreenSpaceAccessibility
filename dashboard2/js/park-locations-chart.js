import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { rewind } from "https://cdn.jsdelivr.net/npm/@turf/rewind@7.2.0/+esm";

export function initParkLocationsChart({
  container,
  tooltip,
  parkLocationGeoData,
  parkAreaGeoData,
  planningAreaGeoData,
}) {
  ////////////////////////////////////////////////////////////
  //// Settings //////////////////////////////////////////////
  ////////////////////////////////////////////////////////////
  let width, dotCircle;

  const chartTitle = "Park Locations";
  const chartSubtitle = "Each dot represents a park";

  const height = 350;
  const marginTop = 3;
  const marginRight = 3;
  const marginBottom = 3;
  const marginLeft = 3;

  const dotFilledRadius = 4.5;

  const projection = d3.geoMercator();
  const path = d3.geoPath(projection);

  const zoom = d3
    .zoom()
    .on("start", zoomStarted)
    .on("zoom", zoomed)
    .on("end", zoomEnded)
    .scaleExtent([1, 32]);

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
    .attr("class", "chart grabble")
    .attr("height", height);

  const bgRect = svg
    .append("rect")
    .attr("class", "bg-rect")
    .attr("height", height);

  const g = svg.append("g");

  const planningAreaPath = g
    .append("g")
    .attr("class", "planning-areas-g")
    .selectAll("path")
    .data(planningAreaGeoData.features, (d) => d.properties.id)
    .join("path")
    .attr("class", "planning-area-path");

  const parkPath = g
    .append("g")
    .attr("class", "park-g")
    .selectAll("path")
    .data(parkAreaGeoData.features, (d) => d.properties.id)
    .join("path")
    .attr("class", "park-path");

  const dotsG = g.append("g").attr("class", "dots-g");

  new ResizeObserver((entries) =>
    entries.forEach((entry) => resized(entry.contentRect))
  ).observe(chartContainer.node());

  function resized(contentRect) {
    if (contentRect.width === 0 || contentRect.width === width) return;
    width = contentRect.width;

    projection.fitExtent(
      [
        [marginLeft, marginTop],
        [width - marginRight, height - marginBottom],
      ],
      planningAreaGeoData
    );

    svg.attr("width", width);
    bgRect.attr("width", width);

    render();

    svg.call(zoom).call(zoom.transform, d3.zoomIdentity);
  }

  ////////////////////////////////////////////////////////////
  //// Programmatic zoom /////////////////////////////////////
  ////////////////////////////////////////////////////////////

  // https://observablehq.com/@d3/programmatic-zoom

  const controls = chartContainer.append("div").attr("class", "zoom-controls");

  const zoomButtons = controls.append("div").attr("class", "zoom-in-out");

  const zoomInButton = zoomButtons
    .append("button")
    .attr("class", "zoom-control zoom-in")
    .attr("aria-label", "Zoom in")
    .attr("title", "Zoom in")
    .on("click", zoomIn)
    .html(
      `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" aria-hidden="true"><!-- Icon from Bytesize Icons by Dan Klammer - https://github.com/danklammer/bytesize-icons/blob/master/LICENSE.md --><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 2v28M2 16h28"/></svg>`
    );

  const zoomOutButton = zoomButtons
    .append("button")
    .attr("class", "zoom-control zoom-out")
    .attr("aria-label", "Zoom out")
    .attr("title", "Zoom out")
    .on("click", zoomOut)
    .html(
      `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" aria-hidden="true"><!-- Icon from Bytesize Icons by Dan Klammer - https://github.com/danklammer/bytesize-icons/blob/master/LICENSE.md --><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2 16h28"/></svg>`
    );

  const resetButton = controls
    .append("button")
    .attr("class", "zoom-control zoom-reset")
    .attr("aria-label", "Reset zoom")
    .attr("title", "Reset zoom")
    .on("click", reset)
    .html(
      `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" aria-hidden="true"><!-- Icon from Bytesize Icons by Dan Klammer - https://github.com/danklammer/bytesize-icons/blob/master/LICENSE.md --><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><circle cx="14" cy="14" r="12"/><path d="m23 23l7 7M9 12V9h3m4 0h3v3M9 16v3h3m7-3v3h-3"/></g></svg>`
    );

  function zoomIn() {
    svg.transition().call(zoom.scaleBy, 2);
  }

  function zoomOut() {
    svg.transition().call(zoom.scaleBy, 0.5);
  }

  function reset() {
    svg
      .transition()
      .duration(750)
      .call(
        zoom.transform,
        d3.zoomIdentity,
        d3.zoomTransform(svg.node()).invert([width / 2, height / 2])
      );
  }

  ////////////////////////////////////////////////////////////
  //// Render ////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////

  function render() {
    planningAreaPath.attr("d", path);

    // Park area geojson has the opposite rewinding order of what d3.geoPath expects. Use @turf/rewind to reverse winding order
    parkPath.attr("d", (d) => path(rewind(d, { reverse: true })));

    dotCircle = dotsG
      .selectAll("circle")
      .data(parkLocationGeoData.features, (d) => d.properties.id)
      .join((enter) =>
        enter
          .append("circle")
          .attr("class", "dot-circle")
          .attr("r", dotFilledRadius)
          .on("mouseenter", entered)
          .on("mousemove", moved)
          .on("mouseleave", left)
      )
      .attr(
        "transform",
        (d) => `translate(${projection(d.geometry.coordinates)})`
      );
  }

  ////////////////////////////////////////////////////////////
  //// Event handlers ////////////////////////////////////////
  ////////////////////////////////////////////////////////////

  function zoomed(event) {
    g.attr("transform", event.transform);
    dotCircle.attr("r", dotFilledRadius / event.transform.k);
  }

  function zoomStarted() {
    svg.classed("grabbing", true);
  }

  function zoomEnded() {
    svg.classed("grabbing", false);
  }

  function entered(event, d) {
    container.dispatch("highlight", { detail: d.properties.id, bubbles: true });
    tooltip.show(d.properties.id);
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
        .classed("highlighted", (d) => d.properties.id === highlighted)
        .filter((d) => d.properties.id === highlighted)
        .raise();
      parkPath
        .classed("highlighted", (d) => d.properties.id === highlighted)
        .filter((d) => d.properties.id === highlighted)
        .raise();
    } else {
      dotCircle.classed("highlighted", false).order();
      parkPath.classed("highlighted", false).order();
    }
  }

  function search(matchedIds) {
    if (matchedIds) {
      dotsG.classed("searching", true);
      dotCircle
        .classed("matched", (d) => matchedIds.has(d.properties.id))
        .filter((d) => matchedIds.has(d.properties.id))
        .raise();
    } else {
      dotsG.classed("searching", false);
      dotCircle.classed("matched", false).order();
    }
  }

  return {
    highlight,
    search,
  };
}
