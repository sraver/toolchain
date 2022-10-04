/* eslint-disable */
/**
 * This file was automatically generated by scripts/manifest/migrate-ts.mustache.
 * DO NOT MODIFY IT BY HAND. Instead, modify scripts/manifest/migrate-ts.mustache,
 * and run node ./scripts/manifest/generateFormatTypes.js to regenerate this file.
 */
import {
  AnyBuildManifest,
  BuildManifest,
  BuildManifestFormats,
  latestBuildManifestFormat
} from ".";
import { findShortestMigrationPath } from "../../migrations";
import { migrators } from "./migrators";

import {
  migrate as migrate_0_1_0_to_0_2_0
} from "./migrators/0.1.0_to_0.2.0";

type Migrator = {
  [key in BuildManifestFormats]?: (m: AnyBuildManifest) => BuildManifest;
};

export const migrators: Migrator = {
  "0.1.0": migrate_0_1_0_to_0_2_0,
};

export function migrateBuildManifest(
  manifest: AnyBuildManifest,
  to: BuildManifestFormats
): BuildManifest {
  let from = manifest.format as BuildManifestFormats;

  if (from === latestBuildManifestFormat) {
    return manifest as BuildManifest;
  }

  if (!(Object.values(BuildManifestFormats).some(x => x === from))) {
    throw new Error(`Unrecognized BuildManifestFormat "${manifest.format}"`);
  }

  const migrationPath = findShortestMigrationPath(migrators, from, to);
  if (!migrationPath) {
    throw new Error(
      `Migration path from BuildManifestFormat "${from}" to "${to}" is not available`
    );
  }

  let newManifest = manifest;

  for(const migrator of migrationPath){
    newManifest = migrator.migrate(newManifest) as AnyBuildManifest;
  }

  return newManifest as BuildManifest;
}
