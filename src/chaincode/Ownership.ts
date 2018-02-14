import { ChaincodeMethodMapper } from './ChaincodeMethodMap';
import { ChaincodeStub } from 'fabric-shim';
import { assertArgs } from '../util/assertArgs';
import * as validate from '../util/validate';
import { CouchQuery } from '../util/CouchQuery';
import { getAllStateQueryResult } from '../util/getAllStateQueryResult';
import { Chaincode } from './Chaincode';
import Shim = require('fabric-shim');
import * as sourceMapSupport from 'source-map-support';

sourceMapSupport.install();


/**
 * ownershipチェーンコードに来たリクエストを各関数に振り分けます。
 */
const ownershipMethods: ChaincodeMethodMapper = (name: string) => {
    switch (name) {
        case 'getOwnership':
            return getOwnership;
        case 'getOwnershipList':
            return getOwnershipList;
        case 'createOwnership':
            return createOwnership;
        case 'deleteOwnership':
            return deleteOwnership;
        default:
            return;
    }
};


/**
 * 指定された条件に合致する、単一の所有情報を取得します。
 */
async function getOwnership(stub: ChaincodeStub, args: string[]): Promise<Buffer> {
    assertArgs(args, [
        validate.user.locator,
        validate.isbn13,
    ]);

    const [owner, isbn] = args;

    // 複合キーの生成
    const key = stub.createCompositeKey('ownership', [owner, isbn]);

    // state db に問い合わせ
    const entityBuffer = await stub.getState(key);

    if (!entityBuffer || entityBuffer.toString().length <= 0) {
        // 見つからなかったとき
        throw new Error(`ownership not find. owner: ${owner}, isbn: ${isbn}`);
    }

    return entityBuffer;
}


/**
 * 指定された条件に合致する所有情報のリストを取得します。
 */
async function getOwnershipList(stub: ChaincodeStub, args: string[]): Promise<Buffer> {

    const optional = validate.optional;

    assertArgs(args, [
        optional(validate.user.locator),
        optional(validate.isbn13),
        optional(validate.uint),
        optional(validate.uint),
    ]);

    const [owner, isbn, limitStr, offsetStr] = args;

    const limit = parseInt(limitStr, 10);
    const offset = parseInt(offsetStr, 10);

    const query: CouchQuery = { selector: {} };
    if (owner) {
        query.selector.data.owner = owner;
    }
    if (isbn) {
        query.selector.data.isbn = isbn;
    }
    if (!isNaN(limit)) {
        query.limit = limit;
    }
    if (!isNaN(offset)) {
        query.skip = offset;
    }

    const resultIterator = await stub.getQueryResult(JSON.stringify(query));

    const results = await getAllStateQueryResult(resultIterator);

    return Buffer.from(JSON.stringify(results));

}


/**
 * 指定された条件で、新規に所有情報を登録します。
 */
async function createOwnership(stub: ChaincodeStub, args: string[]) {
    assertArgs(args, [
        validate.user.locator,
        validate.isbn13,
        validate.datetime,
    ]);

    const [owner, isbn, createdAt] = args;

    const key = stub.createCompositeKey('ownership', args);

    const ownership = {
        owner,
        isbn,
        createdAt,
    };

    await stub.putState(key, Buffer.from(JSON.stringify(ownership)));
}


/**
 * 指定された条件に合致する所有情報を削除します。
 */
async function deleteOwnership(stub: ChaincodeStub, args: string[]): Promise<void> {
    assertArgs(args, [
        validate.user.locator,
        validate.isbn13,
    ]);

    const [owner, isbn] = args;

    const key = stub.createCompositeKey('ownership', args);

    const currentState = await stub.getState(key);

    if (!currentState || currentState.toString().length <= 0) {
        // 見つからなかったとき
        throw new Error(`ownership not find. owner: ${owner}, isbn: ${isbn}`);
    }

    await stub.deleteState(key);
}


Shim.start(new Chaincode('ownership', ownershipMethods));
