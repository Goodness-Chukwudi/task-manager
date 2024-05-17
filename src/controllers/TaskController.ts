import { FilterQuery, UpdateQuery } from "mongoose";
import TaskValidator from "../middlewares/validators/TaskValidator";
import BaseApiController from "./base controllers/BaseApiController";
import { ITask } from "../models/task";
import { getEndOfDay, getStartOfDay } from "../common/utils/date_utils";
import { taskRepository } from "../services/task_service";
import { UNABLE_TO_COMPLETE_REQUEST, forbidden, resourceNotFound } from "../common/constant/error_response_message";
import { TASK_STATUS } from "../data/enums/enum";

class TaskController extends BaseApiController {
    private taskValidator: TaskValidator;

    constructor() {
        super();
    }

    protected initializeServices() {}
    
    protected initializeMiddleware() {
        this.taskValidator = new TaskValidator(this.router)
    }

    protected initializeRoutes() {
        this.listTask("/"); //GET
        this.getTask("/:id"); //GET
        this.updateTask("/:id"); //PATCH
    }

    listTask(path:string) {
        this.router.get(path, async (req, res) => {
            try {
                const user = this.requestUtils.getRequestUser();
                const reqQuery: Record<string, any> = req.query;
                let query:FilterQuery<ITask> = {assigned_to: user.id};

                if (reqQuery.status) query = {...query, status: reqQuery.status};
                if (reqQuery.title) query = {...query, title: new RegExp(`${reqQuery.title}`, "i")};
                if (reqQuery.created_by) query = {...query, created_by: reqQuery.created_by};
                if (reqQuery.start_date && reqQuery.end_date) {
                    const startDate = getStartOfDay(reqQuery.start_date)
                    const endDate = getEndOfDay(reqQuery.end_date)
                    query = {...query, expected_completion_date: { $gte: startDate, $lte: endDate }}
                }
                if (reqQuery.points_from && reqQuery.points_to) {
                    query = {...query, points: { $gte: reqQuery.points_from, $lte: reqQuery.points_to }}
                }
                if (reqQuery.priority_from && reqQuery.priority_to) {
                    query = {...query, priority: { $gte: reqQuery.priority_from, $lte: reqQuery.priority_to }}
                }

                let limit;
                let page;
                if (reqQuery.limit) limit = Number(reqQuery.limit);
                if (reqQuery.page) page = Number(reqQuery.page);

                const tasks = await taskRepository.paginate(query, limit, page);
        
                this.sendSuccessResponse(res, tasks);
            } catch (error:any) {
                this.sendErrorResponse(res, error, UNABLE_TO_COMPLETE_REQUEST, 500) 
            }
        });
    }

    getTask(path:string) {
        this.router.get(path, this.taskValidator.validateDefaultParams, async (req, res) => {
            try {
                const user = this.requestUtils.getRequestUser();
                const task = await taskRepository.findOne({_id: req.params.id, assigned_to: user.id});
                if (!task) {
                    const error = new Error("Task not found");
                    return this.sendErrorResponse(res, error, resourceNotFound("Task"), 404) 
                }
        
                this.sendSuccessResponse(res, task);
            } catch (error:any) {
                this.sendErrorResponse(res, error, UNABLE_TO_COMPLETE_REQUEST, 500);
            }
        });
    }

    updateTask(path:string) {
        this.router.get(path, this.taskValidator.validateDefaultParams, this.taskValidator.validateTaskUpdate)
        this.router.get(path, async (req, res) => {
            const user = await this.requestUtils.getRequestUser();
            try {
                const {note, status} = req.body;
                const task = await taskRepository.findById(req.params.id);
                if (!task) {
                    const error = new Error("Task not found");
                    return this.sendErrorResponse(res, error, resourceNotFound("Task"), 404) 
                }

                if (task.status == TASK_STATUS.APPROVED) {
                    const message = "You are not allowed to approve a task";
                    const error = new Error(message);
                    return this.sendErrorResponse(res, error, forbidden(message), 403);
                    //update assignee
                }
                
                if (status == TASK_STATUS.COMPLETED) {
                    //update assignee
                }
                
                const update:UpdateQuery<ITask> = { status };
                if (note) {
                    update["$push"] = {
                        notes: { text: note, made_by: user.id}
                    }
                    //Update assignee
                }

                const updatedTask = await taskRepository.updateById(task.id, update);
        
                this.sendSuccessResponse(res, updatedTask);
            } catch (error:any) {
                this.sendErrorResponse(res, error, UNABLE_TO_COMPLETE_REQUEST, 500);
            }
        });
    }
}

export default new TaskController().router;