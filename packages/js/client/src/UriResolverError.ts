import { IUriResolutionContext } from "@polywrap/core-js";
import { buildCleanUriHistory } from "@polywrap/uri-resolvers-js";

export class UriResolverError<
  TError extends unknown = undefined
> extends Error {
  constructor(
    public readonly resolverError: TError,
    resolutionContext: IUriResolutionContext
  ) {
    super(
      `An internal resolver error occurred while resolving a URI.\nResolution Stack: ${JSON.stringify(
        buildCleanUriHistory(resolutionContext.getHistory()),
        null,
        2
      )}`
    );
  }
}
