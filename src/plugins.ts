import { readdir, stat, mkdir, readFile } from "fs/promises";
import { join } from "path";
import { execute } from "./execute";

import YAML from "yaml";

const pluginsDirectory = join(__dirname, "./plugins");

export async function createIfNotExists() {
  try {
    await stat(pluginsDirectory);
  } catch (e) {
    await mkdir(pluginsDirectory);
  }
}

export async function listPlugins() {
  await createIfNotExists();

  const plugins = await (
    await readdir(pluginsDirectory)
  )
    .filter((plugin) => !plugin.endsWith(".zip") && !plugin.startsWith("tmp-"))
    .map(async (pluginDir) => {
      const pluginPath = join(pluginsDirectory, pluginDir);
      // Check if a manifest file with the name manifest.yml exists in the temp directory
      const manifestFile = await readdir(pluginPath);
      if (!manifestFile.includes("manifest.yml")) {
        throw new Error("No manifest file found");
      }

      const manifest = YAML.parse(
        await readFile(join(pluginPath, "manifest.yml"), "utf8")
      );

      return {
        name: manifest.name,
        bundle: manifest.bundle,
        description: manifest.description,
        version: manifest.version,
      };
    });

  return await Promise.all(plugins);
}

export async function getFile(path: string) {
  await createIfNotExists();

  return await readFile(`${pluginsDirectory}/${path}`);
}

export async function installPlugin(uploadedFilePath: string) {
  // Method to generate random id for temporary file name
  function makeid(length: number) {
    let result = "";
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
  }

  const tempPluginDirectory = join(pluginsDirectory, `tmp-${makeid(10)}`);
  console.log(tempPluginDirectory);

  // Extract the zip file
  await execute(
    `cd ${join(__dirname, "plugins")} && unzip -o ${join(
      uploadedFilePath
    )} -d ${tempPluginDirectory}`
  );

  // Check if a manifest file with the name manifest.yml exists in the temp directory
  const manifestFile = await readdir(tempPluginDirectory);
  if (!manifestFile.includes("manifest.yml")) {
    throw new Error("No manifest file found");
  }

  // Delete the zip file
  await execute(`rm ${join(uploadedFilePath)}`);

  const manifest = YAML.parse(
    await readFile(join(tempPluginDirectory, "manifest.yml"), "utf8")
  );

  const { name, bundle } = manifest;

  // Name the new plugin directory based on the bundle id
  const newPluginDirectory = join(pluginsDirectory, bundle);

  // Copy the temporary directory to the new one
  await execute(`rm -r ${newPluginDirectory} &`);
  await execute(`mv ${tempPluginDirectory} ${newPluginDirectory}`);

  // Finished installing
}
