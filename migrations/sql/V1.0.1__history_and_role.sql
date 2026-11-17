LOCK TABLE pubcat.publication IN SHARE ROW EXCLUSIVE MODE;

-- ----------------------------------------------------------------------------
-- Tables
-- ----------------------------------------------------------------------------

-- Allow publication_key to be null.  It is a legacy column that isn't 
-- populated for new records
ALTER TABLE pubcat.publication ALTER COLUMN publication_key DROP NOT NULL;

CREATE TABLE pubcat.publication_history
(
    -- History-specific columns
    publication_history_guid       uuid         NOT NULL DEFAULT gen_random_uuid(),
    history_timestamp  timestamptz  NOT NULL DEFAULT clock_timestamp(),
    history_db_user    varchar(63)  NOT NULL DEFAULT session_user,
    history_operation  varchar(10)  NOT NULL,

    -- Copy all publication columns and their data types / NOT NULL constraints
    LIKE pubcat.publication,

    -- Constraints
    CONSTRAINT publication_history_pk
        PRIMARY KEY (publication_history_guid),

    -- A subtle distinction between INITIAL and INSERT:
    -- INITIAL indicates the record was inserted *before* history tracking began. 
    -- INSERT indicates the record was inserted *after* history tracking began.
    CONSTRAINT publication_history_operation_chk
        CHECK (history_operation IN ('INITIAL', 'INSERT', 'UPDATE', 'DELETE'))
);

-- Efficiently retrieve the history of an individual publication
CREATE INDEX publication_history_guid_idx
    ON pubcat.publication_history (publication_guid, history_timestamp DESC);

-- Limit to maximum one 'INITIAL' record per publication_guid
CREATE UNIQUE INDEX publication_history_initial_uidx
    ON pubcat.publication_history (publication_guid)
    WHERE history_operation = 'INITIAL';

-- ----------------------------------------------------------------------------
-- Populate history table with initial values
-- ----------------------------------------------------------------------------

INSERT INTO pubcat.publication_history
SELECT (pg_catalog.jsonb_populate_record(
    NULL::pubcat.publication_history,
    pg_catalog.to_jsonb(p) ||
    pg_catalog.jsonb_build_object(
        'publication_history_guid', pg_catalog.gen_random_uuid(),
        'history_timestamp', pg_catalog.clock_timestamp(),
        'history_db_user', session_user,
        'history_operation', 'INITIAL'
    )
)).*
FROM pubcat.publication AS p
WHERE NOT EXISTS (
    SELECT 1
    FROM pubcat.publication_history AS h
    WHERE h.publication_guid = p.publication_guid
      AND h.history_operation = 'INITIAL'
);

-- ----------------------------------------------------------------------------
-- Functions
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION pubcat.record_publication_history()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
    v_row jsonb;
BEGIN
    IF TG_OP = 'UPDATE' THEN
        IF OLD IS NOT DISTINCT FROM NEW THEN
            RETURN NEW;
        END IF;

        v_row := pg_catalog.to_jsonb(NEW);

    ELSIF TG_OP = 'INSERT' THEN
        v_row := pg_catalog.to_jsonb(NEW);

    ELSIF TG_OP = 'DELETE' THEN
        v_row := pg_catalog.to_jsonb(OLD);

    ELSE
      RAISE EXCEPTION 'Unsupported trigger operation: %', TG_OP;
        
    END IF;

    v_row := v_row || pg_catalog.jsonb_build_object(
        'publication_history_guid', pg_catalog.gen_random_uuid(),
        'history_timestamp', pg_catalog.clock_timestamp(),
        'history_db_user', session_user,
        'history_operation', TG_OP
    );

    INSERT INTO pubcat.publication_history
    SELECT *
    FROM pg_catalog.jsonb_populate_record(
        NULL::pubcat.publication_history,
        v_row
    );

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;

    RETURN NEW;
END;
$$;

-- ----------------------------------------------------------------------------
-- Triggers
-- ----------------------------------------------------------------------------

CREATE TRIGGER publication_history_trigger
  AFTER INSERT OR UPDATE OR DELETE
  ON pubcat.publication
  FOR EACH ROW
  EXECUTE FUNCTION pubcat.record_publication_history();

-- ----------------------------------------------------------------------------
-- Roles
-- ----------------------------------------------------------------------------

-- This role will be the owner of the trigger function that populates the 
-- publication_history table
CREATE ROLE pubcat_history_writer NOLOGIN;

-- This role can be assigned to users who need to maintain the data in the 
-- publications table
CREATE ROLE pubcat_clerk NOLOGIN;

-- ----------------------------------------------------------------------------
-- Grants
-- ----------------------------------------------------------------------------

-- Grants affecting pubcat_history_writer
GRANT USAGE ON SCHEMA pubcat TO pubcat_history_writer;
GRANT INSERT ON pubcat.publication_history TO pubcat_history_writer;

-- Change the owner of the function pubcat.record_publication_history.
-- Apply two temporary grants before the change, and revoke them afterwards.
-- These temporary grants are necessary to allow the ownership change.
GRANT pubcat_history_writer TO pubcat; -- temporary.  to be removed below.
GRANT CREATE ON SCHEMA pubcat TO pubcat_history_writer;
ALTER FUNCTION pubcat.record_publication_history() OWNER TO pubcat_history_writer;
REVOKE CREATE ON SCHEMA pubcat FROM pubcat_history_writer;
REVOKE pubcat_history_writer FROM pubcat;

-- Grants affecting pubcat_clerk
GRANT CONNECT ON DATABASE pubcat TO pubcat_clerk;
GRANT USAGE ON SCHEMA pubcat TO pubcat_clerk;
GRANT SELECT, INSERT, UPDATE, DELETE ON pubcat.publication TO pubcat_clerk;
REVOKE CREATE ON SCHEMA pubcat FROM pubcat_clerk; 

-- History table protection
REVOKE ALL ON pubcat.publication_history FROM PUBLIC;
REVOKE ALL ON pubcat.publication_history FROM pubcat_clerk;

-- Function protection
REVOKE ALL ON FUNCTION pubcat.record_publication_history() FROM PUBLIC;
REVOKE ALL ON FUNCTION pubcat.record_publication_history() FROM pubcat_clerk;

