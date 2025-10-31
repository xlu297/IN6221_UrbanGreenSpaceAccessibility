import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

export function processData({
  parkLocationGeoData,
  parkAreaGeoData,
  planningAreaGeoData,
}) {
  ////////////////////////////////////////////////////////////
  //// Process planning area geo data ////////////////////////
  ////////////////////////////////////////////////////////////
  const planningAreaFeatures = planningAreaGeoData.features;
  planningAreaFeatures.forEach((feature) => {
    const id = feature.properties.Name;
    const nameRegex = /<td\>(.+?)<\/td\>/; // Regex to extract the planning area name inside the first td tag from the description table
    const name = nameRegex.exec(feature.properties.Description)[1];
    const parkIds = []; // Array to store park ids inside the planning area

    feature.properties = {
      id,
      name,
      parkIds,
    };
  });

  const planningAreaNameById = new Map(
    planningAreaFeatures.map((d) => [d.properties.id, d.properties.name])
  );

  ////////////////////////////////////////////////////////////
  //// Process park area geo data ////////////////////////////
  ////////////////////////////////////////////////////////////
  const parkAreaFeatures = parkAreaGeoData.features;
  parkAreaFeatures.forEach((feature) => {
    const id = feature.properties.FID + 1; // Park area FID differs from park location OBJECTID by 1
    const name = feature.properties.NAME;
    const area = feature.properties.Shape_Area;

    feature.properties = {
      id,
      name,
      area,
    };
    delete feature.id;
  });

  ////////////////////////////////////////////////////////////
  //// Process park location geo data ////////////////////////
  ////////////////////////////////////////////////////////////
  const parkLocationFeatures = parkLocationGeoData.features;
  parkLocationFeatures.forEach(function (feature, i) {
    const id = feature.properties.OBJECTID;
    const name = feature.properties.NAME;

    // Find the planning area where the park is located using the park's coordinates
    let planningAreaId;
    for (const planningAreaFeature of planningAreaFeatures) {
      if (d3.geoContains(planningAreaFeature, feature.geometry.coordinates)) {
        planningAreaId = planningAreaFeature.properties.id;
        planningAreaFeature.properties.parkIds.push(id);
        break;
      }
    }

    if (!planningAreaId) {
      // console.warn(`${name} park is not located automatically in any planning area.`);
      // Manually assign planning area
      planningAreaId = {
        "BETING BRONOK": "kml_24",
        "BUKIT CHERMIN BOARDWALK": "kml_4",
      }[name];
      const planningAreaFeature = planningAreaGeoData.features.find(
        (feature) => feature.properties.id === planningAreaId
      );
      planningAreaFeature.properties.parkIds.push(id);
    }

    feature.properties = {
      id,
      name,
      planningAreaId,
    };
    delete feature.id;
  });

  ////////////////////////////////////////////////////////////
  //// Generate tooltip data /////////////////////////////////
  ////////////////////////////////////////////////////////////
  const tooltipData = new Map();
  for (let i = 0; i < parkLocationFeatures.length; i++) {
    const parkLocationFeature = parkLocationFeatures[i];
    const parkAreaFeature = parkAreaFeatures[i];
    const id = parkLocationFeature.properties.id;
    const name = parkLocationFeature.properties.name;
    const area = parkAreaFeature.properties.area;
    const planningAreaName = planningAreaNameById.get(
      parkLocationFeature.properties.planningAreaId
    );
    tooltipData.set(id, { name, area, planningAreaName });
  }

  ////////////////////////////////////////////////////////////
  //// Generate search data //////////////////////////////////
  ////////////////////////////////////////////////////////////
  const searchData = new Map(
    parkLocationFeatures.map((d) => [d.properties.name, d.properties.id])
  );

  // Because all geojson data are modified in place, no return statement is needed
  console.log({
    parkLocationGeoData,
    parkAreaGeoData,
    planningAreaGeoData,
    tooltipData,
  });

  return { tooltipData, searchData };
}

export function findMatchedIds(searchData, searchTerm) {
  const searchRegex = new RegExp(searchTerm);
  const matchedIds = Array.from(searchData)
    .filter(([name, id]) => searchRegex.test(name))
    .map(([name, id]) => id);
  return new Set(matchedIds);
}
