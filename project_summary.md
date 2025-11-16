# Urban Green Space Accessibility in Singapore - Project Summary

This project is a web-based data visualization dashboard that analyzes urban green space accessibility in Singapore. It consists of five dashboards, each focusing on a different aspect of the analysis. The visualizations are built using the D3.js library, with HTML and CSS for structure and styling, and JavaScript for interactivity. The Turf.js library is also used for geospatial analysis.

## Dashboards

### Dashboard 1: "Pressure" — Singapore’s High-Density Urban Environment
This dashboard visualizes Singapore's population density and land use.
- **Choropleth Map:** Shows population density across different planning areas.
- **Bar Chart:** Displays the top 10 most densely populated planning areas.
- **Donut Chart:** Illustrates the composition of land use in Singapore.
- **Key Performance Indicators (KPIs):** Presents key statistics such as total population, total area, average density, and the most dense area.

### Dashboard 2: "Green Space Checklist"
This dashboard provides an inventory of green spaces in Singapore.
- **Park Locations Map:** An interactive map with zoom and pan functionality, showing the locations of parks.
- **Park Areas Dot Plot:** A dot plot on a logarithmic scale representing the distribution of park areas.
- **Parks by Planning Area:** A dot plot matrix showing the distribution of parks within each planning area, sortable by name or count.
- **Interactivity:** All charts are interconnected, with highlighting and search functionality.

### Dashboard 3: "The Gap" — An Analysis of Green Space Allocation Equity
This dashboard analyzes the equity of green space allocation in relation to the population.
- **Scatter Plot:** Shows the relationship between population density and per capita green space for each planning area.
- **Diverging Bar Chart:** Compares the per capita green space of each planning area to the national average.
- **Choropleth Map:** Visualizes the per capita green space across different planning areas.

### Dashboard 4: Distance Relationship Between Residential Areas and Parks
This dashboard focuses on the proximity of residential areas to parks.
- **Interactive "Click-to-Analyze" Map:** Allows users to click on any location on the map to find the nearest park and the distance to it.
- **Histogram:** Displays the distribution of distances from residential areas to the nearest park.
- **Regions & Trails Map:** Shows Singapore's planning areas colored by region, with an overlay of NParks' tracks.

### Dashboard 5: Placeholder
This dashboard is a placeholder and does not currently contain any visualizations.

## Data Sources
The project utilizes a variety of local data files in CSV and GeoJSON formats:
- `planning_area.json`
- `population_by_pa.csv`
- `land_use_citywide.csv`
- `Parks.geojson`
- `NParksParksandNatureReserves.geojson`
- `MasterPlan2019PlanningAreaBoundaryNoSea.geojson`
- `pa_metrics.csv`
- `sg_pa.geojson`
- `NParksTracks.geojson`
- `residential_distances.csv`
