import { ChaincodeMethodMapper } from './ChaincodeMethodMap';
import { ChaincodeStub } from 'fabric-shim';
import { assertArgs } from '../util/assertArgs';
import { Chaincode } from './Chaincode';
import * as validate from '../util/validate';
import Shim = require('fabric-shim');
import { CouchQuery } from '../util/CouchQuery';
import { getAllStateQueryResult } from '../util/getAllStateQueryResult';


/**
 * tradingチェーンコードに来たリクエストを各関数にマッピングします。
 */
const tradingMethods: ChaincodeMethodMapper = (methodName: string) => {
    switch (methodName) {
        case 'getTrading':
            return getTrading;
        case 'getTradingList':
            return getTradingsList;
        case 'createTrading':
            return createTrading;
        case 'markTradingReturned':
            return markTradingReturned;
        case 'cancelTrading':
            return cancelTrading;
        default:
            // 無いときはundefined
            return;
    }
};


/**
 * 指定されたID値を持つ取引情報を取得します。
 */
async function getTrading(stub: ChaincodeStub, args: string[]): Promise<Buffer> {
    assertArgs(args, [validate.uuid]);

    const id = args[0];

    const state = stub.getState(id);

    if (state.toString()) {
        throw new Error('not found trading id: ' + id);
    }

    return state;
}


/**
 * 指定された条件に合致する取引情報のリストを取得します。
 */
async function getTradingsList(stub: ChaincodeStub, args: string[]): Promise<Buffer> {

    const opt = validate.optional;

    assertArgs(args, [
        opt(validate.user.locator),
        opt(validate.user.locator),
        opt(validate.isbn13),
        opt(validate.boolean),
        opt(validate.uint),
        opt(validate.uint),
    ]);

    const owner = args[0];
    const borrower = args[1];
    const isbn = args[2];
    const isReturned = args[3];
    const limit = parseInt(args[4], 10);
    const offset = parseInt(args[5], 10);

    const query: CouchQuery = { selector: {} };

    if (owner) {
        query.selector.owner = owner;
    }
    if (borrower) {
        query.selector.borrower = borrower;
    }
    if (isbn) {
        query.selector.isbn = isbn;
    }
    if (isReturned) {
        query.selector.$exists = 'returnedAt';
    }
    if (limit) {
        query.limit = limit;
    }
    if (offset) {
        query.skip = offset;
    }

    const iterator = await stub.getQueryResult(JSON.stringify(query));
    const results = getAllStateQueryResult(iterator);

    return Buffer.from(JSON.stringify(results));
}


/**
 * 貸出情報を登録します。
 */
async function createTrading(stub: ChaincodeStub, args: string[]): Promise<Buffer> {
    assertArgs(args, [
        validate.uuid,
        validate.user.locator,
        validate.user.locator,
        validate.isbn13,
        validate.datetime,
    ]);

    const id = args[0];

    const exist = await stub.getState(id);

    if (exist.toString()) {
        // 既になんか存在していたとき
        throw new Error('duplicate trading id: ' + id);
    }

    const owner = args[0];
    const borrower = args[1];
    const isbn = args[2];
    const lendAt = args[3];

    const trading = {
        id,
        owner,
        borrower,
        isbn,
        lendAt,
    };

    return Buffer.from(JSON.stringify(trading));

}


/**
 * 指定された貸出情報を返却済みとして更新します。
 */
async function markTradingReturned(stub: ChaincodeStub, args: string[]): Promise<Buffer> {
    assertArgs(args, [
        validate.uuid,
        validate.datetime,
    ]);

    const id = args[0];
    const lendAt = args[1];

    const currentBuffer = await stub.getState(id);

    if (!currentBuffer.toString()) {
        // 更新しようとしたのになかったらエラー
        throw new Error('not found trading id: ' + id);
    }

    const current = JSON.parse(Buffer.toString());
    const updated = {
        ...current,
        lendAt,
    };

    const updatedBuffer = Buffer.from(JSON.stringify(updated));
    await stub.putState(id, updatedBuffer);

    return updatedBuffer;
}


/**
 * TODO: どうしよう。
 */
async function cancelTrading(stub: ChaincodeStub, args: string[]): Promise<Buffer> {
    assertArgs(args, [validate.uuid]);

    throw new Error('not implemented yet');
}



const tradingChaincode = new Chaincode('trading', tradingMethods);

Shim.start(tradingChaincode);
