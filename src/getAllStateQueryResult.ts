import {
    QueryResult,
    StateQueryIterator
} from "fabric-shim";



/**
 * イテレーターからオブジェクトを取り出して、配列に格納したものを返却します。
 */
export async function getAllStateQueryResult(iterator: StateQueryIterator): Promise<any[]> {
    const results = [];

    for (let res: QueryResult = await iterator.next(); !res.done; res = await iterator.next()) {

        try {
            results.push(
                JSON.parse(res.value.value.toString('utf8'))
            );
        } catch (err) {
            console.error(err);
        }

    }

    await iterator.close();

    return results;

}
