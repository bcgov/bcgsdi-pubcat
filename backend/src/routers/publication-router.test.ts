import express from "express";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";

import { logger } from "../core/logger.js";
import { PublicationService } from "../services/publication-service.js";
import { UserInputError } from "../types/error.js";
import { publicationRouter } from "./publication-router.js";

const app = express();

app.use(express.json());
app.use("/publications", publicationRouter);

describe("POST /publications/search", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 200 with an array of publications", async () => {
    const results: any = [
      {
        publication_guid: "11111111-1111-1111-1111-111111111111",
        title: "Sample title",
      },
      {
        publication_guid: "22222222-2222-2222-2222-222222222222",
        title: "Sample title",
      },
    ];

    vi.spyOn(PublicationService, "searchPublications").mockResolvedValue(
      results,
    );

    const response = await request(app).post("/publications/search").send({
      offset: 0,
      limit: 25,
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(results);

    expect(PublicationService.searchPublications).toHaveBeenCalledOnce();

    expect(PublicationService.searchPublications).toHaveBeenCalledWith(
      undefined,
      undefined,
      0,
      25,
    );
  });

  it("returns 200 with an empty array when there are no matches", async () => {
    vi.spyOn(PublicationService, "searchPublications").mockResolvedValue([]);

    const response = await request(app).post("/publications/search").send({
      offset: 0,
      limit: 25,
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it("returns 200 when a filter is provided", async () => {
    const filter = {
      field: "title",
      operator: "contains",
      value: "Geology",
    };

    const results: any = [
      {
        publication_guid: "11111111-1111-1111-1111-111111111111",
        title: "Geological Survey",
      },
    ];

    vi.spyOn(PublicationService, "searchPublications").mockResolvedValue(
      results,
    );

    const response = await request(app).post("/publications/search").send({
      filter,
      offset: 0,
      limit: 25,
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(results);

    expect(PublicationService.searchPublications).toHaveBeenCalledWith(
      filter,
      undefined,
      0,
      25,
    );
  });

  it("returns 400 when the request body fails schema validation", async () => {
    const searchSpy = vi.spyOn(PublicationService, "searchPublications");

    const response = await request(app).post("/publications/search").send({
      offset: "not-a-number",
      limit: 25,
    });

    expect(response.status).toBe(400);
    expect(searchSpy).not.toHaveBeenCalled();
  });

  it("returns 400 when the service throws UserInputError", async () => {
    const errMsg = "Invalid search criteria";

    vi.spyOn(PublicationService, "searchPublications").mockRejectedValue(
      new UserInputError(errMsg),
    );

    const response = await request(app).post("/publications/search").send({
      offset: 0,
      limit: 25,
    });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      error: {
        code: "INVALID_REQUEST",
        userMessage: errMsg,
      },
    });
  });
});

describe("GET /publications/:id", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const publicationGuid = "123e4567-e89b-12d3-a456-426614174000";

  it("returns 200 and the publication when found", async () => {
    const publication = {
      publication_guid: publicationGuid,
      title: "Title here",
      publication_year: 2024,
      geometry: null,
    };

    vi.spyOn(PublicationService, "getPublication").mockResolvedValue(
      publication as any,
    );

    const response = await request(app).get(`/publications/${publicationGuid}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(publication);

    expect(PublicationService.getPublication).toHaveBeenCalledOnce();
    expect(PublicationService.getPublication).toHaveBeenCalledWith(
      publicationGuid,
    );
  });

  it("returns 404 when the publication does not exist", async () => {
    vi.spyOn(PublicationService, "getPublication").mockResolvedValue(null);

    const response = await request(app).get(`/publications/${publicationGuid}`);

    expect(response.status).toBe(404);
    expect(response.body.error.userMessage).toBe("Publication not found.");

    expect(PublicationService.getPublication).toHaveBeenCalledWith(
      publicationGuid,
    );
  });

  it("returns 400 when the ID is not a valid UUID", async () => {
    const getPublicationSpy = vi.spyOn(PublicationService, "getPublication");

    const response = await request(app).get("/publications/not-a-uuid");

    expect(response.status).toBe(404);
    expect(response.body.error.userMessage).toBe("Publication not found.");

    expect(getPublicationSpy).not.toHaveBeenCalled();
  });

  it("returns 500 when the service throws an error", async () => {
    //suppress error messages sent to logger.error
    vi.spyOn(logger, "error").mockImplementation(() => logger);

    vi.spyOn(PublicationService, "getPublication").mockRejectedValue(
      new Error("Database connection failed"),
    );

    const response = await request(app).get(`/publications/${publicationGuid}`);

    expect(response.status).toBe(500);
    expect(PublicationService.getPublication).toHaveBeenCalledWith(
      publicationGuid,
    );
  });

  it("accepts an uppercase UUID", async () => {
    const uppercaseGuid = publicationGuid.toUpperCase();

    const publication = {
      publication_guid: uppercaseGuid,
      title: "Geology of British Columbia",
      geometry: null,
    };

    vi.spyOn(PublicationService, "getPublication").mockResolvedValue(
      publication as any,
    );

    const response = await request(app).get(`/publications/${uppercaseGuid}`);

    expect(response.status).toBe(200);
    expect(PublicationService.getPublication).toHaveBeenCalledWith(
      uppercaseGuid,
    );
  });
});
