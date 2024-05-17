
import BaseApiController from "../base controllers/BaseApiController";
import TaskValidator from "../../middlewares/validators/TaskValidator";
import { taskRepository } from "../../services/task_service";
import { getEndOfDay, getStartOfDay } from "../../common/utils/date_utils";
import { UNABLE_TO_COMPLETE_REQUEST, actionNotPermitted, resourceNotFound } from "../../common/constant/error_response_message";
import { TASK_STATUS } from "../../data/enums/enum";
import { UpdateQuery } from "mongoose";
import { ITask } from "../../models/task";

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

                const task = await taskRepository.findById(req.params.id);
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
                    //update assignee
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

export default new AdminTaskController().router;