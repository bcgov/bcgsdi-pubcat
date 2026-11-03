"""
Update MS Access footprint_geojson values using geometries
from a GeoPackage.

Example (PowerShell):
    python update_ms_access_footprints.py `
        --gpkg-path "C:\\data\\footprints.gpkg" `
        --access-path "C:\\data\\publications.accdb"

To actually update the database, add:
    --no-dry-run

Optional arguments:
    --access-table "CGKN_METADATA"  (default: CGKN_METADATA)
    --gpkg-layer "footprints"  (default: first layer)

Dry run is enabled by default.
"""

import argparse
import json

import geopandas as gpd
import pyodbc
from shapely.geometry import MultiPolygon, GeometryCollection, mapping


# --------------------------------------------------
# Configuration
# --------------------------------------------------

ID_COLUMN = "issue_identification"
GEOJSON_COLUMN = "footprint_geojson"


# --------------------------------------------------
# Command-line arguments
# --------------------------------------------------

def parse_args():
    parser = argparse.ArgumentParser(
        description=(
            "Copy GeoPackage geometries into matching "
            "MS Access footprint_geojson records."
        )
    )

    parser.add_argument(
        "--gpkg-path",
        required=True,
        help="Path to the input GeoPackage file.",
    )

    parser.add_argument(
        "--access-path",
        required=True,
        help="Path to the MS Access .accdb or .mdb file.",
    )

    parser.add_argument(
        "--access-table",
        default="CGKN_METADATA",
        help="MS Access table name (default: CGKN_METADATA).",
    )

    parser.add_argument(
        "--gpkg-layer",
        default=None,
        help="GeoPackage layer name (default: first layer).",
    )

    parser.add_argument(
        "--dry-run",
        action=argparse.BooleanOptionalAction,
        default=True,
        help=(
            "Preview updates without saving them (default). "
            "Use --no-dry-run to perform updates."
        ),
    )

    return parser.parse_args()


# --------------------------------------------------
# Helper functions
# --------------------------------------------------

def quote_identifier(identifier):
    """Safely quote an Access SQL identifier."""
    return "[" + identifier.replace("]", "]]") + "]"


def normalize_issue_id(issue_id):
    """Normalize issue IDs for case-insensitive matching."""
    return str(issue_id).strip().upper()


# --------------------------------------------------
# Read GeoPackage and group geometries by issue ID
# --------------------------------------------------

def build_geometry_mapping(gpkg_path, gpkg_layer=None):
    print(f"Reading GeoPackage: {gpkg_path}")

    gdf = gpd.read_file(gpkg_path, layer=gpkg_layer)

    if ID_COLUMN not in gdf.columns:
        raise ValueError(
            f"GeoPackage is missing column: {ID_COLUMN}"
        )

    if gdf.crs is None:
        raise ValueError("GeoPackage has no CRS defined.")

    # GeoJSON coordinates should use WGS84
    # (longitude/latitude).
    if gdf.crs.to_epsg() != 4326:
        gdf = gdf.to_crs(epsg=4326)

    geometries_by_id = {}

    for _, row in gdf.iterrows():
        issue_ids = row[ID_COLUMN]
        geometry = row.geometry

        if issue_ids is None or geometry is None or geometry.is_empty:
            continue

        # One feature may refer to multiple issue IDs.
        # Normalize IDs to support case-insensitive matching.
        ids = {
            normalize_issue_id(issue_id)
            for issue_id in str(issue_ids).split(",")
            if issue_id.strip()
        }

        for issue_id in ids:
            geometries_by_id.setdefault(issue_id, []).append(
                geometry
            )

    print(f"GeoPackage features: {len(gdf)}")
    print(f"Unique issue IDs: {len(geometries_by_id)}")

    # Combine geometries without dissolving overlaps.
    geojson_by_id = {}

    for issue_id, geometries in geometries_by_id.items():

        if len(geometries) == 1:
            # Keep a single geometry unchanged.
            combined_geometry = geometries[0]

        elif all(
            geom.geom_type == "Polygon"
            for geom in geometries
        ):
            # Keep polygons separate, even if they overlap.
            combined_geometry = MultiPolygon(geometries)

        else:
            # Preserve mixed or other geometry types.
            combined_geometry = GeometryCollection(geometries)

        geojson_by_id[issue_id] = json.dumps(
            mapping(combined_geometry),
            separators=(",", ":"),
        )

    return geojson_by_id


# --------------------------------------------------
# Update MS Access
# --------------------------------------------------

def update_access(
    access_path,
    access_table,
    geojson_by_id,
    dry_run,
):
    connection_string = (
        r"DRIVER={Microsoft Access Driver (*.mdb, *.accdb)};"
        f"DBQ={access_path};"
    )

    conn = pyodbc.connect(connection_string)
    cursor = conn.cursor()

    table = quote_identifier(access_table)
    id_col = quote_identifier(ID_COLUMN)
    geo_col = quote_identifier(GEOJSON_COLUMN)

    try:
        # Read issue IDs currently present in Access.
        cursor.execute(
            f"SELECT {id_col} FROM {table}"
        )

        # Normalize Access IDs for case-insensitive matching.
        access_ids = {
            normalize_issue_id(row[0])
            for row in cursor.fetchall()
            if row[0] is not None
        }

        matched_ids = access_ids.intersection(
            geojson_by_id.keys()
        )

        unmatched_ids = (
            set(geojson_by_id.keys()) - access_ids
        )

        print(f"Access unique IDs: {len(access_ids)}")
        print(f"Matched issue IDs: {len(matched_ids)}")
        print(
            "GeoPackage IDs not found in Access: "
            f"{len(unmatched_ids)}"
        )

        update_sql = (
            f"UPDATE {table} "
            f"SET {geo_col} = ? "
            f"WHERE {id_col} = ?"
        )

        updated_rows = 0

        for issue_id in sorted(matched_ids):
            geojson = geojson_by_id[issue_id]

            if dry_run:
                print(f"Would update: {issue_id}")
            else:
                cursor.execute(
                    update_sql,
                    geojson,
                    issue_id,
                )
                updated_rows += cursor.rowcount

        if unmatched_ids:
            print(
                "\nGeoPackage IDs not found in Access:"
            )
            for issue_id in sorted(unmatched_ids):
                print(f"  {issue_id}")

        if dry_run:
            print("\nDRY RUN: No changes were saved.")
        else:
            conn.commit()
            print(f"\nAccess rows updated: {updated_rows}")

    except Exception:
        conn.rollback()
        raise

    finally:
        cursor.close()
        conn.close()


# --------------------------------------------------
# Main
# --------------------------------------------------

def main():
    args = parse_args()

    geojson_by_id = build_geometry_mapping(
        args.gpkg_path,
        args.gpkg_layer,
    )

    update_access(
        access_path=args.access_path,
        access_table=args.access_table,
        geojson_by_id=geojson_by_id,
        dry_run=args.dry_run,
    )


if __name__ == "__main__":
    main()