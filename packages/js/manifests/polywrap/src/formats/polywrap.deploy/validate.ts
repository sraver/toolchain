/* eslint-disable */
/**
 * This file was automatically generated by scripts/manifest/validate-ts.mustache.
 * DO NOT MODIFY IT BY HAND. Instead, modify scripts/manifest/validate-ts.mustache,
 * and run node ./scripts/manifest/generateFormatTypes.js to regenerate this file.
 */
import {
  AnyDeployManifest,
  DeployManifestFormats
} from ".";

import DeployManifestSchema_0_1_0 from "@polywrap/polywrap-manifest-schemas/formats/polywrap.deploy/0.1.0.json";
import DeployManifestSchema_0_2_0 from "@polywrap/polywrap-manifest-schemas/formats/polywrap.deploy/0.2.0.json";

import {
  Schema,
  Validator,
  ValidationError,
  ValidatorResult
} from "jsonschema";

type DeployManifestSchemas = {
  [key in DeployManifestFormats]: Schema | undefined
};

const schemas: DeployManifestSchemas = {
  // NOTE: Patch fix for backwards compatability
  "0.1": DeployManifestSchema_0_1_0,
  "0.1.0": DeployManifestSchema_0_1_0,
  "0.2.0": DeployManifestSchema_0_2_0,
};

const validator = new Validator();


export function validateDeployManifest(
  manifest: AnyDeployManifest,
  extSchema: Schema | undefined = undefined
): void {
  const schema = schemas[manifest.format as DeployManifestFormats];

  if (!schema) {
    throw Error(`Unrecognized DeployManifest schema format "${manifest.format}"\nmanifest: ${JSON.stringify(manifest, null, 2)}`);
  }

  const throwIfErrors = (result: ValidatorResult) => {
    if (result.errors.length) {
      throw new Error([
        `Validation errors encountered while sanitizing DeployManifest format ${manifest.format}`,
        ...result.errors.map((error: ValidationError) => error.toString())
      ].join("\n"));
    }
  };

  throwIfErrors(validator.validate(manifest, schema));

  if (extSchema) {
    throwIfErrors(validator.validate(manifest, extSchema));
  }
}
