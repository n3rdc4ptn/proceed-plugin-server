import { readdir, stat, mkdir, readFile } from "fs/promises";
import { join } from "path";

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

  const plugins = await readdir(pluginsDirectory);

  return plugins.filter((plugin) => !plugin.endsWith(".zip"));
}

export async function getFile(path: string) {
  await createIfNotExists();

  return await readFile(`${pluginsDirectory}/${path}`);
}
