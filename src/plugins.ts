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

  return await readdir(pluginsDirectory);
}

export async function getFile(path: string) {
  await createIfNotExists();

  return await readFile(`${pluginsDirectory}/${path}`);
}
