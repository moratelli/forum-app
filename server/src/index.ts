import express from "express";
import session from "express-session";
import connectRedis from "connect-redis";
import Redis from "ioredis";
import { createConnection } from "typeorm";
import { login, logout, register } from "./repo/UserRepo";
import bodyParser from "body-parser";
import { createThread, getThreadsByCategoryId } from "./repo/ThreadRepo";
import { createThreadItem, getThreadItemsByThreadId } from "./repo/ThreadItemRepo";

console.log(process.env.NODE_ENV);
require("dotenv").config();

declare module "express-session" {
  export interface Session {
    userId: string | undefined | null;
    loadedCount: number;
  }
}

const main = async () => {
  const app = express();
  const router = express.Router();

  await createConnection();

  const redis = new Redis({
    port: Number(process.env.REDIS_PORT),
    host: process.env.REDIS_HOST,
    password: process.env.REDIS_PASSWORD,
  });
  const RedisStore = connectRedis(session);
  const redisStore = new RedisStore({
    client: redis,
  });

  app.use(bodyParser.json()); //  false deprecated flag: https://github.com/DefinitelyTyped/DefinitelyTyped/pull/54254
  app.use(
    session({
      store: redisStore,
      name: process.env.COOKIE_NAME,
      sameSite: "Strict",
      secret: String(process.env.SESSION_SECRET),
      resave: false,
      saveUninitialized: false,
      cookie: {
        path: "/",
        httpOnly: true,
        secure: false,
        maxAge: 1000 * 60 * 60 * 24,
      },
    } as any)
  );

  app.use(router);
  router.get("/", (req, res, next) => {
    if (!req.session!.userId) {
      req.session!.userId = String(req.query.userId);
      console.log("UserID is set!");
      req.session!.loadedCount = 0;
    } else {
      req.session!.loadedCount = req.session!.loadedCount + 1;
    }

    res.send(`userId: ${req.session!.userId}, loadedCount: ${req.session!.loadedCount}`);
  });

  router.post("/register", async (req, res, next) => {
    try {
      console.log("params", req.body);

      const { email, userName, password } = req.body;
      const userResult = await register(email, userName, password);
      if (userResult && userResult.user) {
        res.send(`New user created! UserID: ${userResult.user.id}`);
      } else if (userResult && userResult.messages) {
        res.send(userResult.messages[0]);
      } else {
        next();
      }
    } catch (err) {
      res.send(err.message); // in the real world, this could is a security issue! dont send error msgs to users in prod.
    }
  });

  router.post("/login", async (req, res, next) => {
    try {
      console.log("params", req.body);

      const { userName, password } = req.body;
      const userResult = await login(userName, password);
      if (userResult && userResult.user) {
        req.session!.userId = userResult.user?.id;
        res.send(`User logged in! UserID: ${req.session.userId}`);
      } else if (userResult && userResult.messages) {
        res.send(userResult.messages[0]);
      } else {
        next();
      }
    } catch (err) {
      res.send(err.message);
    }
  });

  router.post("/logout", async (req, res, next) => {
    try {
      console.log("params", req.body);

      const { userName } = req.body;
      const message = await logout(userName);
      if (message) {
        //  needs to change in the future: userId should be undefined
        req.session!.userId = "";
        res.send(message);
      } else {
        next();
      }
    } catch (err) {
      console.log(err);
      res.send(err.message);
    }
  });

  router.post("/createthread", async (req, res, next) => {
    try {
      const { userId } = req.session!;
      const { categoryId, title, body } = req.body;
      console.log("userId", req.session);
      console.log("body", req.body);

      const message = await createThread(userId, categoryId, title, body);
      res.send(message);
    } catch (err) {
      res.send(err.message);
    }
  });

  router.post("/threadsbycategory", async (req, res, next) => {
    try {
      const { categoryId } = req.body;
      const threadResult = await getThreadsByCategoryId(categoryId);
      if (threadResult && threadResult.entities) {
        let items = "";
        threadResult.entities.forEach((thread) => {
          items += thread.title + ", ";
        });
        res.send(items);
      } else if (threadResult && threadResult.messages) {
        res.send(threadResult.messages[0]);
      }
    } catch (err) {
      console.log(err);
      res.send(err.message);
    }
  });

  router.post("/createthreaditem", async (req, res, next) => {
    try {
      const { userId } = req.session!;
      const { threadId, body } = req.body;
      const message = await createThreadItem(userId, threadId, body);
      res.send(message);
    } catch (err) {
      console.log(err);
      res.send(err.message);
    }
  });

  router.post("/threadsitemsbythread", async (req, res, next) => {
    try {
      const { threadId } = req.body;
      const threadItemResult = await getThreadItemsByThreadId(threadId);

      if (threadItemResult && threadItemResult.entities) {
        let items = "";
        threadItemResult.entities.forEach((threadItem) => {
          items += threadItem.body + ", ";
        });
        res.send(items);
      } else if (threadItemResult && threadItemResult.messages) {
        res.send(threadItemResult.messages[0]);
      }
    } catch (err) {
      console.log(err);
      res.send(err.message);
    }
  });

  app.listen({ port: process.env.SERVER_PORT }, () => {
    console.log(`Server ready on port ${process.env.SERVER_PORT}`);
  });
};

main();
