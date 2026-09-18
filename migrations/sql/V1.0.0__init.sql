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
  publication_key                     integer              not null,      
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
	footprint_geojson                   text,
  geometry                            public.geometry(GeometryZ, 4326),
  --standard audit columns
  created_time                        timestamptz           not null   default now(), 
  updated_time                        timestamptz           not null   default now(), 
  created_by_db                       text                  not null   default current_user,
  updated_by_db                       text                  not null   default current_user,
  --constraints
  constraint publication_guid_pk primary key (publication_guid)
);
comment on table publication is 'A table which is almost exactly a direct copy of the CGKN_METADATA tables from the original publication catalogue MS Access database.  It container metadata about publications in a flattened (de-normalized) form.';
comment on column publication.publication_guid is 'The primary key uuid';
comment on column publication.publication_key is 'An alternative identifier.  This was the primary key from in the original MS Access database, but has been deprecated in favour of the new publication_guid.  Not populated for any records created after the original MS Access database was replaced by this newer database';
comment on column publication.publication_year is 'The year of publication.  Replaces the publication_date column from the original MS Access database because the original name was misleading given the value is always just a year.';
comment on column publication.scale is 'The scale of mapping.  A value of 0 means validation is required.';

create trigger publication_trg
    before insert or update on publication
    for each row execute function audit_trigger_fn();