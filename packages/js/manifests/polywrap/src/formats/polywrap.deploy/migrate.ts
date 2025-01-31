/* eslint-disable */
/**
 * This file was automatically generated by scripts/manifest/migrate-ts.mustache.
 * DO NOT MODIFY IT BY HAND. Instead, modify scripts/manifest/migrate-ts.mustache,
 * and run node ./scripts/manifest/generateFormatTypes.js to regenerate this file.
 */
import {
  AnyDeployManifest,
  DeployManifest,
  DeployManifestFormats,
} from ".";
import { findShortestMigrationPath } from "../../migrations";
import { migrators } from "./migrators";

export function migrateDeployManifest(
  manifest: AnyDeployManifest,
  to: DeployManifestFormats
): DeployManifest {
  let from = manifest.format as DeployManifestFormats;

  if (!(Object.values(DeployManifestFormats).some(x => x === from))) {
    throw new Error(`Unrecognized DeployManifestFormat "${manifest.format}"`);
  }

  if (!(Object.values(DeployManifestFormats).some(x => x === to))) {
    throw new Error(`Unrecognized DeployManifestFormat "${to}"`);
  }

  const migrationPath = findShortestMigrationPath(migrators, from, to);
  if (!migrationPath) {
    throw new Error(
      `Migration path from DeployManifestFormat "${from}" to "${to}" is not available`
    );
  }

  let newManifest = manifest;

  for(const migrator of migrationPath){
    newManifest = migrator.migrate(newManifest) as AnyDeployManifest;
  }

  return newManifest as DeployManifest;
}
