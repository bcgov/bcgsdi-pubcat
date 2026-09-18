import { publication } from "../generated/prisma/client.js";
import { ApiPublication } from "../types/publication.js";

export const PublicationAdapter = {
  toApi(publication: publication): ApiPublication {
    return {
      ...publication,
      geometry: null,
    };
  },
};
