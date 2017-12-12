/**
 * + argsとschemaの長さが一致しているか
 * + argsの各要素が対応するschemaを満たしているか
 * を検証します。
 * 
 * @param args 検証する対象の文字列配列
 * @param schema 検証に使用するルールを格納した配列
 * @throws argsがschemaを満たさなかったとき
 */
export function assertArgs(args: string[], schema: ((s: string) => boolean)[]): void {
    if (args.length !== schema.length)
        throw new Error(`Incorrect number of arguments. Expecting ${schema.length}, Actual ${args.length}`);

    for (let i = 0; i < args.length; i++) {
        if (!schema[i](args[i]))
            throw new Error(`Invalid literal argument on index ${i}`);
    }
}
