
export function uuid(str: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(str);
}

export function fqdn(str: string): boolean {
    return /^(?!:\/\/)([a-zA-Z0-9]+\.)?[a-zA-Z0-9][a-zA-Z0-9-]+\.[a-zA-Z]{2,6}?$/i.test(str);
}

export function isbn13(str: string): boolean {
    return /^[0-9]{13}$/.test(str);
}

export function datetime(str: string): boolean {
    const date: number = Date.parse(str);
    return !isNaN(date);
}

export namespace user {

    export function localId(str: string): boolean {
        return /^[a-zA-Z_]{4,15}$/.test(str);
    }

    export function displayName(str: string): boolean {
        return /^.{1,50}$/.test(str);
    }

    export function locator(str: string): boolean {
        const sp = str.split('@');
        return sp.length === 2 &&
            localId(sp[0]) &&
            fqdn(sp[1]);
    }

}

export namespace room {

    export function purpose(str: string): boolean {
        return str === "rental" || str === "return";
    }

    export function role(str: string): boolean {
        return str === "inviter" || str === "guest";
    }

}
