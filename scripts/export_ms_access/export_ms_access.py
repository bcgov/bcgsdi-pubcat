#!/usr/bin/env python3

import argparse
import json
import sys
from datetime import date, datetime
from decimal import Decimal

import pyodbc


SOURCE_TABLE = "CGKN_METADATA"

SOURCE_COLUMNS = [
    "KEY",
    "SERIES_NAME",
    "ISSUE_IDENTIFICATION",
    "EDITION",
    "ORIGINATOR",
    "PUBLICATION_DATE",
    "TITLE",
    "GEOSPATIAL_DATA_PRESENTATION_FORM",
    "PUBLICATION_PLACE",
    "PUBLISHER",
    "OTHER_CITATION_DETAILS",
    "bcgs_link",
    "pdf_link",
    "zip_link",
    "zip_content_link",
    "other_link_1",
    "other_link_2",
    "other_link_3",
    "thumbnail_link",
    "ONLINE_LINKAGE_8",
    "ONLINE_LINKAGE_9",
    "ONLINE_LINKAGE_10",
    "ONLINE_LINKAGE_11",
    "LARGER_WORK_CITATION",
    "CITATION_INFORMATION",
    "ABSTRACT",
    "PURPOSE",
    "SUPPLEMENTAL_INFORMATION",
    "DATE_RANGE",
    "BEGINNING_DATE",
    "ENDING_DATE",
    "CURRENTNESS_REERENCE",
    "PROGRESS",
    "MAINTENANCE_AND_UPDATE_FREQUENCY",
    "BOUNDING_COORDINATES",
    "WEST_BOUNDING_COORDINATE",
    "EAST_BOUNDING_COORDINATE",
    "NORTH_BOUNDING_COORDINATE",
    "SOUTH_BOUNDING_COORDINATE",
    "THEME_KEYWORD_THESAURUS",
    "THEME_KEYWORD_1",
    "THEME_KEYWORD_2",
    "THEME_KEYWORD_3",
    "THEME_KEYWORD_4",
    "THEME_KEYWORD_5",
    "PLACE_KEYWORD_THESAURUS",
    "PLACE_KEYWORD_1",
    "PLACE_KEYWORD_2",
    "PLACE_KEYWORD_3",
    "PLACE_KEYWORD_4",
    "PLACE_KEYWORD_5",
    "USE_CONSTRAINTS",
    "BROWSE_GRAPHIC_FILE_TYPE",
    "GEOGRAPHIC_COORDINATE_UNITS",
    "MAP_PROJECTION_NAME",
    "GRID_COORDINATE_SYSTEM_NAME",
    "UTM_ZONE_NUMBER",
    "ELLIPSOID_NAME",
    "HORIZONTAL_DATUM",
    "ALTITUDE_DISTANCE_UNITS",
    "DISTRIBUTOR",
    "DISTRIBUTION_LIABILITY",
    "NON_DIGITAL_FORM",
    "SCALE",
    "NTS_MAPS",
    "COST",
    "STOCK_NO",
    "Area",
    "footprint_geojson",
]


# Explicit source-to-target column renames.
# All other columns use the lowercase source column name.
COLUMN_RENAMES = {
    "KEY": "publication_key",
    "PUBLICATION_DATE": "publication_year",
    "CURRENTNESS_REERENCE": "currentness_reference",
}


def quote_identifier(identifier: str) -> str:
    """Quote a PostgreSQL identifier."""
    return '"' + identifier.replace('"', '""') + '"'


def quote_table_name(table_name: str) -> str:
    """
    Quote a PostgreSQL table name.

    Supports:
        table
        schema.table
    """
    parts = table_name.split(".")

    if len(parts) == 1:
        return quote_identifier(parts[0])

    if len(parts) == 2:
        return (
            f"{quote_identifier(parts[0])}."
            f"{quote_identifier(parts[1])}"
        )

    raise ValueError(
        "Target table must be specified as either "
        "'table' or 'schema.table'"
    )


def get_target_column_name(source_column: str) -> str:
    """
    Return the target column name.

    Explicit renames take precedence. Otherwise, the source
    column name is converted to lowercase.
    """
    return COLUMN_RENAMES.get(
        source_column,
        source_column.lower(),
    )


def sql_literal(value):
    """Convert a Python value into a PostgreSQL SQL literal."""
    
    if isinstance(value, str):
        try:
            value.encode("utf-8")
        except UnicodeEncodeError as exc:
            print(
                f"UTF-8 encoding error in value: {value!r}",
                file=sys.stderr,
            )
            print(
                f"Unicode error: {exc}",
                file=sys.stderr,
            )
            raise

    if value is None:
        return "NULL"

    if isinstance(value, bool):
        return "TRUE" if value else "FALSE"

    if isinstance(value, (datetime, date)):
        return "'" + value.isoformat() + "'"

    if isinstance(value, Decimal):
        return str(value)

    if isinstance(value, (int, float)):
        return str(value)

    if isinstance(value, bytes):
        return "'\\\\x" + value.hex() + "'::bytea"

    text = str(value)
    text = text.replace("'", "''")

    return "'" + text + "'"


