/* eslint-disable prefer-const */
import { CodeGenerator, Project, SchemaComposer } from "../lib";
import { intlMsg } from "../lib/intl";
import {
  fixParameters,
  loadAppManifest,
  resolvePathIfExists,
  defaultAppManifest
} from "../lib/helpers";
import { getSimpleClient, getDefaultProviders } from "../lib/helpers/client";
import { ExternalWeb3ApiProject } from "../lib/project/ExternalWeb3ApiProject";
import { ExternalPluginProject } from "../lib/project/ExternalPluginProject";

import chalk from "chalk";
import { GluegunToolbox, GluegunPrint } from "gluegun";
import { Uri, Web3ApiClient } from "@web3api/client-js";
import { AppManifest } from "@web3api/core-js";
import * as path from "path";
import fs from "fs";
import rimraf from "rimraf";

interface AppGenFiles {
  package: string;
  app: string;
}

interface LangGenFiles {
  types: AppGenFiles;
  extension: AppGenFiles;
}

interface AppLangSupport {
  [lang: string]: LangGenFiles;
}

const langSupport: AppLangSupport = {
  "app/typescript": {
    types: {
      package:
        __dirname + "/../lib/codegen-templates/app/types/package-ts.gen.js",
      app: __dirname + "/../lib/codegen-templates/app/types/app-ts.gen.js",
    },
    extension: {
      package:
        __dirname +
        "/../lib/codegen-templates/app/polywrap-app/package-ts.gen.js",
      app:
        __dirname +
        "/../lib/codegen-templates/app/polywrap-app/app-ts.gen.js",
    },
  },
};

const commands = ["codegen"];
const defaultOutputTypesDir = "./polywrap";
const cmdStr = intlMsg.commands_app_options_command();
const optionsStr = intlMsg.commands_options_options();
const codegenStr = intlMsg.commands_app_codegen();
const defaultManifestStr = defaultAppManifest.join(" | ");
const outputTypesDirStr = `${intlMsg.commands_app_options_o({
  default: `${defaultOutputTypesDir}/`,
})}`;
const nodeStr = intlMsg.commands_codegen_options_i_node();
const pathStr = intlMsg.commands_codegen_options_o_path();
const addrStr = intlMsg.commands_codegen_options_e_address();

const HELP = `
${chalk.bold("w3 app")} ${cmdStr} [${optionsStr}]

Commands:
  ${chalk.bold("codegen")}   ${codegenStr}

Options:
  -h, --help                              ${intlMsg.commands_codegen_options_h()}
  -m, --manifest-file <${pathStr}>              ${intlMsg.commands_codegen_options_m()}: ${defaultManifestStr})
  -o, --output-types-dir <${pathStr}>                 ${outputTypesDirStr}
  -i, --ipfs [<${nodeStr}>]                     ${intlMsg.commands_codegen_options_i()}
  -e, --ens [<${addrStr}>]                   ${intlMsg.commands_codegen_options_e()}
`;

