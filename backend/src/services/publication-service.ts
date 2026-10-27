import { prisma } from '../core/prisma.js';

import ExcelJS from 'exceljs';
import { Geometry } from 'geojson';
import { PassThrough, type Readable } from 'node:stream';
import { PublicationAdapter } from '../adapters/publication-adapter.js';
import { config } from '../core/config.js';
import { publication } from '../generated/prisma/client.js';
import { UserInputError } from '../types/error.js';
import {
  ApiPublication,
  PublicationFilter,
  PublicationFilterableField,
  PublicationFilterClause,
  PublicationSort,
  PublicationSortField,
  publicationSortFieldSchema,
} from '../types/publication.js';
import { SearchResponse } from '../types/search.js';
import { SearchHelperService } from './search-helper-service.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TransactionClient = any;

export const SEARCH_FIELD_TYPES = {
  scale: 'number',
};

export interface ExportColumn<T> {
  header: string;
  key: keyof T & string;
}

export const PublicationServicePrivate = {
  /* 
  Similar to searchPublications, but...
  returns a raw list of prisma publication objects rather than SearchResponse<ApiPublication>
  */
  async searchPublicationsRaw(
    filter: PublicationFilter | PublicationFilterClause[] = [],
    sort: PublicationSort = { field: 'title', direction: 'asc' },
    offset = 0,
    limit = 20,
  ): Promise<publication[]> {
    const where = SearchHelperService.searchFilterToWhere(
      filter,
      (clause: PublicationFilterClause) => PublicationServicePrivate.filterClauseToWhere(clause),
    );

    const orderBy = PublicationServicePrivate.sortToOrderBy(sort);

    const publicationsQuery = { where: where, orderBy: orderBy, skip: offset, take: limit };

    const publications = await prisma.publication.findMany(publicationsQuery);

    return publications;
  },

  validateFieldSupportsOperators(field: PublicationFilterableField, operator: string) {
    //fields not listed here are assumed to support all operators
    const fieldOperatorMappings = {
      map_scale: ['eq'],
    } as any;
    if (Object.hasOwn(fieldOperatorMappings, field)) {
      if (fieldOperatorMappings[field].find((op: any) => op == operator) == undefined) {
        throw new UserInputError(`field '${field}' does not support operator '${operator}'`);
      }
    }
  },

  searchFieldToDbCol(field: PublicationFilterableField): string | undefined {
    const oneToOneMappings = {
      publication_guid: 'publication_guid',
      publication_key: 'publication_key',
      title: 'title',
      abstract: 'abstract',
      publication_year: 'publication_year',
      author: 'originator',
      nts_map: 'nts_maps',
      map_scale: 'scale',
      series: 'series_name',
      issue_id: 'issue_identification',
      create_timestamp: 'create_timestamp',
      update_timestamp: 'update_timestamp',
    } as any;
    if (Object.hasOwn(oneToOneMappings, field)) {
      return oneToOneMappings[field];
    }
    return undefined;
  },

  sortFieldToDbCol(field: PublicationSortField): string | undefined {
    const oneToOneMappings = {
      publication_guid: 'publication_guid',
      publication_key: 'publication_key',
      title: 'title',
      abstract: 'abstract',
      publication_year: 'publication_year',
      author: 'originator',
      series: 'series_name',
      issue_id: 'issue_identification',
      create_timestamp: 'create_timestamp',
      update_timestamp: 'update_timestamp',
    } as any;
    if (Object.hasOwn(oneToOneMappings, field)) {
      return oneToOneMappings[field];
    }
    return undefined;
  },

  /**
   * Converts a single {@link PublicationFilterClause} into a Prisma `where` fragment.
   */
  filterClauseToWhere(clause: PublicationFilterClause): Record<string, unknown> {
    const { field, operator, value } = clause;
    const numericColumns = ['scale', 'publication_key'];

    // Check if the given field supports the given operator.
    this.validateFieldSupportsOperators(field, operator);

    // Check the normal case: where the filter field maps
    // to a single database column
    const dbCol = this.searchFieldToDbCol(field);
    if (dbCol) {
      // For filters applied to any db column that is numeric, coerce the values
      // into numbers
      const coerseValueTo = numericColumns.find((c) => c == dbCol) ? 'number' : undefined;

      return {
        [dbCol]: SearchHelperService.operatorToPrisma(operator, value, coerseValueTo),
      };
    }

    // Special cases below...

    if (field == 'any') {
      if (operator != 'contains') {
        throw "unsupported operator for 'any'";
      }
      const anyFilterNodes: PublicationFilterClause[] = [
        { field: 'title', operator: 'contains', value: value },
        { field: 'abstract', operator: 'contains', value: value },
        { field: 'nts_map', operator: 'contains', value: value },
        { field: 'publication_year', operator: 'contains', value: value },
        { field: 'author', operator: 'contains', value: value },
        { field: 'series', operator: 'contains', value: value },
        { field: 'issue_id', operator: 'contains', value: value },
        { field: 'keyword', operator: 'contains', value: value },
      ];

      if (!Number.isNaN(Number(value))) {
        anyFilterNodes.push({
          field: 'map_scale',
          operator: 'eq',
          value: value,
        });
        anyFilterNodes.push({
          field: 'publication_key',
          operator: 'eq',
          value: value,
        });
      }
      return {
        OR: anyFilterNodes.map((n) => this.filterClauseToWhere(n)),
      };
    }

    // If filtering by keyword, search against several different columns in the database
    if (field == 'keyword') {
      const keywordDbCols = [
        'theme_keyword_1',
        'theme_keyword_2',
        'theme_keyword_3',
        'theme_keyword_4',
        'theme_keyword_5',
        'place_keyword_1',
        'place_keyword_2',
        'place_keyword_3',
        'place_keyword_4',
        'place_keyword_5',
      ];
      return {
        OR: keywordDbCols.map((keywordDbCol) => {
          return {
            [keywordDbCol]: SearchHelperService.operatorToPrisma(operator, value),
          };
        }),
      };
    }

    throw new UserInputError(`Unsupported filter field: ${field}`);
  },

  sortToOrderBy(sort: PublicationSort): any {
    if (Array.isArray(sort)) {
      return sort.map((s) => this.sortToOrderBy(s));
    } else {
      const parsedSort = publicationSortFieldSchema.safeParse(sort.field);
      if (!parsedSort.success) {
        throw new UserInputError('Unsupported sort');
      }
      const sortField = this.sortFieldToDbCol(sort.field);

      return sortField
        ? {
            [sortField]: sort.direction,
          }
        : undefined;
    }
  },

  async getPublicationGeometry(
    publicationGuid: string,
    tx?: TransactionClient,
  ): Promise<Geometry | null> {
    const db = tx ?? prisma;

    // Read geometry using raw SQL because the PostGIS geometry type is not
    // natively supported by Prisma (it appears as Unsupported("geometry") in
    // the schema and is excluded from generated query results).
    // Note: a second round-trip is necessary here because replacing the Prisma
    // findUnique (and all its nested includes) with a single raw SQL query would
    // be significantly more complex. Prisma's tagged-template $queryRaw passes
    // all interpolated values as bound parameters, so this is not susceptible
    // to SQL injection.
    const geometryRows = await db.$queryRaw<[{ geometry_json: string | null }]>`
      SELECT ST_AsGeoJSON(geometry)::text AS geometry_json
      FROM ${config.get('db:schema')}.publication
      WHERE publication_guid = ${publicationGuid}::uuid
    `;
    // geometryRows may be empty if the row was deleted between the two queries
    // (a transient race condition). Treat missing geometry as null in that case.
    const geometryJson = geometryRows.length > 0 ? (geometryRows[0].geometry_json ?? null) : null;

    const geometry = geometryJson ? (JSON.parse(geometryJson) as Geometry) : null;
    return geometry;
  },
};

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