def geometry_expression(geojson_value):
    """
    Convert GeoJSON into a PostGIS geometry expression.

    Source coordinates are assumed to use WGS84 / EPSG:4326.

    Both 2D and 3D GeoJSON are supported. 2D geometries are
    promoted to 3D with a Z value of 0.
    """
    if geojson_value is None:
        return "NULL"

    if isinstance(geojson_value, bytes):
        geojson_value = geojson_value.decode("utf-8")

    geojson_text = str(geojson_value).strip()

    if not geojson_text:
        return "NULL"

    try:
        geometry = json.loads(geojson_text)
    except json.JSONDecodeError as exc:
        raise ValueError(
            f"Invalid footprint_geojson: {exc}"
        ) from exc

    if not isinstance(geometry, dict):
        raise ValueError(
            "footprint_geojson must contain a JSON object"
        )

    normalized_geojson = json.dumps(
        geometry,
        ensure_ascii=False,
        separators=(",", ":"),
    )

    escaped_geojson = normalized_geojson.replace("'", "''")

    return (
        "ST_Force3D("
        "ST_SetSRID("
        f"ST_GeomFromGeoJSON('{escaped_geojson}'), "
        "4326"
        ")"
        ")"
    )


def get_connection(database_filename):
    """Open an ODBC connection to the Access database."""
    connection_string = (
        "DRIVER={Microsoft Access Driver (*.mdb, *.accdb)};"
        f"DBQ={database_filename};"
    )

    return pyodbc.connect(connection_string)


def generate_inserts(database_filename, target_table, output):
    """Read the Access table and write PostgreSQL INSERT statements."""
    target_table_sql = quote_table_name(target_table)

    with get_connection(database_filename) as connection:
        cursor = connection.cursor()

        source_column_sql = ", ".join(
            quote_identifier(column)
            for column in SOURCE_COLUMNS
        )

        source_table_sql = quote_identifier(SOURCE_TABLE)

        select_sql = f"""
            SELECT {source_column_sql}
            FROM {source_table_sql}
        """

        cursor.execute(select_sql)

        # Build the target column list.
        #
        # footprint_geojson is not inserted directly. Instead, it
        # is converted into the target geometry column.
        target_columns = []

        for source_column in SOURCE_COLUMNS:
            if source_column == "footprint_geojson":
                continue

            target_columns.append(
                get_target_column_name(source_column)
            )

        target_columns.append("geometry")

        target_column_sql = ", ".join(
            quote_identifier(column)
            for column in target_columns
        )

        footprint_index = SOURCE_COLUMNS.index(
            "footprint_geojson"
        )

        for row_number, row in enumerate(cursor, start=1):
            values = []

            for index, source_column in enumerate(SOURCE_COLUMNS):
                if source_column == "footprint_geojson":
                    continue

                values.append(
                    sql_literal(row[index])
                )

            try:
                geometry_sql = geometry_expression(
                    row[footprint_index]
                )
            except ValueError as exc:
                raise ValueError(
                    f"Row {row_number}: {exc}"
                ) from exc

            values.append(geometry_sql)

            value_sql = ", ".join(values)

            output.write(
                f"INSERT INTO {target_table_sql} "
                f"({target_column_sql}) "
                f"VALUES ({value_sql});\n"
            )


def main():
    parser = argparse.ArgumentParser(
        description=(
            "Export the CGKN_METADATA table from an MS Access "
            "MDB database as PostgreSQL INSERT statements."
        )
    )

    parser.add_argument(
        "-database",
        "--database",
        required=True,
        help="Path to the MS Access .mdb database.",
    )

    parser.add_argument(
        "-target_table",
        "--target_table",
        required=True,
        help=(
            "Target PostgreSQL table. Specify either "
            "'table' or 'schema.table'."
        ),
    )

    parser.add_argument(
        "-output",
        "--output",
        required=True,
        help="Output SQL file. The file is written as UTF-8.",
    )

    args = parser.parse_args()

    try:
      with open(
          args.output,
          "w",
          encoding="utf-8",
          newline="\n",
      ) as output:
          output.write("SET client_encoding = 'UTF8';\n\n")

          generate_inserts(
              args.database,
              args.target_table,
              output,
          )

    except pyodbc.Error as exc:
        print(
            f"ERROR: Could not read Access database: {exc}",
            file=sys.stderr,
        )
        sys.exit(1)

    except OSError as exc:
        print(
            f"ERROR: Could not open output file: {exc}",
            file=sys.stderr,
        )
        sys.exit(1)

    except UnicodeDecodeError as exc:
        print(
            f"ERROR: Could not decode Access text as UTF-8: {exc}",
            file=sys.stderr,
        )
        sys.exit(1)

    except ValueError as exc:
        print(
            f"ERROR: {exc}",
            file=sys.stderr,
        )
        sys.exit(1)


if __name__ == "__main__":
    main()