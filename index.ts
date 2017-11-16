import * as shim from 'fabric-shim';
import {Chaincode, ErrorResponse, SuccessResponse} from "fabric-shim";
import ChaincodeStub = require("fabric-shim/lib/stub");

class BookChainCode implements Chaincode {

    async Init(stub: ChaincodeStub): Promise<SuccessResponse | ErrorResponse> {
    }

    async Invoke(stub: ChaincodeStub): Promise<SuccessResponse | ErrorResponse> {
    }

}

shim.start(new BookChainCode());
