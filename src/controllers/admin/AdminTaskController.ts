
import BaseApiController from "../base controllers/BaseApiController";
import TaskValidator from "../../middlewares/validators/TaskValidator";
import { taskRepository } from "../../services/task_service";
import { getEndOfDay, getStartOfDay } from "../../common/utils/date_utils";
import { UNABLE_TO_COMPLETE_REQUEST, actionNotPermitted, resourceNotFound } from "../../common/constant/error_response_message";
import { ITEM_STATUS, TASK_STATUS } from "../../data/enums/enum";
import { UpdateQuery } from "mongoose";
import { ITask } from "../../models/task";
import { DbSortQuery } from "../../data/interfaces/types";
import { socketRepository, socketService } from "../../services/socket_service";

class AdminTaskController extends BaseApiController {
    private taskValidator: TaskValidator;

    constructor() {
        super();
    }

    protected initializeServices() {}
    
    protected initializeMiddleware() {
        this.taskValidator = new TaskValidator(this.router)
    }

    protected initializeRoutes() {
        this.createTask("/"); //POST
        this.listTask("/"); //GET
        this.getTask("/:id"); //GET
        this.deleteTask("/:id"); //DELETE
        this.updateTask("/:id"); //PATCH
    }

    createTask(path:string) {
        this.router.post(path, this.taskValidator.validateTask);
        this.router.post(path, async (req, res) => {
            try {
                const user = this.requestUtils.getRequestUser();
                const body = req.body;
                
                const taskNote = [];
                if (body.note) {
                    taskNote.push({ text: body.note, made_by: user.id});
                }
                
                const taskData = {
                    title: body.title,
                    points: body.points,
                    priority: body.priority,
                    created_by: user.id,
                    assigned_to: body.assigned_to,
                    expected_completion_date: body.expected_completion_date,
                    notes: taskNote
                };
                
                const task = await taskRepository.save(taskData);

                //Send socket notification to assignee
                const assignee = await socketRepository.findOne({user: body.assigned_to, status: ITEM_STATUS.ACTIVE});
                if (assignee) {
                    await socketService.emitEvent(assignee.socket_ids, "new-task", task);
                }
        
                this.sendSuccessResponse(res, task, undefined, 201);
            } catch (error:any) {
                this.sendErrorResponse(res, error, UNABLE_TO_COMPLETE_REQUEST, 500) 
            }
        });
    }

    listTask(path:string) {
        this.router.get(path, async (req, res) => {
            try {
                const reqQuery: Record<string, any> = req.query;
                let query = {};

                if (reqQuery.status) query = {...query, status: reqQuery.status};
                if (reqQuery.title) query = {...query, title: new RegExp(`${reqQuery.title}`, "i")};
                if (reqQuery.created_by) query = {...query, created_by: reqQuery.created_by};
                if (reqQuery.assigned_to) query = {...query, assigned_to: reqQuery.assigned_to};
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

                const selectedFields = ["title", "assigned_to", "expected_completion_date", "points", "priority"];
                const populatedFields = [{ path: "assigned_to", select: "first_name middle_name last_name" }];

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
                const populatedFields = [
                    { path: "assigned_to", select: "first_name middle_name last_name" },
                    { path: "created_by", select: "first_name middle_name last_name" }
                ];
                const task = await taskRepository.findByIdAndPopulate(req.params.id, populatedFields);
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
                const {title, points, priority, expected_completion_date, note, status} = req.body;
                const task = await taskRepository.findById(req.params.id);
                if (!task) {
                    const error = new Error("Task not found");
                    return this.sendErrorResponse(res, error, resourceNotFound("Task"), 404) 
                }

                if (task.status == TASK_STATUS.APPROVED) {
                    const message = "Updating an approved task";
                    const error = new Error(message);
                    return this.sendErrorResponse(res, error, actionNotPermitted(message), 403);
                }
                
                const update:UpdateQuery<ITask> = {
                    title,
                    points,
                    priority,
                    expected_completion_date,
                    status
                }
                if (note) {
                    update["$push"] = {
                        notes: { text: note, made_by: user.id}
                    }
                }

                const updatedTask = await taskRepository.updateById(task.id, update);
                const assignee = await socketRepository.findOne({user: task.assigned_to, status: ITEM_STATUS.ACTIVE});
                if (status == TASK_STATUS.APPROVED) {
                    //Send socket notification to assignee
                    if (assignee) {
                        await socketService.emitEvent(assignee.socket_ids, "task-approval", updatedTask);
                    }
                } else {
                    //Send task-update socket notification to assignee
                    if (assignee) {
                        await socketService.emitEvent(assignee.socket_ids, "task-update", updatedTask);
                    }
                }
        
                this.sendSuccessResponse(res, updatedTask);
            } catch (error:any) {
                this.sendErrorResponse(res, error, UNABLE_TO_COMPLETE_REQUEST, 500);
            }
        });
    }

    deleteTask(path:string) {
        this.router.delete(path, this.taskValidator.validateDefaultParams)
        this.router.delete(path, async (req, res) => {
            try {
                const task = await taskRepository.findById(req.params.id);
                if (!task) {
                    const error = new Error("Task not found");
                    return this.sendErrorResponse(res, error, resourceNotFound("Task"), 404) 
                }

                if (task.status == TASK_STATUS.APPROVED) {
                    const message = "Deleting an approved task";
                    const error = new Error(message);
                    return this.sendErrorResponse(res, error, actionNotPermitted(message), 403);
                }

                await taskRepository.deleteById(req.params.id);
        
                this.sendSuccessResponse(res);
            } catch (error:any) {
                this.sendErrorResponse(res, error, UNABLE_TO_COMPLETE_REQUEST, 500);
            }
        });
    }
}

export default new AdminTaskController().router;