export default {
  alias: ["a"],
  description: intlMsg.commands_app_description(),
  run: async (toolbox: GluegunToolbox): Promise<void> => {
    const { filesystem, parameters, print, middleware } = toolbox;

    // Options
    let {
      help,
      manifestFile,
      outputDir,
      ipfs,
      ens,
    } = parameters.options;
    const { h, m, o, i, e } = parameters.options;

    help = help || h;
    manifestFile = manifestFile || m;
    outputDir = outputDir || o;
    ipfs = ipfs || i;
    ens = ens || e;

    let command = "";
    try {
      const params = parameters;
      [command] = fixParameters(
        {
          options: params.options,
          array: params.array,
        },
        {
          h,
          help,
        }
      );
    } catch (e) {
      print.error(e.message);
      process.exitCode = 1;
      return;
    }

    const paramsValid = validateAppParams(
      print,
      command,
      outputDir,
      ens
    );

    if (help || !paramsValid) {
      print.info(HELP);
      if (!paramsValid) {
        process.exitCode = 1;
      }
      return;
    }

    // Run Middleware
    await middleware.run({
      name: toolbox.command?.name,
      options: { help, manifestFile, outputDir, ipfs, ens },
    });

    // Resolve manifest
    manifestFile = resolvePathIfExists(
      filesystem,
      manifestFile ? [manifestFile] : defaultAppManifest
    );

    // App project
    const manifestDir: string = path.dirname(manifestFile);
    const appManifest: AppManifest = await loadAppManifest(
      manifestFile,
      true
    );

    // Validate app manifest's language
    const language: string = appManifest.language;
    Project.validateManifestLanguage(language, ["app/"]);

    // Transform packages
    const packages = appManifest.packages.map((pack) => ({
      uri: sanitizeUri(pack.uri, pack.isPlugin),
      namespace: pack.namespace,
      isPlugin: pack.isPlugin,
    }));

    // types:
    //   directory:
    const outputDirFromManifest: string | undefined =
      appManifest.types.directory;

    //   withExtensions:
    const withExtensions: boolean | undefined = appManifest.types.withExtensions;

    // Resolve output directory
    if (outputDir) {
      outputDir = filesystem.resolve(outputDir);
    } else if (outputDirFromManifest) {
      outputDir = filesystem.resolve(outputDirFromManifest);
    } else {
      outputDir = filesystem.resolve(defaultOutputTypesDir);
    }

    // Check for duplicate namespaces
    const nsNoDupes: string[] = packages
      .map((pack) => pack.namespace)
      .filter((ns, i, arr) => arr.indexOf(ns) === i);
    if (packages.length !== nsNoDupes.length) {
      print.error(intlMsg.commands_app_error_duplicateNs());
      return;
    }

    // Resolve generation file
    const langGenFiles: LangGenFiles = langSupport[language];
    const genFiles: AppGenFiles = withExtensions
      ? langGenFiles.extension
      : langGenFiles.types;
    // TODO: does "genFiles.package/app" make sense?
    const packageScript = filesystem.resolve(genFiles.package);
    const appScript = filesystem.resolve(genFiles.app);

    // Get providers and client
    const { ipfsProvider, ethProvider } = await getDefaultProviders(ipfs);
    const ensAddress: string | undefined = ens;
    const client: Web3ApiClient = getSimpleClient({
      ensAddress,
      ethProvider,
      ipfsProvider,
    });

    // Generate code for each Polywrap package
    let result = true;
    for (let i = 0; i < packages.length; i++) {
      const { uri, namespace, isPlugin } = packages[i];

      const project: Project = isPlugin
        ? new ExternalPluginProject({
            rootPath: manifestDir,
            uri,
            namespace,
            language,
          })
        : new ExternalWeb3ApiProject({
            rootPath: manifestDir,
            uri,
            namespace,
            client,
          });

      const schemaComposer = new SchemaComposer({
        project,
        client,
      });

      const namespaceCodeGenerator = new CodeGenerator({
        project,
        schemaComposer,
        customScript: packageScript,
        outputDir: path.join(outputDir, namespace),
        mustacheView: { uri, namespace },
      });

      if (await namespaceCodeGenerator.generate()) {
        print.success(
          `🔥 ${intlMsg.commands_app_namespace_success({
            content: withExtensions ? "extension" : "types",
            namespace,
          })} 🔥`
        );
      } else {
        result = false;
      }

      // generate shared files on final package
      if (i === packages.length - 1) {
        const appCodeGenerator = new CodeGenerator({
          project,
          schemaComposer,
          customScript: appScript,
          outputDir: path.join(outputDir, namespace),
          mustacheView: { packages },
        });

        if (await appCodeGenerator.generate()) {
          print.success(`🔥 ${intlMsg.commands_app_topLevel_success()} 🔥`);
        } else {
          result = false;
        }
      }

      project.reset();
    }

    // clear empty cache folders
    const cacheDirRoot: string = path.join(manifestDir, ".w3");
    const cacheDir: string = path.join(cacheDirRoot, "ExternalProjects");
    if (await isEmptyDir(cacheDir)) {
      rimraf.sync(cacheDir);
    }
    if (await isEmptyDir(cacheDirRoot)) {
      rimraf.sync(cacheDirRoot);
    }

    if (result) {
      print.success(`🔥 ${intlMsg.commands_app_success()} 🔥`);
      process.exitCode = 0;
    } else {
      process.exitCode = 1;
    }
  },
};

// TODO: move these helpers
// could go in the app manifest validators
// Rename: createPluginUri? should this be the "plugin URI"?
function sanitizeUri(uri: string, isPlugin?: boolean): Uri {
  let result: Uri;
  try {
    result = new Uri(uri);
  } catch (e) {
    // check if the uri is a filepath without a fs/ prefix
    if (!fs.existsSync(uri)) {
      throw e;
    }
    result = new Uri(`w3://fs/${uri}`);
  }

  // convert to absolute path
  if (result.authority === "fs") {
    result = new Uri(`w3://fs/${path.resolve(result.path)}`);
    // plugins must use a filepath uri
  } else if (isPlugin) {
    throw Error(
      `${intlMsg.lib_project_plugin_uri_support()}\n` +
        `w3://fs/./node_modules/myPlugin/\n` +
        `fs/./node_modules/myPlugin/\n` +
        `./node_modules/myPlugin/\n\n` +
        `${intlMsg.lib_project_invalid_uri()}: ${uri}`
    );
  }
  return result;
}

async function isEmptyDir(path: string): Promise<boolean> {
  if (!fs.existsSync(path)) {
    return false;
  }
  const dir = await fs.promises.opendir(path);
  const file = await dir.read();
  await dir.close();
  return file === null;
}
// TODO: move these helpers

function validateAppParams(
  print: GluegunPrint,
  command: unknown,
  outputDir: unknown,
  ens: unknown
): boolean {

  if (!command || typeof command !== "string") {
    print.error(intlMsg.commands_app_error_noCommand());
    return false;
  } else if (commands.indexOf(command) === -1) {
    print.error(intlMsg.commands_app_error_unknownCommand({ command }));
    return false;
  }

  if (outputDir === true) {
    const outputDirMissingPathMessage = intlMsg.commands_codegen_error_outputDirMissingPath(
      {
        option: "--output-dir",
        argument: `<${pathStr}>`,
      }
    );
    print.error(outputDirMissingPathMessage);
    return false;
  }

  if (ens === true) {
    const domStr = intlMsg.commands_codegen_error_domain();
    const ensAddressMissingMessage = intlMsg.commands_codegen_error_testEnsAddressMissing(
      {
        option: "--ens",
        argument: `<[${addrStr},]${domStr}>`,
      }
    );
    print.error(ensAddressMissingMessage);
    return false;
  }

  return true;
}
