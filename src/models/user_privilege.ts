import { Document, Schema, Types, model} from "mongoose";
import { ITEM_STATUS, USER_ROLES } from "../data/enums/enum";
import MODEL_NAMES from "../data/model_names";
import { IUserDocument } from "./user";
import mongoosePagination from "mongoose-paginate-v2";

const ObjectId = Schema.Types.ObjectId;

const UserPrivilegeSchema = new Schema<Record<keyof IUserPrivilege, any>>({
    user: { type: ObjectId, ref: MODEL_NAMES.USER, required: true},
    role: { type: String, required: true, enum: Object.values(USER_ROLES) },
    assigned_by: { type: ObjectId, ref: MODEL_NAMES.USER},
    status: { type: String, default: ITEM_STATUS.ACTIVE, enum: Object.values(ITEM_STATUS) }
},
{
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});
interface ICreateUserPrivilege {
    user: string | IUserDocument;
    role: string,
    assigned_by: string | IUserDocument,
    status?: string;
}

interface IUserPrivilege extends Required<ICreateUserPrivilege> {};

UserPrivilegeSchema.plugin(mongoosePagination);

const UserPrivilege = model<IUserPrivilege>(MODEL_NAMES.USER_PRIVILEGE, UserPrivilegeSchema);
interface IUserPrivilegeDocument extends IUserPrivilege, Document {_id: Types.ObjectId};

export default UserPrivilege;
export { IUserPrivilegeDocument, ICreateUserPrivilege, IUserPrivilege }
