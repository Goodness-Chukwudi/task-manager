import DBQuery from './DBQuery';
import Task, { ICreateTask, ITask, ITaskDocument } from '../models/task';

class TaskRepository extends DBQuery<ITask, ICreateTask, ITaskDocument> {
    
    constructor() {
        super(Task);
    }
}

const taskRepository = new TaskRepository();

export default TaskRepository;
export { taskRepository };