export const PublicationService = {
  async searchPublications(
    filter: PublicationFilter | PublicationFilterClause[] = [],
    sort: PublicationSort = { field: 'title', direction: 'asc' },
    offset = 0,
    limit = 20,
  ): Promise<SearchResponse<ApiPublication>> {
    const where = SearchHelperService.searchFilterToWhere(
      filter,
      (clause: PublicationFilterClause) => PublicationServicePrivate.filterClauseToWhere(clause),
    );

    const orderBy = PublicationServicePrivate.sortToOrderBy(sort);

    const countQuery = { where: where, orderBy: orderBy };
    const publicationsQuery = {
      ...countQuery,
      skip: offset,
      take: limit,
    };

    const publications = await prisma.publication.findMany(publicationsQuery);
    const count = await prisma.publication.count(countQuery);

    return {
      items: publications.map(PublicationAdapter.toApi),
      total: count,
      offset: offset,
      limit: limit,
    };
  },

  async getPublication(
    publicationGuid: string,
    tx?: TransactionClient,
  ): Promise<ApiPublication | null> {
    // TODO: refactor this to the "doWork" format for dealing with cases with and without a given tx param.
    // The 'db' approach used here was only suitable when there was just a single database statement in this method, but
    // now we've added a call to getPublicationVersionGeometry(..., db)
    const db = tx ?? prisma;

    const publication = await db.publication.findUnique({
      where: {
        publication_guid: publicationGuid,
      },
    });

    const apiPublication: ApiPublication | null = publication
      ? PublicationAdapter.toApi(publication)
      : null;

    //inject the geometry into the current_publication_version
    if (apiPublication) {
      apiPublication.geometry = await PublicationServicePrivate.getPublicationGeometry(
        publicationGuid,
        db,
      );
    }

    return apiPublication;
  },

  exportPublicationsToExcel(
    filter: PublicationFilter | PublicationFilterClause[] = [],
    sort: PublicationSort = { field: 'title', direction: 'asc' },
  ): Readable {
    const BATCH_SIZE = 500;

    const publicationColumns = [
      { header: 'Publication key', key: 'publication_key' },
      { header: 'Series', key: 'series_name' },
      { header: 'Issue', key: 'issue_identification' },
      { header: 'Title', key: 'title' },
      { header: 'Author', key: 'originator' },
      { header: 'Publication year', key: 'publication_year' },
      { header: 'Abstract', key: 'abstract' },
      { header: 'Other', key: 'other_citation_details' },
      { header: 'Web link', key: 'bcgs_link' },
      { header: 'PDF link', key: 'pdf_link' },
      { header: 'Zip link', key: 'zip_link' },
      { header: 'Zip content link', key: 'zip_content_link' },
      { header: 'Other link 1', key: 'other_link_1' },
      { header: 'Other link 2', key: 'other_link_2' },
      { header: 'Other link 3', key: 'other_link_3' },
      { header: 'Thumbnail link', key: 'thumbnail_link' },
      { header: 'Larger work citation', key: 'larger_work_citation' },
      { header: 'Purpose', key: 'purpose' },
      { header: 'Scale', key: 'scale' },
      { header: 'West bounding coordinate	', key: 'west_bounding_coordinate' },
      { header: 'East bounding coordinate	', key: 'east_bounding_coordinate' },
      { header: 'North bounding coordinate	', key: 'north_bounding_coordinate' },
      { header: 'South bounding coordinate	', key: 'south_bounding_coordinate' },
      { header: 'Theme keyword 1', key: 'theme_keyword_1' },
      { header: 'Theme keyword 2', key: 'theme_keyword_2' },
      { header: 'Theme keyword 3', key: 'theme_keyword_3' },
      { header: 'Theme keyword 4', key: 'theme_keyword_4' },
      { header: 'Theme keyword 5', key: 'theme_keyword_5' },
      { header: 'Place keyword 1', key: 'place_keyword_1' },
      { header: 'Place keyword 2', key: 'place_keyword_2' },
      { header: 'Place keyword 3', key: 'place_keyword_3' },
      { header: 'Place keyword 4', key: 'place_keyword_4' },
      { header: 'Place keyword 5', key: 'place_keyword_5' },
      { header: 'Browse Graphic File Type', key: 'browse_graphic_file_type' },
      { header: 'NTS Maps', key: 'nts_maps' },
    ] satisfies ExportColumn<publication>[];

    const output = new PassThrough();

    void (async () => {
      const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
        stream: output,
        useStyles: false,
        useSharedStrings: false,
      });

      const worksheet = workbook.addWorksheet('Publications');

      worksheet.columns = publicationColumns.map(({ key }) => ({ key }));

      worksheet.addRow(publicationColumns.map(({ header }) => header)).commit();

      let offset = 0;

      while (true) {
        const publications = await PublicationServicePrivate.searchPublicationsRaw(
          filter,
          sort,
          offset,
          BATCH_SIZE,
        );

        for (const publication of publications) {
          worksheet.addRow(publicationColumns.map(({ key }) => publication[key])).commit();
        }

        offset += publications.length;

        if (publications.length < BATCH_SIZE) {
          break;
        }
      }

      worksheet.commit();
      await workbook.commit();
    })().catch((error: unknown) => {
      output.destroy(error instanceof Error ? error : new Error(String(error)));
    });

    return output;
  },
};
