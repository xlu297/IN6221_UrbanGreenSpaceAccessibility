import csv, json, math, re
from pathlib import Path

ROOT = Path(__file__).parent

LANDUSE_FILE = ROOT / "MasterPlan2019LandUselayer.geojson"
PARKS_FILE   = ROOT / "Parks.geojson"
OUT_FILE     = ROOT / "residential_distances.csv"

RE_LU = re.compile(r"<th>LU_DESC</th>\s*<td>([^<]+)</td>")
RE_PLN_AREA = re.compile(r"<th>PLN_AREA_N</th>\s*<td>([^<]+)</td>")

RES_TYPES = {
    "RESIDENTIAL",
    "RESIDENTIAL WITH COMMERCIAL AT 1ST STOREY",
    "COMMERCIAL & RESIDENTIAL",
    "RESIDENTIAL / INSTITUTION",
}

def read_json(path: Path):
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)

def get_lu_desc(feature):
    desc = feature.get("properties", {}).get("Description")
    if not desc:
        return None
    m = RE_LU.search(desc)
    return m.group(1) if m else None

def get_planning_area(feature):
    desc = feature.get("properties", {}).get("Description")
    if not desc:
        return None
    m = RE_PLN_AREA.search(desc)
    return m.group(1) if m else None

def first_ring_coords(geom):
    """
    Extract first ring coordinates from Polygon or MultiPolygon geometries.
    For Polygon: coordinates[0] = first ring (outer boundary)
    For MultiPolygon: coordinates[0][0] = first ring of first polygon
    """
    if not geom:
        return []
    gtype = geom.get("type")
    coords = geom.get("coordinates", [])
    if gtype == "Polygon":
        return coords[0] if coords else []
    if gtype == "MultiPolygon":
        return coords[0][0] if coords and coords[0] else []  # First ring of first polygon
    return []

def naive_centroid_lonlat(ring):
    """
    Calculate naive centroid (average of all points) from a ring of coordinates.
    Each point in the ring should be [lon, lat] or [lon, lat, elevation].
    """
    if not ring:
        return None
    sLon = sLat = 0.0
    n = 0
    for pt in ring:
        if isinstance(pt, (list, tuple)) and len(pt) >= 2:
            lon, lat = pt[0], pt[1]
            if isinstance(lon, (int, float)) and isinstance(lat, (int, float)):
                sLon += lon
                sLat += lat
                n += 1
    if n == 0:
        return None
    return (sLon / n, sLat / n)

def haversine_m(lat1, lon1, lat2, lon2):
    R = 6371000.0
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = math.sin(dLat/2)**2 + math.cos(math.radians(lat1))*math.cos(math.radians(lat2))*math.sin(dLon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def main():
    landuse = read_json(LANDUSE_FILE)
    parks   = read_json(PARKS_FILE)

    park_points = []
    for f in parks.get("features", []):
        geom = f.get("geometry", {})
        if geom.get("type") == "Point":
            coords = geom.get("coordinates", [])
            if len(coords) >= 2 and all(isinstance(v, (int, float)) for v in coords[:2]):
                park_points.append((coords[0], coords[1]))

    residential = [
        f for f in landuse.get("features", [])
        if get_lu_desc(f) in RES_TYPES
    ]

    rows = []
    for f in residential:
        ring = first_ring_coords(f.get("geometry", {}))
        cen = naive_centroid_lonlat(ring)
        if not cen:
            continue
        cen_lon, cen_lat = cen

        min_d = float("inf")
        for p_lon, p_lat in park_points:
            d = haversine_m(cen_lat, cen_lon, p_lat, p_lon)
            if d < min_d:
                min_d = d
        
        if min_d < float("inf"):
            feature_name = f.get("properties", {}).get("Name", "Unknown")
            planning_area = get_planning_area(f) or "Unknown"
            land_use_type = get_lu_desc(f) or "Unknown"
            rows.append({
                "name": feature_name,
                "planning_area": planning_area,
                "land_use_type": land_use_type,
                "centroid_lon": cen_lon,
                "centroid_lat": cen_lat,
                "distance_m": min_d
            })

    with OUT_FILE.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["name", "planning_area", "land_use_type", "centroid_lon", "centroid_lat", "distance_m"])
        w.writeheader()
        for row in rows:
            w.writerow({
                "name": row["name"],
                "planning_area": row["planning_area"],
                "land_use_type": row["land_use_type"],
                "centroid_lon": f"{row['centroid_lon']:.6f}",
                "centroid_lat": f"{row['centroid_lat']:.6f}",
                "distance_m": f"{row['distance_m']:.6f}"
            })

    print(f"Wrote {len(rows)} rows to {OUT_FILE}")

if __name__ == "__main__":
    main()


