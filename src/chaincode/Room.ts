import { ChaincodeMethodMapper } from './ChaincodeMethodMap';
import Shim = require('fabric-shim');
import { ChaincodeStub } from 'fabric-shim';
import { Chaincode } from './Chaincode';
import { assertArgs } from '../util/assertArgs';
import * as validate from '../util/validate';


/**
 * roomメソッドへのリクエストを関数名の指定にしたがってマッピングします。
 */
const roomMethods: ChaincodeMethodMapper = (methodName: string) => {
    switch (methodName) {
        case 'createRoom':
            return createRoom;
        case 'guestJoinedRoom':
            return guestJoinedRoom;
        case 'closeRoom':
            return closeRoom;
        default:
            return;
    }
};


/**
 * 部屋情報を作成します。
 */
async function createRoom(stub: ChaincodeStub, args: string[]): Promise<Buffer> {
    assertArgs(args, [
        validate.uuid,
        validate.room.purpose,
        validate.user.locator,
        validate.fqdn,
    ]);

    const [id, purpose, inviter, host] = args;

    const current = await stub.getState(id);
    if (current.toString()) {
        throw new Error(`object id ${id} already exists`);
    }

    const newRoom = {
        id,
        purpose,
        inviter,
        host,
    };

    const newRoomAsBuffer = Buffer.from(JSON.stringify(newRoom));

    stub.putState(id, newRoomAsBuffer);

    return newRoomAsBuffer;
}


/**
 * 部屋に被招待者情報を付加します。
 */
async function guestJoinedRoom(stub: ChaincodeStub, args: string[]): Promise<Buffer> {
    assertArgs(args, [
        validate.uuid,
        validate.user.locator,
    ]);

    const [id, guest] = args;

    const currentRoomBuffer = await stub.getState(id);
    if (!currentRoomBuffer.toString()) {
        throw new Error(`not found room ${id}`);
    }

    const guestBuffer = await stub.getState(guest);
    if (!guestBuffer.toString()) {
        throw new Error(`not found guest user ${guest}`);
    }

    const currentRoom = JSON.parse(currentRoomBuffer.toString());
    const updatedRoom = {
        ...currentRoom,
        guest,
    };

    const updatedRoomAsBuffer = Buffer.from(JSON.stringify(updatedRoom));

    await stub.putState(id, updatedRoomAsBuffer);

    return updatedRoomAsBuffer;
}


/**
 * 部屋を閉じます。
 */
async function closeRoom(stub: ChaincodeStub, args: string[]): Promise<Buffer> {
    assertArgs(args, [
        validate.uuid,
        validate.datetime,
    ]);

    const [id, closedAt] = args;

    const currentRoomAsBuffer = stub.getState(id);
    if (!currentRoomAsBuffer.toString()) {
        throw new Error(`not found room ${id}`);
    }

    const currentRoom = JSON.parse(currentRoomAsBuffer.toString());

    const updatedRoom = {
        ...currentRoom,
        closedAt,
    };

    const updatedRoomAsBuffer = Buffer.from(JSON.stringify(updatedRoom));

    await stub.putState(id, updatedRoomAsBuffer);

    return updatedRoomAsBuffer;
}


Shim.start(new Chaincode('room', roomMethods));