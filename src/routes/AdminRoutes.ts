import {Express} from "express";
import Env from "../common/config/environment_variables";
import UserManagementController from "../controllers/admin/UserManagementController";

class AdminRoutes {

    private app: Express;
    constructor(app: Express) {
        this.app = app;
    }

    initializeRoutes() {
        const ADMIN = "/admin"
        
        this.app.use(Env.API_PATH + ADMIN + "/users", UserManagementController);
    }
}

export default AdminRoutes;