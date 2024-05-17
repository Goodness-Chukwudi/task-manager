import { NextFunction, Request, Response, Router } from "express";
import Joi from "joi";
import BaseRouterMiddleware from "../BaseRouterMiddleware";
import { JoiValidatorOptions } from "../../common/config/app_config";
import { PRIORITY_LEVEL, TASK_POINTS, TASK_STATUS } from "../../data/enums/enum";
import { badRequestError } from "../../common/constant/error_response_message";
import { date, objectId } from "../../common/utils/joi_extensions";

const JoiId = Joi.extend(objectId);
const JoiDate = Joi.extend(date);

class TaskValidator extends BaseRouterMiddleware {

    constructor(appRouter: Router) {
        super(appRouter);
    }

    validateTask = async ( req: Request, res: Response, next: NextFunction ) => {
        try {
            const BodySchema = Joi.object({
                title: Joi.string().max(100).required(),
                points: Joi.number().valid(...Object.values(TASK_POINTS)).required(),
                priority: Joi.number().valid(...Object.values(PRIORITY_LEVEL)).required(),
                assigned_to: JoiId.string().objectId().required(),
                expected_completion_date: JoiDate.date().format("YYYY-MM-DD").required(),
                note: Joi.string().max(300)
            });

            await BodySchema.validateAsync(req.body, JoiValidatorOptions);

            next();
        } catch (error: any) {
            return this.sendErrorResponse(res, error, badRequestError(error.message), 400);
        }
    };

    validateTaskUpdate = async ( req: Request, res: Response, next: NextFunction ) => {
        try {
            const BodySchema = Joi.object({
                title: Joi.string().max(100),
                points: Joi.number().valid(...Object.values(TASK_POINTS)),
                priority: Joi.number().valid(...Object.values(PRIORITY_LEVEL)),
                expected_completion_date: JoiDate.date().format("YYYY-MM-DD"),
                note: Joi.string().max(300),
                status: Joi.string().valid(...Object.values(TASK_STATUS))
            });

            await BodySchema.validateAsync(req.body, JoiValidatorOptions);

            next();
        } catch (error: any) {
            return this.sendErrorResponse(res, error, badRequestError(error.message), 400);
        }
    };
}

export default TaskValidator;