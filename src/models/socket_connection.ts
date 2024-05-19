import { Document, Schema, Types, model} from "mongoose";
import { ITEM_STATUS } from "../data/enums/enum";
import MODEL_NAMES from "../data/model_names";
import { IUserDocument } from "./user";
import { ILoginSessionDocument } from "./login_session";

const ObjectId = Schema.Types.ObjectId;

const SocketConnectionSchema = new Schema<Record<keyof ISocketConnection, any>>({
    login_session: { type: ObjectId, ref: MODEL_NAMES.LOGIN_SESSION},
    user: { type: ObjectId, required: true, ref: MODEL_NAMES.USER},
    socket_ids: { type: [String], required: true},
    status: {type: String, enum: Object.values(ITEM_STATUS), default: ITEM_STATUS.ACTIVE}
},
{
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

interface ICreateSocketConnection {
    login_session: string|ILoginSessionDocument;
    user: string | IUserDocument;
    socket_ids: string[];
    status?: string;
}

interface ISocketConnection extends Required<ICreateSocketConnection> {};

const SocketConnection = model<ISocketConnection>(MODEL_NAMES.SOCKET_CONNECTION, SocketConnectionSchema);
interface ISocketConnectionDocument extends ISocketConnection, Document {_id: Types.ObjectId};

export default SocketConnection;
export { ISocketConnectionDocument, ICreateSocketConnection, ISocketConnection }
