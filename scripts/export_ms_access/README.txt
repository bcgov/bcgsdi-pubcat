Access MDB to PostgreSQL SQL Export
===================================

This utility reads the CGKN_METADATA table from a Microsoft Access
(.mdb) database and writes PostgreSQL INSERT statements to stdout.

The target PostgreSQL table has the same columns as the Access table,
except:

    PUBLICATION_DATE       -> publication_year
    CURRENTNESS_REERENCE   -> currentness_reference

The PostgreSQL table also has an additional "geometry" column.

The Access footprint_geojson column is converted to a PostGIS geometry
using EPSG:4326.


REQUIREMENTS
============

- Python 3
- Microsoft Access ODBC driver


INSTALLATION
============

1. Create a Python virtual environment (recommended):

    python -m venv .venv


2. Activate the virtual environment on Windows:

    .venv\Scripts\activate


3. Install the required Python packages:

    python -m pip install -r requirements.txt


MICROSOFT ACCESS ODBC DRIVER
============================

The script uses the following ODBC driver:

    Microsoft Access Driver (*.mdb, *.accdb)

This driver is normally installed with Microsoft Access or the
Microsoft Access Database Engine.

The Python installation and Access ODBC driver must have compatible
32-bit/64-bit architectures.

For example, a 64-bit Python installation requires a 64-bit Access
ODBC driver.


USAGE
=====

The script requires three named parameters:

    -database         (accepts a path and filename of the .mdb file)
    -target_table     (a schema and tablename for the table to insert into)
    -output           (the path and filename of the output .sql file that will be generated)

Basic example:

    python export_ms_access.py -database "PATH_TO_MDB_FILE" -target_table "SCHEMA_DOT_TABLE" -output pubcat_data_load.sql


USAGE EXAMPLE
=============

Install:

    python -m venv .venv

    .venv\Scripts\activate

    python -m pip install -r requirements.txt


Generate SQL:

    python export_ms_access.py -database "C:\data\cgkn.mdb" -target_table pubcat.publication -output pubcat_data_load.sql


Load into PostgreSQL with a statement similar to:

    psql -h localhost -U pubcat -d pubcat -f pubcat_data_load.sql


DATA TRANSFORMATIONS
====================

The following Access columns are renamed:

    PUBLICATION_DATE
        -> publication_year

    CURRENTNESS_REERENCE
        -> currentness_reference


All other columns are copied using their existing column names.

The Access footprint_geojson column is not inserted into the target
table.

Instead, its value is converted into the PostgreSQL geometry column
using:

    ST_SetSRID(ST_GeomFromGeoJSON(...), 4326)


The source GeoJSON coordinates are assumed to be WGS84 longitude /
latitude coordinates (EPSG:4326).




