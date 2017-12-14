import { ChaincodeStub } from 'fabric-shim';

/**
 * Chaincode中のメソッドとして実行される関数のシグネチャです。
 */
export interface ChaincodeMethod {
    (stub: ChaincodeStub, args: string[]): Promise<Buffer>;
}

/**
 * 関数名を受け取って、該当の処理を行う関数を返却します。
 * @param methodName Chaincode呼出要求時に渡されてきた **fcn**
 */
export interface ChaincodeMethodMapper {
    (methodName: string): ChaincodeMethod | undefined;
}
