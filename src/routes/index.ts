import { Router } from "express";
import adminPlacesRouter from "./admin-places.routes";
import adminTranslateRouter from "./admin-translate.routes";
import authRouter from "./auth.routes";
import categoriesRouter from "./categories.routes";
import chatRouter from "./chat.routes";
import healthRouter from "./health.routes";
import placesRouter from "./places.routes";
import routesRouter from "./routes.routes";

const apiRouter = Router();

apiRouter.use("/admin/places", adminPlacesRouter);
apiRouter.use("/admin/translate", adminTranslateRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/health", healthRouter);
apiRouter.use("/categories", categoriesRouter);
apiRouter.use("/places", placesRouter);
apiRouter.use("/routes", routesRouter);
apiRouter.use("/chat", chatRouter);

export default apiRouter;
