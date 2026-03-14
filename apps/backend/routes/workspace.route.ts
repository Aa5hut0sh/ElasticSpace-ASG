import { Router } from "express";
import * as workspaceController from "../controllers/workspace.controller"
import { authenticate } from "../middlewares/authentication.middleware";
const route = Router();

route.post("/start" , authenticate , workspaceController.startMachine );
route.post("/stop",authenticate ,workspaceController.stopMachine );
route.post("/get-machines",authenticate , workspaceController.getMachine);
route.post("/register", workspaceController.registerMachine);
route.post("/haertbeat", workspaceController.machineHeartbeat);

export default route;