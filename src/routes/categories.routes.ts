import { Router } from "express";
import { listCategories } from "../controllers/categories.controller";

const categoriesRouter = Router();

categoriesRouter.get("/", listCategories);

export default categoriesRouter;
