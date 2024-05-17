import {Express} from "express";
import Env from "../common/config/environment_variables";
import AppController from "../controllers/AppController";
import TaskController from "../controllers/TaskController";
class AppRoutes {

    private app: Express;
    constructor(app: Express) {
        this.app = app;
    }

    initializeRoutes() {
        
        this.app.use(Env.API_PATH + "/", AppController);
        this.app.use(Env.API_PATH + "/tasks", TaskController);
    }
}

export default AppRoutes;