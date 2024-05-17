import DBQuery from './DBQuery';
import UserPrivilege, { IUserPrivilege, ICreateUserPrivilege, IUserPrivilegeDocument } from '../models/user_privilege';

class TaskRepository extends DBQuery<IUserPrivilege, ICreateUserPrivilege, IUserPrivilegeDocument> {
    
    constructor() {
        super(UserPrivilege);
    }
}

const taskRepository = new TaskRepository();

export default TaskRepository;
export { taskRepository };