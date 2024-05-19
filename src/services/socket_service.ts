import DBQuery from './DBQuery';
import SocketConnection, { ICreateSocketConnection, ISocketConnection, ISocketConnectionDocument } from '../models/socket_connection';
import Env from '../common/config/environment_variables';
import { ITEM_STATUS } from '../data/enums/enum';
import { Server } from "http";
import { authenticateSocketConnection } from '../common/utils/auth_utils';
import { Socket } from 'socket.io';

let io:Socket;
let socket:Socket;

class SocketRepository extends DBQuery<ISocketConnection, ICreateSocketConnection, ISocketConnectionDocument> {

    constructor() {
        super(SocketConnection);
    }
}

const socketRepository = new SocketRepository();

const createSocketConnection = async (server: Server) => {
    try {

        io = require('socket.io')(server, {
            cors: {
                origin: Env.ALLOWED_ORIGINS,
                methods: ["GET", "POST"]
            }
        });
    
        io.on("connection", (_socket) => {
            console.log("connected to socket server with socket id - " + _socket.id);
            socket = _socket;

            _socket.on("request-connection", handleConnection);
            _socket.on("disconnect", handleDisconnection);

        });
    } catch (error) {
        throw error;
    }
}

const handleDisconnection = async () => {
    try {
        const socketConnection = await socketRepository.findOne({socket_ids: socket.id, status: ITEM_STATUS.ACTIVE});
        socketConnection.socket_ids = socketConnection.socket_ids.filter(socket_id => socket_id != socket.id);
        await socketConnection.save();
    } catch (error) {
        console.log(error)
    }
}

const handleConnection = async (payLoad: any) => {
    const response = {
        success: false,
        error: "Sorry, an error occurred on the server"
    }
    try {
        const loginSession = await authenticateSocketConnection(payLoad.token);
        const socketConnection = await socketRepository.findOne({user: loginSession.user, status: ITEM_STATUS.ACTIVE});

        if (socketConnection) {
            if (!socketConnection.socket_ids.includes(socket.id)) {
                socketConnection.socket_ids.push(socket.id);
                await socketConnection.save();
            }
        } else {
            const newConnection = {
                login_session: loginSession.id,
                user: loginSession.user,
                socket_ids: [socket.id]
            }

            await socketRepository.save(newConnection);
        }
        
    } catch (error:any) {
        if(error.message == "Socket Authentication failed") response.error = "Socket Authentication failed";
        io.to(socket.id).emit("socket-error", response);
    }
} 

const emitEvent = async (socketIds: string[], eventName: string, data:any) => {
    try {
        io.to(socketIds).emit(eventName, data)
        
    } catch (error) {
        console.log(error);
    }
} 
const socketService = {
    createSocketConnection,
    emitEvent
};

export default SocketRepository;
export { socketRepository, socketService };
