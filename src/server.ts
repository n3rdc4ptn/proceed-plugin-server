import Koa from "koa";
import serve from "koa-static";
import Router from "@koa/router";
import bodyParser from "koa-body";
import { join, basename } from "path";

import {
  createIfNotExists,
  getFile,
  installPlugin,
  listPlugins,
} from "./plugins";
import { execute } from "./execute";
import mount from "koa-mount";

const app = new Koa();

const router = new Router();

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

app.use(async (ctx, next) => {
  await createIfNotExists();
  await next();

  ctx.set("Access-Control-Allow-Origin", "*");
});

app.use(mount("/plugins", serve(join(__dirname, "plugins"))));

router.get("/plugins", async (ctx, next) => {
  // List plugins
  const plugins = await listPlugins();

  ctx.body = plugins;
});

router.post("/upload", async (ctx, next) => {
  // Get the uploaded zip file, extract it, and move it to the plugins directory

  const file =
    ctx.request.files instanceof Array
      ? ctx.request.files[0]?.file
      : ctx.request.files?.file;

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

  console.log(file);

  const pluginName = basename(file.originalFilename, ".zip");

  await installPlugin(file.filepath);

  ctx.body = `Uploaded & Installed ${pluginName}`;
});

app.use(router.routes());
app.use(router.allowedMethods());

app.listen(3333);
