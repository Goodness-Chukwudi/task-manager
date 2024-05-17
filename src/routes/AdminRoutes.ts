import {Express} from "express";
import Env from "../common/config/environment_variables";
import UserManagementController from "../controllers/admin/UserManagementController";
import AdminTaskController from "../controllers/admin/AdminTaskController";

class AdminRoutes {

    private app: Express;
    constructor(app: Express) {
        this.app = app;
    }

    initializeRoutes() {
        const ADMIN = "/admin"
        
        this.app.use(Env.API_PATH + ADMIN + "/users", UserManagementController);
        this.app.use(Env.API_PATH + ADMIN + "/tasks", AdminTaskController);
    }
}

export default AdminRoutes;