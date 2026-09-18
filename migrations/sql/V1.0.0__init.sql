create schema if not exists pubcat;
set search_path = pubcat;

-- ----------------------------------------------------------------------------
-- functions
-- ----------------------------------------------------------------------------

-- This function is to be called by a 'before insert or update' trigger
-- on any table that supports the standard audit columns:
--   - created_time
--   - updated_time
--   - created_by_db
--   - updated_by_db
-- It auto-populates these columns.
create or replace function audit_trigger_fn()
returns trigger as $$
begin
    if TG_OP = 'INSERT' then
        NEW.created_time  := now();
        NEW.created_by_db := current_user;
        NEW.updated_time  := now();
        NEW.updated_by_db := current_user;
    elsif TG_OP = 'UPDATE' then
        NEW.updated_time := now();
        NEW.updated_by_db := current_user;
    end if;
    return NEW;
end;
$$ language plpgsql;

-- ----------------------------------------------------------------------------
-- operational tables
-- ----------------------------------------------------------------------------

create table publication (
	publication_guid                    uuid                not null       default gen_random_uuid(), 
  publication_key                     integer             not null,      
  series_name                         text,
  issue_identification                text,
	edition                             text,
	originator                          text,
	publication_year                    text,                            
	title                               text,
	geospatial_data_presentation_form   text,
	publication_place                   text,
	publisher                           text,
	other_citation_details              text,
	bcgs_link                           text,
	pdf_link                            text,
	zip_link                            text,
  zip_content_link                    text,
	other_link_1                        text,
	other_link_2                        text,
	other_link_3                        text,
	thumbnail_link                      text,
	online_linkage_8                    text,
	online_linkage_9                    text,
	online_linkage_10                   text,
	online_linkage_11                   text,
	larger_work_citation                text,
	citation_information                text,
	abstract                            text,
	purpose                             text,
	supplemental_information            text,
  date_range                          text,
	beginning_date                      text,
	ending_date                         text,
	currentness_reference               text,
	progress                            text,
	maintenance_and_update_frequency    text,
	bounding_coordinates                text,
	west_bounding_coordinate            double precision,
	east_bounding_coordinate            double precision,
	north_bounding_coordinate           double precision,
	south_bounding_coordinate           double precision,
	theme_keyword_thesaurus             text,
	theme_keyword_1                     text,
	theme_keyword_2                     text,
	theme_keyword_3                     text,
	theme_keyword_4                     text,
	theme_keyword_5                     text,
	place_keyword_thesaurus             text,
	place_keyword_1                     text,
	place_keyword_2                     text,
	place_keyword_3                     text,
	place_keyword_4                     text,
	place_keyword_5                     text,
	use_constraints                     text,
	browse_graphic_file_type            text,
	geographic_coordinate_units         text,
	map_projection_name                 text,
	grid_coordinate_system_name         text,
	utm_zone_number                     text,
	ellipsoid_name                      text,
	horizontal_datum                    text,
	altitude_distance_units             text,
	distributor                         text,
	distribution_liability              text,
	non_digital_form                    text,
	scale                               integer,
	nts_maps                            text,
	cost                                text,
	stock_no                            text,
  area                                double precision,
	--footprint_geojson                   text,             --replaced by geometry
  geometry                            public.geometry(GeometryZ, 4326),
  --standard audit columns
  create_timestamp                    timestamptz           not null   default now(), 
  update_timestamp                    timestamptz           not null   default now(), 
  create_db_user                      varchar(63)           not null   default current_user,
  update_db_user                      varchar(63)           not null   default current_user,
  --constraints
  constraint publication_guid_pk primary key (publication_guid)
);
comment on table publication is 'A table which is almost exactly a direct copy of the CGKN_METADATA tables from the original publication catalogue MS Access database.  It container metadata about publications in a flattened (de-normalized) form.';
comment on column publication.publication_guid is 'The primary key uuid';
comment on column publication.publication_key is 'An alternative identifier.  This was the primary key from in the original MS Access database, but has been deprecated in favour of the new publication_guid.  Not populated for any records created after the original MS Access database was replaced by this newer database';
comment on column publication.series_name is 'The name of the BCGS ''series'' that the publication belongs to (e.g. ''Information Circular'' or ''GeoFile'')';
comment on column publication.issue_identification is 'A code that uniquely identifies the publication in a format used internally by BCGS (e.g. ''IC2025-01-01'' or ''P2025-01'')';
comment on column publication.edition is 'A title for the larger work that this publication is part of';
comment on column publication.originator is 'The author or a list of authors.  In most cases the value is a comma-separated list of people (e.g. ''Wilson, T.K., Bustin, R.M.'').  Can also be the name of an organization, such as Geoscience BC.';
comment on column publication.publication_year is 'The year of publication.  In most cases this is just a 4-digit year, but in a small proportion of the records the value is a range (e.g. ''1975-1980'')';
comment on column publication.title is 'The title of the publication';
comment on column publication.geospatial_data_presentation_form is 'A succinct description of the types or formats of the digital files that represent or are associated with the publication (e.g. ''digital pdf file'', or ''PDF, ZIP, GDB, GRD, GEOTIFF'')';
comment on column publication.publication_place is 'The place that the material was published.  For BCGS publications the place is usually ''Vancouver, British Columbia''.';
comment on column publication.publisher is 'The name of the publisher.  For most BCGS publications the publisher is listed as ''Province of British Columbia''.';
comment on column publication.other_citation_details is 'Miscellaneous other information about the publication.';
comment on column publication.bcgs_link is 'The public URL of a BCGS web site which provides more information about the publication';
comment on column publication.pdf_link is 'The public URL to download the principal PDF representing the publication';
comment on column publication.zip_link is 'The public URL to download a .zip archive containing supplementary files related to the publication';
comment on column publication.zip_content_link is 'Not used.';
comment on column publication.other_link_1 is 'A public URL to a web site related to the publication';
comment on column publication.other_link_2 is 'A public URL to a web site related to the publication';
comment on column publication.other_link_3 is 'A public URL to a web site related to the publication';
comment on column publication.thumbnail_link is 'A public URL to a thumbnail image representing the publication';
comment on column publication.online_linkage_8 is 'A public URL to a related web page or a download associated with the publication';
comment on column publication.online_linkage_9 is 'A public URL to a related web page or a download associated with the publication';
comment on column publication.online_linkage_10 is 'A public URL to a related web page or a download associated with the publication';
comment on column publication.online_linkage_11 is 'A public URL to a related web page or a download associated with the publication';
comment on column publication.larger_work_citation is 'The larger work that this publication is part of';
comment on column publication.citation_information is 'Identifies the specific section within a larger work where this publication can be found';
comment on column publication.abstract is 'A paragraph-length summary of the publication''s contents or findings';
comment on column publication.purpose is 'A description of the purpose of the work that was carried out and which resulted in this publication';
comment on column publication.supplemental_information is 'A catch-all field with miscellaneous additional information about a publication that does not neatly fit into other columns';
comment on column publication.date_range is 'The date range in which the study described by the publication was carried out (e.g. ''2013-2014'')';
comment on column publication.beginning_date is 'The first year of the study which the publication describes';
comment on column publication.ending_date is 'The last year of the study which the publication describes';
comment on column publication.currentness_reference is 'A statement indicating if and when the publication has been updated since its original publication';
comment on column publication.progress is 'A statement about the state of the project that this publication describes (e.g. ''complete'')';
comment on column publication.maintenance_and_update_frequency is 'A statement indicating if, and possibly how often, updates to the publication are planned (e.g. ''on-going'', ''periodic'', ''complete'', or ''non-planned'')';
comment on column publication.bounding_coordinates is 'Not used';
comment on column publication.west_bounding_coordinate is 'The WGS84 longitude of the western edge of the bounding box representing the study area';
comment on column publication.east_bounding_coordinate is 'TThe WGS84 longitude of the eastern edge of the bounding box representing the study area';
comment on column publication.north_bounding_coordinate is 'The WGS84 longitude of the northern edge of the bounding box representing the study area';
comment on column publication.south_bounding_coordinate is 'The WGS84 longitude of the southern edge of the bounding box representing the study area';
comment on column publication.theme_keyword_thesaurus is 'Not used';
comment on column publication.theme_keyword_1 is 'A keyword or tag that relates to the publication (but not to its corresponding location)';
comment on column publication.theme_keyword_2 is 'A keyword or tag that relates to the publication (but not to its corresponding location)';
comment on column publication.theme_keyword_3 is 'A keyword or tag that relates to the publication (but not to its corresponding location)';
comment on column publication.theme_keyword_4 is 'A keyword or tag that relates to the publication (but not to its corresponding location)';
comment on column publication.theme_keyword_5 is 'A keyword or tag that relates to the publication (but not to its corresponding location)';
comment on column publication.place_keyword_thesaurus is 'Not used';
comment on column publication.place_keyword_1 is 'A keyword or tag that relates to the location that the publication describes';
comment on column publication.place_keyword_2 is 'A keyword or tag that relates to the location that the publication describes';
comment on column publication.place_keyword_3 is 'A keyword or tag that relates to the location that the publication describes';
comment on column publication.place_keyword_4 is 'A keyword or tag that relates to the location that the publication describes';
comment on column publication.place_keyword_5 is 'A keyword or tag that relates to the location that the publication describes';
comment on column publication.use_constraints is 'Not used';
comment on column publication.browse_graphic_file_type is 'A list of file types of downloads related to this publication (e.g. ''PDF, ZIP (shp, pdf, xls, rtf)'')';
comment on column publication.geographic_coordinate_units is 'If the publication is or includes a map, indicates the horizontal unit of the map''s projection.';
comment on column publication.map_projection_name is 'If the publication is or includes a map, indicates the name of the map''s projection.';
comment on column publication.grid_coordinate_system_name is 'If the publication is or includes a map, indicates the coordinate system name of the map''s projection.';
comment on column publication.utm_zone_number is 'If the publication is or includes a map, and the map is in a UTM project, identifies the UTM zone number.';
comment on column publication.ellipsoid_name is 'If the publication is or includes a map, indicates the ellipsoid of the map''s projection.';
comment on column publication.horizontal_datum is 'If the publication is or includes a map, indicates the horizontal datum of the map''s projection.';
comment on column publication.altitude_distance_units is 'If the publication is or includes a map, indicates the unit of the altitude dimension of the map''s projection.';
comment on column publication.distributor is 'The name of the distributor.  For internal BCGS publications this is often ''BC Geological Survey''';
comment on column publication.distribution_liability is 'The meaning of this column is unknown';
comment on column publication.non_digital_form is 'If there is a non-digital form of the publication, it is indicated with a statement in this column. (e.g. ''paper'' indicates that there is a print version)';
comment on column publication.scale is 'The scale of mapping.  A value of 0 means validation is required.';
comment on column publication.nts_maps is 'A list of NTS mapsheets. The list separator is inconsistent, and may be a comma, semi-color, or other character.  Different scales of mapsheets may be listed. (e.g. 093I,O,P; 094A,B'' or ''092J/03E'')';
comment on column publication.cost is 'If the publication is not free, its cost may be listed here';
comment on column publication.stock_no is 'The meaning of this column is unknown';
comment on column publication.area is 'The size of the study area.  Units unknown';
comment on column publication.geometry is 'A geospatial footprint representing the study area described in the publication';


create trigger publication_trg
    before insert or update on publication
    for each row execute function audit_trigger_fn();