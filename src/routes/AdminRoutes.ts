import {Express} from "express";
import Env from "../common/config/environment_variables";
import UserManagementController from "../controllers/admin/UserManagementController";
import AdminTaskController from "../controllers/admin/AdminTaskController";
import UserPrivilegeMiddleware from "../middlewares/UserPrivilegeMiddleware";

class AdminRoutes {

    private app: Express;
    constructor(app: Express) {
        this.app = app;
    }

    initializeRoutes() {
        const ADMIN_PATH = "/admin";

        //The userPrivilege middleware restricts access to these endpoints to only users with the specified privileges
        const userPrivilegeMiddleware = new UserPrivilegeMiddleware(this.app);
        this.app.use(Env.API_PATH + ADMIN_PATH, userPrivilegeMiddleware.validateAdminPrivilege);
        
        this.app.use(Env.API_PATH + ADMIN_PATH + "/users", UserManagementController);
        this.app.use(Env.API_PATH + ADMIN_PATH + "/tasks", AdminTaskController);
    }
}

export default AdminRoutes;