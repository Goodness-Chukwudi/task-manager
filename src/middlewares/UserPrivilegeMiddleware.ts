import { Request, Response, Router } from "express";
import BaseRouterMiddleware from "./BaseRouterMiddleware";
import { ITEM_STATUS, USER_ROLES } from "../data/enums/enum";
import { privilegeRepository } from "../services/user_privilege_service";
import { INVALID_PERMISSION, UNABLE_TO_COMPLETE_REQUEST } from "../common/constant/error_response_message";

export class UserPrivilegeMiddleware extends BaseRouterMiddleware {

    userRoles: string[];
    constructor(appRouter: Router, roles: string[] = []) {
        super(appRouter);
        this.userRoles = roles;
    }

    public validatePrivileges = async (req: Request, res: Response, next: any) => {
        try {
            const user = this.requestUtils.getRequestUser();
            const query = {user: user._id, role: {$in: this.userRoles}, status: ITEM_STATUS.ACTIVE}
            const userPrivilege = await privilegeRepository.findOne(query);
            
            if (userPrivilege) {
                next();
            } else {
                const error = new Error("Invalid permission. Only "+ this.userRoles.toString() + " is allowed");
                this.sendErrorResponse(res, error, INVALID_PERMISSION, 403)
            }
        } catch (error:any) {
            this.sendErrorResponse(res, error, UNABLE_TO_COMPLETE_REQUEST, 500);
        }
    }

    public validateAdminPrivilege = async (req: Request, res: Response, next: any) => {
        try {
            const user = this.requestUtils.getRequestUser();
            const query = {user: user._id, role: {$in: [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]}, status: ITEM_STATUS.ACTIVE}
            const userPrivilege = await privilegeRepository.findOne(query);
            
            if (userPrivilege) {
                next();
            } else {
                const error = new Error("Invalid permission. Only an admin is allowed");
                this.sendErrorResponse(res, error, INVALID_PERMISSION, 403)
            }
        } catch (error:any) {
            this.sendErrorResponse(res, error, UNABLE_TO_COMPLETE_REQUEST, 500);
        }
    }
}

export default UserPrivilegeMiddleware;
