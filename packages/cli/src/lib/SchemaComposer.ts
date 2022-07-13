/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-empty-function */

import { Project, AnyProjectManifest } from "./";

import { Uri, PolywrapClient } from "@polywrap/client-js";
import {
  composeSchema,
  ComposerOptions,
  SchemaFile,
} from "@polywrap/schema-compose";
import fs from "fs";
import path from "path";
import * as gluegun from "gluegun";
import { Abi } from "@polywrap/schema-parse";
import { deserializeWrapManifest } from "@polywrap/wrap-manifest-types-js";

export interface SchemaComposerConfig {
  project: Project<AnyProjectManifest>;
  client: PolywrapClient;
}

export class SchemaComposer {
  private _client: PolywrapClient;
  private _composerOutput: Abi | undefined;

  constructor(private _config: SchemaComposerConfig) {
    this._client = this._config.client;
  }

  public async getComposedAbis(): Promise<Abi> {
    if (this._composerOutput) {
      return Promise.resolve(this._composerOutput);
    }

    const { project } = this._config;

    const schemaNamedPath = await project.getSchemaNamedPath();
    const import_redirects = await project.getImportRedirects();

    const getSchemaFile = (schemaPath?: string): SchemaFile | undefined =>
      schemaPath
        ? {
            schema: this._fetchLocalSchema(schemaPath),
            absolutePath: schemaPath,
          }
        : undefined;
    const schemaFile = getSchemaFile(schemaNamedPath);
    if (!schemaFile) {
      throw Error(`Schema cannot be loaded at path: ${schemaNamedPath}`);
    }

    const options: ComposerOptions = {
      manifest: schemaFile,
      resolvers: {
        external: (uri: string) =>
          this._fetchExternalSchema(uri, import_redirects),
        local: (path: string) => Promise.resolve(this._fetchLocalSchema(path)),
      },
    };

    this._composerOutput = await composeSchema(options);
    return this._composerOutput;
  }

  public reset(): void {
    this._composerOutput = undefined;
  }

  private async _fetchExternalSchema(
    uri: string,
    import_redirects?: {
      uri: string;
      schema: string;
    }[]
  ): Promise<Abi> {
    // Check to see if we have any import redirects that match
    if (import_redirects) {
      for (const redirect of import_redirects) {
        const redirectUri = new Uri(redirect.uri);
        const uriParsed = new Uri(uri);

        if (Uri.equals(redirectUri, uriParsed)) {
          const manifest = fs.readFileSync(
            path.join(this._config.project.getManifestDir(), redirect.schema)
          );
          // TODO: Remove this once ABI JSON Schema has been implemented
          return (deserializeWrapManifest(manifest).abi as unknown) as Abi;
        }
      }
    }

    try {
      const manifest = await this._client.getManifest(new Uri(uri));
      return manifest.abi;
    } catch (e) {
      gluegun.print.error(e);
      throw e;
    }
  }

  private _fetchLocalSchema(schemaPath: string) {
    return fs.readFileSync(
      path.isAbsolute(schemaPath)
        ? schemaPath
        : path.join(this._config.project.getManifestDir(), schemaPath),
      "utf-8"
    );
  }
}
