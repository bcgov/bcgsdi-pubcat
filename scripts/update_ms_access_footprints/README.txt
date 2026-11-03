This script copies geometries from the given geopackage into the corresponding
records of the given MS Access database and table.  (Records between the geopackage
and MS Access table are related through their respective "issue_identification" 
columns.)

INSTALLATION
============

1. Create a Python virtual environment (recommended):

    python -m venv .venv


2. Activate the virtual environment on Windows:

    .\.venv\Scripts\activate.ps1

3. Install the required Python packages:

    python -m pip install -r requirements.txt

USAGE
=====  

(PowerShell):
    python update_ms_access_footprints.py --gpkg-path "footprints.gpkg" --access-path "my_access_db.accdb"

To actually update the database, add:
    --no-dry-run