import { Router } from "express";
import * as userController from "../controllers/user.controller"
import { authenticate } from "../middlewares/authentication.middleware";
const route = Router();

route.post("/signup" , userController.signup);
route.post("/login" , userController.login);
route.post("/logout" , userController.logout);
route.get("/me",authenticate, userController.getUser);


export default route;