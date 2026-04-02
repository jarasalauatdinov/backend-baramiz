import { Router } from "express";
import { login, logout, me, register } from "../controllers/auth.controller";
import { asyncHandler } from "../utils/async-handler";

const authRouter = Router();

authRouter.post("/register", asyncHandler(register));
authRouter.post("/login", asyncHandler(login));
authRouter.get("/me", asyncHandler(me));
authRouter.post("/logout", asyncHandler(logout));

export default authRouter;
