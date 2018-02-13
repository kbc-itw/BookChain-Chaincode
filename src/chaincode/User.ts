import { ChaincodeMethodMapper } from './ChaincodeMethodMap';
import { assertArgs } from '../util/assertArgs';
import * as validate from '../util/validate';
import { CouchQuery } from '../util/CouchQuery';
import Shim = require('fabric-shim');
import { ChaincodeStub } from 'fabric-shim';
import { Chaincode } from './Chaincode';
import * as sourceMapSupport from 'source-map-support';

sourceMapSupport.install();


/**
 * userチェーンコードへのリクエストを各関数にマッピングします。
 */
const userMethods: ChaincodeMethodMapper = (methodName: string) => {
    switch (methodName) {
        case 'getUser':
            return getUser;
        case 'getUsersList':
            return getUsersList;
        case 'createUser':
            return createUser;
        case 'updateUser':
            return updateUser;
        case 'deleteUser':
            return deleteUser;
        default:
            return;
    }
};


/**
 * 指定されたlocatorで表される、単一のユーザー情報を取得します。
 */
async function getUser(stub: ChaincodeStub, args: string[]): Promise<Buffer> {
    assertArgs(args, [validate.user.locator]);

    const locator = args[0];

    const state = await stub.getState(locator);

    if (!state.toString()) {
        throw new Error(`user ${locator} not found`);
    }

    return state;
}


/**
 * 指定した条件に合致するユーザー情報の一覧を取得します。
 */
async function getUsersList(stub: ChaincodeStub, args: string[]): Promise<Buffer> {
    const opt = validate.optional;

    assertArgs(args, [
        opt(validate.fqdn),
        opt(validate.user.localId),
        opt(validate.user.displayName),
        opt(validate.uint),
        opt(validate.uint),
    ]);

    const host = args[0];
    const id = args[1];
    const name = args[2];
    const limit = parseInt(args[3], 10);
    const offset = parseInt(args[4], 10);

    const query: CouchQuery = { selector: {} };

    if (host) {
        query.selector.host = host;
    }
    if (id) {
        query.selector.id = id;
    }
    if (name) {
        query.selector.name = name;
    }
    if (limit) {
        query.limit = limit;
    }
    if (offset) {
        query.skip = offset;
    }

    const results = await stub.getQueryResult(JSON.stringify(query));

    return Buffer.from(JSON.stringify(results));

}


/**
 * 指定されたパラメータをもとに、ユーザー情報を登録します。
 */
async function createUser(stub: ChaincodeStub, args: string[]): Promise<Buffer> {
    assertArgs(args, [
        validate.user.localId,
        validate.fqdn,
        validate.user.displayName,
    ]);

    const id = args[0];
    const host = args[1];
    const name = args[2];
    const locator = id + '@' + host;

    const current = await stub.getState(locator);
    if (current.toString()) {
        throw new Error(`user ${locator} already exists`);
    }

    const newUser = {
        id,
        host,
        locator,
        name,
    };

    const newUserBuffer = Buffer.from(JSON.stringify(newUser));
    await stub.putState(locator, newUserBuffer);

    return newUserBuffer;
}


/**
 * 指定されたパラメータをもとに、ユーザー情報を更新します。
 * 表示名の更新のみ対応しています。
 */
async function updateUser(stub: ChaincodeStub, args: string[]): Promise<Buffer> {
    assertArgs(args, [
        validate.user.locator,
        validate.user.displayName,
    ]);

    const locator = args[0];
    const name = args[1];

    const currentAsBuffer = await stub.getState(locator);
    if (!currentAsBuffer.toString()) {
        throw new Error(`user ${locator} already exists`);
    }

    const current = JSON.parse(currentAsBuffer.toString());
    const updated = {
        ...current,
        name,
    };

    const updatedAsBuffer = Buffer.from(JSON.stringify(updated));

    await stub.putState(locator, updatedAsBuffer);

    return updatedAsBuffer;
}


/**
 * 指定されたパラメータをもとに、ユーザーを無効化します。
 */
async function deleteUser(stub: ChaincodeStub, args: string[]): Promise<void> {
    assertArgs(args, [validate.user.locator]);

    const locator = args[0];

    const current = await stub.getState(locator);
    if (!current.toString()) {
        throw new Error(`user ${locator} not found`);
    }

    await stub.deleteState(locator);
}


Shim.start(new Chaincode('user', userMethods));
