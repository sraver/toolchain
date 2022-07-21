/* eslint-disable @typescript-eslint/naming-convention */
/* tslint:disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

export interface PolywrapManifest {
  /**
   * Polywrap manifest format version.
   */
  format: "0.1.1";
  /**
   * Name of this wrapper package.
   */
  name: string;
  /**
   * Path to the wrapper build manifest file.
   */
  build?: string;
  /**
   * Path to wrapper metadata manifest file.
   */
  meta?: string;
  /**
   * Path to wrapper deploy manifest file.
   */
  deploy?: string;
  /**
   * Language in which the source code is written.
   */
  language: string;
  /**
   * Path to the module's entry point.
   */
  module?: string;
  /**
   * Path to the module's graphql schema.
   */
  schema: string;
  /**
   * Redirects for the schema's imports.
   */
  import_redirects?: {
    /**
     * Import URI to be redirected.
     */
    uri: string;
    /**
     * Path to a WRAP manifest to be used for the import.
     */
    info: string;
  }[];
  __type: "PolywrapManifest";
}
