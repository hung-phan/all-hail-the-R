/* @flow */
/* global process */
import cors from "koa-cors";
import logger from "koa-logger";
import bodyParser from "koa-bodyparser";
import htmlMinifier from "koa-html-minifier2";
import router from "koa-router";
import conditionalGet from "koa-conditional-get";
import etag from "koa-etag";
import CSRF from "koa-csrf";
import convert from "koa-convert";
import session from "koa-session";
import compress from "koa-compress";
import helmet from "koa-helmet";
import graphqlHTTP from "koa-graphql";
import settings from "../settings";
import error from "./error";

export const loggingLayer = (app: Object) => {
  if (process.env.NODE_ENV === "development") {
    app.use(logger()); // https://github.com/koajs/logger
  }
};

export const initialLayer = (app: Object) =>
  app
    .use(bodyParser())
    .use(conditionalGet())
    .use(etag()); // https://github.com/koajs/bodyparser // https://github.com/koajs/conditional-get // https://github.com/koajs/etag

export const apiLayer = (app: Object, schema: Object, apiRoutes: Function) => {
  const newRouter = router();

  newRouter.use(convert(cors())); // https://github.com/koajs/cors

  apiRoutes(newRouter);

  newRouter.post(
    "/graphql",
    graphqlHTTP({
      schema,
      pretty: process.env.NODE_ENV === "development"
    })
  );

  app.use(newRouter.routes()).use(newRouter.allowedMethods());

  return newRouter;
};

export const assetsLayer = (app: Object) => {
  if (!process.env.SERVER_STATIC_ASSETS) {
    const staticAssets = require("koa-static");

    app.use(
      staticAssets(settings.path.PUBLIC, { gzip: true, maxage: 31536000 })
    ); // https://github.com/koajs/static
  }
};

export const securityLayer = (app: Object) => {
  app.keys = [process.env.SECRET_KEY];

  const csrf = new CSRF();

  app
    .use(session({ maxAge: 86400000 }, app)) // https://github.com/koajs/session
    .use((ctx, next) => {
      // don't check csrf for request coming from the server
      if (ctx.get("x-app-secret") === process.env.SECRET_KEY) {
        return next();
      }

      return csrf(ctx, next);
    }) // https://github.com/koajs/csrf
    .use(helmet()); // https://github.com/venables/koa-helmet
};

export const renderLayer = (app: Object, templateRoutes: Function) => {
  const newRouter = router();

  newRouter
    .use(
      htmlMinifier({
        collapseWhitespace: true,
        removeComments: true,
        preserveLineBreaks: false,
        removeEmptyAttributes: false,
        removeIgnored: true
      })
    ) // https://github.com/kangax/html-minifier
    .use(compress()); // https://github.com/koajs/compress

  templateRoutes(newRouter);

  app.use(newRouter.routes()).use(newRouter.allowedMethods());

  return newRouter;
};

export const errorLayer = (app: Object) => app.use(error);
