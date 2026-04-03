import { Router } from "express";
import adminPlacesRouter from "./admin-places.routes";
import adminServiceRouter from "./admin-service.routes";
import adminTranslateRouter from "./admin-translate.routes";
import authRouter from "./auth.routes";
import categoriesRouter from "./categories.routes";
import chatRouter from "./chat.routes";
import eventsRouter from "./events.routes";
import guidesRouter from "./guides.routes";
import healthRouter from "./health.routes";
import placesRouter from "./places.routes";
import routesRouter from "./routes.routes";
import serviceRouter from "./service.routes";
import servicesRouter from "./services.routes";

const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/categories", categoriesRouter);
apiRouter.use("/places", placesRouter);
apiRouter.use("/guides", guidesRouter);
apiRouter.use("/services", servicesRouter);
apiRouter.use("/events", eventsRouter);
apiRouter.use("/service", serviceRouter);
apiRouter.use("/routes", routesRouter);
apiRouter.use("/chat", chatRouter);
apiRouter.use("/admin/places", adminPlacesRouter);
apiRouter.use("/admin/service", adminServiceRouter);
apiRouter.use("/admin/translate", adminTranslateRouter);

export default apiRouter;
