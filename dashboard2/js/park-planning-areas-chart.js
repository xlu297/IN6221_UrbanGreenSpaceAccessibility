import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

export function initParkPlanningAreasChart({
  container,
  tooltip,
  planningAreaGeoData,
}) {
  ////////////////////////////////////////////////////////////
  //// Settings //////////////////////////////////////////////
  ////////////////////////////////////////////////////////////
  let dotCircle;
  let sortBy = "count";
  const dotsPerRow = 20;
  let sorted = planningAreaGeoData.features
    .filter((d) => d.properties.parkIds.length > 0)
    .map((d) => ({
      ...d.properties,
      parks: d.properties.parkIds.map((id, i) => ({
        id,
        col: i % dotsPerRow,
        row: Math.floor(i / dotsPerRow),
        planningAreaName: d.properties.name,
      })),
    }));

  const chartTitle = "Parks by Planning Area";
  const chartSubtitle = "Each dot represents a park";

  const marginTop = 2;
  const marginRight = 2;
  const marginBottom = 2;
  const nameLabelWidth = 172;
  const countLabelWidth = 16;
  const labelGap = 8;
  const marginLeft = nameLabelWidth + countLabelWidth + labelGap * 2;

  const dotRadius = 6;
  const dotFilledRadius = 5;
  const rowGap = 6;
  const width = marginLeft + marginRight + dotsPerRow * (dotRadius * 2); // This chart has a fixed width, so no resize observer is needed
  const height =
    marginTop +
    marginBottom +
    (sorted.length - 1) * rowGap +
    sorted.reduce((acc, d) => {
      const nRows = Math.ceil(d.parkIds.length / dotsPerRow);
      return acc + nRows * dotRadius * 2;
    }, 0);

  const animationDuration = 500;

  const xScale = d3
    .scalePoint()
    .domain(d3.range(dotsPerRow))
    .range([marginLeft, width - marginRight])
    .padding(0.5);

  const yScale = d3.scaleOrdinal();

  const maxCount = d3.max(sorted, (d) => d.parkIds.length);
  const maxNRows = Math.ceil(maxCount / dotsPerRow);
  const yInnerScale = d3
    .scalePoint()
    .domain(d3.range(maxNRows))
    .range([0, maxNRows * dotRadius * 2])
    .padding(0.5);

  ////////////////////////////////////////////////////////////
  //// Scaffold //////////////////////////////////////////////
  ////////////////////////////////////////////////////////////
  container.append("h2").attr("class", "h2").text(chartTitle);
  container.append("p").attr("class", "subtitle").text(chartSubtitle);

  const controls = container.append("div").attr("class", "controls");

  const chartContainer = container
    .append("div")
    .attr("class", "chart-container");

  const svg = chartContainer
    .append("svg")
    .attr("class", "chart")
    .attr("width", width)
    .attr("height", height);

  const yAxisG = svg
    .append("g")
    .attr("class", "axis-g")
    .attr("transform", `translate(${nameLabelWidth},0)`);

  const countsG = svg
    .append("g")
    .attr("class", "counts-g")
    .attr("transform", `translate(${marginLeft - labelGap},0)`);

  const dotsG = svg.append("g").attr("class", "dots-g");

  sortData();
  render(false);

  ////////////////////////////////////////////////////////////
  //// Sort by control ///////////////////////////////////////
  ////////////////////////////////////////////////////////////
  const fieldset = controls.append("fieldset");
  fieldset.append("legend").text("Sort planning areas by ");
  const radio = fieldset
    .append("div")
    .attr("class", "radio-group")
    .selectAll("div")
    .data([
      {
        value: "count",
        label: "Park Count",
      },
      {
        value: "name",
        label: "Name",
      },
    ])
    .join("div")
    .attr("class", "radio");
  radio
    .append("input")
    .attr("type", "radio")
    .attr("name", "planning-areas-sort-by")
    .attr("value", (d) => d.value)
    .attr("id", (d) => `planning-areas-sort-by-${d.value}`)
    .attr("checked", (d) => (d.value === sortBy ? "checked" : null))
    .on("change", (e) => {
      sortBy = e.target.value;
      sortData();
      render(true);
    });
  radio
    .append("label")
    .attr("for", (d) => `planning-areas-sort-by-${d.value}`)
    .text((d) => d.label);

  function sortData() {
    const sortFunction = {
      count: (a, b) => d3.descending(a.parkIds.length, b.parkIds.length),
      name: (a, b) => d3.ascending(a.name, b.name),
    };
    sorted.sort(sortFunction[sortBy]);

    // Update y scale
    const yRange = [];
    let y = marginTop;
    sorted.forEach((d) => {
      const y0 = y;
      const y1 =
        y0 + Math.ceil(d.parkIds.length / dotsPerRow) * (dotRadius * 2);
      const yMid = (y0 + y1) / 2;
      yRange.push({ y0, y0, yMid });
      y = y1 + rowGap;
    });

    yScale.domain(sorted.map((d) => d.name)).range(yRange);
  }

  ////////////////////////////////////////////////////////////
  //// Render ////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////

  function render(animate) {
    yAxisG
      .selectAll("text")
      .data(yScale.domain(), (d) => d)
      .join((enter) =>
        enter
          .append("text")
          .attr("text-anchor", "end")
          .attr("dy", "0.32em")
          .text((d) => d)
      )
      .transition()
      .duration(animate ? animationDuration : 0)
      .attr("transform", (d) => `translate(0,${yScale(d).yMid})`);

    countsG
      .selectAll("text")
      .data(sorted, (d) => d.name)
      .join((enter) =>
        enter
          .append("text")
          .attr("text-anchor", "end")
          .attr("dy", "0.32em")
          .text((d) => d.parkIds.length)
      )
      .transition()
      .duration(animate ? animationDuration : 0)
      .attr("transform", (d) => `translate(0,${yScale(d.name).yMid})`);

    dotCircle = dotsG
      .selectAll("circle")
      .data(
        sorted.flatMap((d) => d.parks),
        (d) => d.id
      )
      .join((enter) =>
        enter
          .append("circle")
          .attr("class", "dot-circle")
          .attr("r", dotFilledRadius)
          .attr("cx", (d) => xScale(d.col))
          .attr("cy", (d) => yInnerScale(d.row))
          .on("mouseenter", entered)
          .on("mousemove", moved)
          .on("mouseleave", left)
      );

    dotCircle
      .transition()
      .duration(animate ? animationDuration : 0)
      .attr(
        "transform",
        (d) => `translate(0,${yScale(d.planningAreaName).y0})`
      );
  }

  ////////////////////////////////////////////////////////////
  //// Event handlers ////////////////////////////////////////
  ////////////////////////////////////////////////////////////

  function entered(event, d) {
    container.dispatch("highlight", {
      detail: d.id,
      bubbles: true,
    });
    tooltip.show(d.id);
  }

  function moved(event) {
    tooltip.move(event);
  }

  function left(event) {
    container.dispatch("highlight", {
      detail: null,
      bubbles: true,
    });
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
