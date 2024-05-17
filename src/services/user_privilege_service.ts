import DBQuery from './DBQuery';
import UserPrivilege, { IUserPrivilege, ICreateUserPrivilege, IUserPrivilegeDocument } from '../models/user_privilege';

class PrivilegeRepository extends DBQuery<IUserPrivilege, ICreateUserPrivilege, IUserPrivilegeDocument> {
    
    constructor() {
        super(UserPrivilege);
    }
}

const privilegeRepository = new PrivilegeRepository();

export default PrivilegeRepository;
export { privilegeRepository };