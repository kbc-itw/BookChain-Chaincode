import * as shim from 'fabric-shim';
import {ChaincodeInterface, ChaincodeStub, Response} from 'fabric-shim';


class BookChainCode implements ChaincodeInterface {

    async Init(stub: ChaincodeStub): Promise<Response> {
        return undefined;
    }

    async Invoke(stub: ChaincodeStub): Promise<Response> {
        return undefined;
    }

}

shim.start(new BookChainCode());
