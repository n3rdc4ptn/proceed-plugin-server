import { readdir, stat, mkdir, readFile } from "fs/promises";

const pluginsDirectory = "./plugins";

async function createIfNotExists() {
  try {
    await stat(pluginsDirectory);
  } catch (e) {
    await mkdir(pluginsDirectory);
  }
}

export async function listPlugins() {
  await createIfNotExists();

  const plugins = await readdir(pluginsDirectory);

  return plugins.filter((plugin) => !plugin.startsWith("."));
}

export async function getFile(path: string) {
  await createIfNotExists();

  return await readFile(`${pluginsDirectory}/${path}`);
}
