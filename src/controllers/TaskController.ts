import { FilterQuery, UpdateQuery } from "mongoose";
import TaskValidator from "../middlewares/validators/TaskValidator";
import BaseApiController from "./base controllers/BaseApiController";
import { ITask } from "../models/task";
import { getEndOfDay, getStartOfDay } from "../common/utils/date_utils";
import { taskRepository } from "../services/task_service";
import { UNABLE_TO_COMPLETE_REQUEST, forbidden, resourceNotFound } from "../common/constant/error_response_message";
import { ITEM_STATUS, TASK_STATUS } from "../data/enums/enum";
import { DbSortQuery } from "../data/interfaces/types";
import { socketRepository, socketService } from "../services/socket_service";

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
                let sort;
                if (reqQuery.limit) limit = Number(reqQuery.limit);
                if (reqQuery.page) page = Number(reqQuery.page);
                if (req.query.sort) sort = req.query.sort as unknown as DbSortQuery;

                const selectedFields = ["title", "created_by", "expected_completion_date", "points", "priority"];
                const populatedFields = [{ path: "created_by", select: "first_name middle_name last_name" }];

                const tasks = await taskRepository.paginateAndPopulate(query, limit, page, populatedFields, selectedFields, sort);
        
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
                const populatedFields = [
                    { path: "created_by", select: "first_name middle_name last_name" }
                ];

                const task = await taskRepository.findOneAndPopulate({_id: req.params.id, assigned_to: user.id}, populatedFields);
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
        this.router.patch(path, this.taskValidator.validateDefaultParams, this.taskValidator.validateTaskUpdate)
        this.router.patch(path, async (req, res) => {
            const user = await this.requestUtils.getRequestUser();
            try {
                const {note, status} = req.body;
                const task = await taskRepository.findById(req.params.id);
                if (!task) {
                    const error = new Error("Task not found");
                    return this.sendErrorResponse(res, error, resourceNotFound("Task"), 404) 
                }

                if (status == TASK_STATUS.APPROVED) {
                    const message = "You are not allowed to approve this task";
                    const error = new Error(message);
                    return this.sendErrorResponse(res, error, forbidden(message), 403);
                }
                
                const update:UpdateQuery<ITask> = { status };
                if (note) {
                    update["$push"] = {
                        notes: { text: note, made_by: user.id}
                    }
                }

                const updatedTask = await taskRepository.updateById(task.id, update);
                const assigner = await socketRepository.findOne({user: task.created_by, status: ITEM_STATUS.ACTIVE});
                if (status == TASK_STATUS.COMPLETED) {
                    //Send socket notification to assigner
                    if (assigner) {
                        await socketService.emitEvent(assigner.socket_ids, "task-completed", updatedTask);
                    }
                } else {
                    //Send task-update socket notification to assigner
                    if (assigner) {
                        await socketService.emitEvent(assigner.socket_ids, "task-update", updatedTask);
                    }
                }
        
                this.sendSuccessResponse(res, updatedTask);
            } catch (error:any) {
                this.sendErrorResponse(res, error, UNABLE_TO_COMPLETE_REQUEST, 500);
            }
        });
    }
}

export default new TaskController().router;