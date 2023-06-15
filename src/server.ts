import Koa from "koa";
import bodyParser from "koa-body";
import { join, basename } from "path";

import { createIfNotExists, getFile, listPlugins } from "./plugins";
import { execute } from "./execute";

const app = new Koa();

app.use(
  bodyParser({
    formidable: {
      uploadDir: join(__dirname, "plugins"),
      keepExtensions: true,
      filename: (name, file) => {
        return `${name}.zip`;
      },
    },
    multipart: true,
    urlencoded: true,
  })
);

app.use(async (ctx) => {
  const path = ctx.path;
  const method = ctx.method;

  await createIfNotExists();

  if (path === "/plugins") {
    // List plugins
    const plugins = await listPlugins();

    ctx.body = plugins;
  } else if (path.startsWith("/plugins")) {
    // Serve plugins from directory
    const path = ctx.path.replace("/plugins/", "");

    try {
      const file = await getFile(path);
      ctx.body = file;
    } catch (e) {
      ctx.status = 404;
      ctx.body = "Not found";
    }
  } else if (path === "/upload" && method === "POST") {
    // Get the uploaded zip file, extract it, and move it to the plugins directory

    const file = ctx.request.files?.file;

    if (!file) {
      ctx.status = 400;
      ctx.body = "No file uploaded";
      return;
    }

    if (file instanceof Array) {
      ctx.status = 400;
      ctx.body = "No file uploaded";
      return;
    }

    if (!file.originalFilename?.endsWith(".zip")) {
      ctx.status = 400;
      ctx.body = "Only zip files are allowed";
      return;
    }

    const pluginName = basename(file.originalFilename, ".zip");
    const pluginsDir = join(__dirname, "plugins");
    const pluginDir = join(pluginsDir, `${pluginName}`);

    // Extract the zip file
    await execute(
      `cd ${join(
        __dirname,
        "..",
        "plugins"
      )} && unzip -o ${pluginName}.zip -d ${pluginDir}`
    );

    // Delete the zip file
    await execute(`rm ${join(pluginsDir, `${pluginName}.zip`)}`);

    ctx.body = "Uploaded";
  }
});

app.listen(3000);
