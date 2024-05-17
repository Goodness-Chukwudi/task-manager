import { Document, Schema, Types, model} from "mongoose";
import mongoosePagination from "mongoose-paginate-v2";
import MODEL_NAMES from "../data/model_names";
import { IUserDocument } from "./user";
import { PRIORITY_LEVEL, TASK_POINTS, TASK_STATUS } from "../data/enums/enum";

const ObjectId = Schema.Types.ObjectId;

const TaskNotes = {
    text: {type: String, required: true},
    made_by: {type: ObjectId, required: true, ref: MODEL_NAMES.USER},
    time: {type: Date, default: new Date()}
};

const TaskSchema = new Schema<Record<keyof ITask, any>>({
    title: {type: String, required: [true, "title is required"], index: true},
    points: {type: Number, required: [true, "points is required"], enum: Object.values(TASK_POINTS)},
    priority: {type: Number, required: [true, "priority is required"], enum: Object.values(PRIORITY_LEVEL)},
    created_by: {type: ObjectId, required: [true, "please provide who created this task"], ref: MODEL_NAMES.USER},
    assigned_to: {type: ObjectId, ref: MODEL_NAMES.USER},
    expected_completion_date: {type: Date, required: [true, "completion date is required"]},
    actual_completion_date: {type: Date},
    notes: {type: [TaskNotes]},
    status: {type: String, default: TASK_STATUS.TO_DO, enum: Object.values(TASK_STATUS)}
},
{
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

interface ICreateTask {
    title: string;
    points: number;
    priority: number;
    created_by: string|IUserDocument;
    assigned_to: string|IUserDocument;
    expected_completion_date: Date;
    actual_completion_date?: Date
    notes?: {
        text: string;
        made_by: string|IUserDocument;
        time?: Date;
    }[];
    status?: string;
}

interface ITask extends Required<ICreateTask> {};

TaskSchema.plugin(mongoosePagination);

const Task = model<ITask>(MODEL_NAMES.TASK, TaskSchema);
interface ITaskDocument extends ITask, Document {_id: Types.ObjectId};

export default Task;
export { ITaskDocument, ICreateTask, ITask };
