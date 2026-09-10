import { publication_flattened } from "../generated/prisma/client.js";
import { ApiPublication } from "../types/publication.js";

export const PublicationAdapter = {
  toApi(publicationFlattened: publication_flattened): ApiPublication {
    return {
      ...publicationFlattened,
      geometry: null,
    };
  },
};
