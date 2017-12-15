import { ChaincodeMethodMapper } from './ChaincodeMethodMap';
import { ChaincodeStub } from 'fabric-shim';
import * as v from '../util/validate';
import { assertArgs } from '../util/assertArgs';
import { Chaincode } from "./Chaincode";
import Shim = require("fabric-shim");


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


async function getTrading(stub: ChaincodeStub, args: string[]): Promise<Buffer> {
    assertArgs(args, [v.uuid]);

    const id = args[0];
    return stub.getState(id);
}


async function getTradingsList(stub: ChaincodeStub, args: string[]): Promise<Buffer> {
    assertArgs(args, [
        v.optional(v.user.locator),
        v.optional(v.user.locator),
        v.optional(v.isbn13),
        v.optional(v.boolean),
        v.optional(v.uint),
        v.optional(v.uint),
    ]);

    throw new Error('not implemented yet');
}


async function createTrading(stub: ChaincodeStub, args: string[]): Promise<Buffer> {
    assertArgs(args, [
        v.user.locator,
        v.user.locator,
        v.isbn13,
    ]);

    throw new Error('not implemented yet');
}


async function markTradingReturned(stub: ChaincodeStub, args: string[]): Promise<Buffer> {
    assertArgs(args, [v.uuid]);

    throw new Error('not implemented yet');
}


async function cancelTrading(stub: ChaincodeStub, args: string[]): Promise<Buffer> {
    assertArgs(args, [v.uuid]);

    throw new Error('not implemented yet');
}



const tradingChaincode = new Chaincode('trading', tradingMethods);

Shim.start(tradingChaincode);
