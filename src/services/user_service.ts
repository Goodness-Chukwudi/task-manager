import DBQuery from './DBQuery';
import User, { IUser, ICreateUserPayload, IUserDocument } from '../models/user';
import { BIT, ITEM_STATUS, USER_ROLES } from '../data/enums/enum';
import { loginSessionRepository } from './login_session_service';
import { createAuthToken, hashData } from '../common/utils/auth_utils';
import { ILoginSessionDocument } from '../models/login_session';
import { ClientSession } from 'mongoose';
import { passwordRepository } from './password_service';
import { privilegeRepository } from './user_privilege_service';
import { createMongooseTransaction, getCode } from '../common/utils/app_utils';

class UserRepository extends DBQuery<IUser, ICreateUserPayload, IUserDocument> {
    
    constructor() {
        super(User);
    }
}

const logoutUser = async (userId: string): Promise<ILoginSessionDocument> => {
 return new Promise(async (resolve, reject) => {
    try {
        let activeLoginSession = await loginSessionRepository.findOne({status: BIT.ON, user: userId})

        if(activeLoginSession) {
            if (activeLoginSession.validity_end_date> new Date()) {
                activeLoginSession.logged_out = true;
                activeLoginSession.validity_end_date = new Date();
            } else {
                activeLoginSession.expired = true
            }
            activeLoginSession.status = BIT.OFF;
            activeLoginSession = await activeLoginSession.save();
        }
        resolve(activeLoginSession);

    } catch (error) {
        reject(error);
    }
 })
}

const loginUser = async (userId: string, session?: ClientSession): Promise<string> => {
 return new Promise(async (resolve, reject) => {
    try {
        const loginSessionData = {
            user: userId,
            status: BIT.ON
        };
        const loginSession = await loginSessionRepository.save(loginSessionData, session);
        const token = createAuthToken(userId, loginSession.id);
        resolve(token);
    } catch (error) {
        reject(error);
    }
 })
}

const createSuperAdminUser = async () => {
    const session = await createMongooseTransaction();
    try {
        const existingSuperAdmin = await privilegeRepository.findOne({status: ITEM_STATUS.ACTIVE, role: USER_ROLES.SUPER_ADMIN});
        if (!existingSuperAdmin) {
            const userData = {
                first_name: "John",
                last_name: "Doe",
                email: "johndoe@gmail.com",
                phone: "070435343453",
                gender: "male"
            }
            const user = await userRepository.save(userData, session);
            const password = getCode(8);
            const passwordData = {
                password: await hashData(password),
                email: user.email,
                user: user.id
            }
            await passwordRepository.save(passwordData, session);
    
            const privilege = {
                user: user.id,
                role: USER_ROLES.SUPER_ADMIN,
                assigned_by: user.id
            }
            await privilegeRepository.save(privilege, session);
    
            console.log("email:    " + user.email)
            console.log("password:    " + password)
        }
        await session.commitTransaction();
    } catch (error) {
        await session.abortTransaction();
        throw error;
    }
}

const userRepository = new UserRepository();
const userService = {
    createSuperAdminUser,
    logoutUser,
    loginUser
};

export default UserRepository;
export { userRepository, userService };
