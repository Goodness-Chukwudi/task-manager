import { UNABLE_TO_COMPLETE_REQUEST, badRequestError, resourceNotFound } from "../../common/constant/error_response_message";
import { ITEM_STATUS } from "../../data/enums/enum";
import AppValidator from "../../middlewares/validators/AppValidator";
import { userRepository } from "../../services/user_service";
import BaseApiController from "../base controllers/BaseApiController";


class UserManagementController extends BaseApiController {
    private appValidator: AppValidator;
    constructor() {
        super();
    }

    protected initializeServices() {}
    
    protected initializeMiddleware() {
        this.appValidator = new AppValidator(this.router);
    }

    protected initializeRoutes() {
        //Assign admin
        this.listUsers("/"); //GET
        this.getUser("/:id"); //GET
        this.updateUserStatus("/:id/status/:status"); //PATCH
    }

    listUsers(path:string) {
        this.router.get(path, async (req, res) => {
            try {
                let query = {};
                if (req.query.status) query = {...query, status: req.query.status};
                if (req.query.email) query = {...query, email: req.query.email};
                if (req.query.gender) query = {...query, gender: req.query.gender};
                if (req.query.search) query = {
                    ...query,
                    $or: [
                        {first_name: new RegExp(`${req.query.search}`, "i")},
                        {last_name: new RegExp(`${req.query.search}`, "i")},
                        {middle_name: new RegExp(`${req.query.search}`, "i")}
                    ]
                };

                let limit;
                let page;
                if (req.query.limit) limit = Number(req.query.limit);
                if (req.query.page) page = Number(req.query.page);

                const users = await userRepository.paginate(query, limit, page);

                this.sendSuccessResponse(res, users);
            } catch (error: any) {
                this.sendErrorResponse(res, error, UNABLE_TO_COMPLETE_REQUEST, 500);
            }
        });
    }

    getUser(path:string) {
        this.router.get(path, this.appValidator.validateDefaultParams, async (req, res) => {
            try {
                const user = await userRepository.findById(req.params.id);
                if (!user) {
                    const error = new Error("User with the provided id not found");
                    return this.sendErrorResponse(res, error, resourceNotFound("user"), 404);
                }

                this.sendSuccessResponse(res, user);
            } catch (error: any) {
                this.sendErrorResponse(res, error, UNABLE_TO_COMPLETE_REQUEST, 500);
            }
        });
    }

    updateUserStatus(path:string) {
        this.router.patch(path, this.appValidator.validateDefaultParams, async (req, res) => {
            try {
                const status = req.params.status;
                if (status != ITEM_STATUS.ACTIVE && status != ITEM_STATUS.DEACTIVATED) {
                    const message = "'status' must be " + ITEM_STATUS.ACTIVE +" or "+ ITEM_STATUS.DEACTIVATED;
                    const error = new Error(message);
                    return this.sendErrorResponse(res, error, badRequestError(message), 400);
                }

                let user = await userRepository.findById(req.params.id);
                if (!user) {
                    const error = new Error("User with the provided id not found");
                    return this.sendErrorResponse(res, error, resourceNotFound("user"), 404);
                }

                user.status = status;
                user = await user.save();

                this.sendSuccessResponse(res, user);
            } catch (error: any) {
                this.sendErrorResponse(res, error, UNABLE_TO_COMPLETE_REQUEST, 500);
            }
        });
    }
}

export default new UserManagementController().router;
