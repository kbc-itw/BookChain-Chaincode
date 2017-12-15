import {
    ChaincodeInterface,
    ChaincodeStub,
    Response,
} from 'fabric-shim';
import Shim = require('fabric-shim');
import { ChaincodeMethodMapper } from './ChaincodeMethodMap';


/**
 * `Shim.start` に渡すやつ。
 */
export class Chaincode implements ChaincodeInterface {


    /**
     * @param name このChaincodeの名前
     * @param methods 関数名に応じた処理を行う関数を取得するもの。
     */
    public constructor(
        private name: string,
        private methods: ChaincodeMethodMapper,
    ) {}


    /**
     * @override
     */
    public async Init(stub: ChaincodeStub): Promise<Response> {
        // 特に何もしない。
        console.info(`========== Instantiated chaincode ${this.name} ==========`);
        return Shim.success();
    }

    /**
     * @override
     */
    public async Invoke(stub: ChaincodeStub): Promise<Response> {

        const request = stub.getFunctionAndParameters();

        console.info(request);

        // リクエストに応じた関数を取得
        const method = this.methods(request.fcn);

        if (!method) {
            // 該当する関数名の処理が登録されていなかったとき。
            const errorMessage = `Received unknown function ${request.fcn} invocation.`;
            console.error(errorMessage);
            return Shim.error(Buffer.from(errorMessage));
        }

        try {
            const payload = await method(stub, request.params);
            return Shim.success(payload);
        } catch (err) {
            console.error(err);
            return Shim.error(Buffer.from(err));
        }
    }

}
