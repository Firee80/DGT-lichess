// @ts-nocheck
export function parseFEN(values: number[]) {
    const [first, second, third, ...rest] = values;

    const myFEN = rest.map(item => {
        if (item === 1) {
            return 'P';
        } else if (item === 2) {
            return 'R';
        } else if (item === 3) {
            return 'N';
        } else if (item === 4) {
            return 'B';
        } else if (item === 5) {
            return 'K';
        } else if (item === 6) {
            return 'Q';
        }

        if (item === 7) {
            return 'p';
        } else if (item === 8) {
            return 'r';
        } else if (item === 9) {
            return 'n';
        } else if (item === 10) {
            return 'b';
        } else if (item === 11) {
            return 'k';
        } else if (item === 12) {
            return 'q';
        }
        return ' ';
    });

    const hepo: string[] = [];

    myFEN.forEach((item, index) => {
        const idx = Math.floor(index / 8);

        hepo[idx] = (hepo[idx] ?? '') + item;
    });

    const fenni = hepo.map(item => {
        if (!item.includes(' ')) {
            return item;
        }

        const splitted = item.split('');

        let counter = 0;

        let result = '';

        splitted.forEach(letter => {
            if (letter !== ' ') {
                if (counter > 0) {
                    result += counter;
                    counter = 0;
                }
                result += letter;
            } else {
                counter++;
            }
        });

        if (counter > 0) {
            result += counter;
        }

        return result;
    });

    return fenni.join('/');
}

export function parseClock(values: number[]) {
    const [
        first,
        second,
        third,
        fourth,
        fifth,    // minutes
        sixth,
        seventh,
        eight,
        nineth,
        tenth,
    ] = values;

    const minutes = fifth;
    const tenths = Math.floor(sixth / 16);
    const secs = Math.floor(sixth % 16);
    const topTimeSeconds = minutes * 60 + 10 * tenths + secs;
    const topTimeText = `${minutes}:${tenths}${secs}`;

    const bottomMinutes = eight;
    const bottomTenths = Math.floor(nineth / 16);
    const bottomSecs = Math.floor(nineth % 16);
    const bottomTimeSeconds = bottomMinutes * 60 + 10 * bottomTenths + bottomSecs;
    const bottomTimeText = `${bottomMinutes}:${bottomTenths}${bottomSecs}`;

    return {
        topTimeSeconds,
        topTimeText,
        bottomTimeSeconds,
        bottomTimeText,
    }
}

export function parseVersion(values: number[]) {
    const [
        first,
        second,
        third,
        fourth, // major version
        fifth,  // minor version
    ] = values;

    const minor = fifth.toString().length > 1 ? fifth.toString() : '0' + fifth;

    return 'DGT version ' + fourth + '.' + minor;
}

export function parseBattery(values: number[]) {
    const [
        first,
        second,
        third,
        fourth,
        fifth,
        sixth,
        seventh,
        eight,
        nineth,
        tenth,
        eleventh,
        twelveth
    ] = values;

    return {
        currentCapacity: fourth,
        hoursLeft: fifth === 127 ? 0 : fifth, // 127 = not available
        minutesLeft: sixth === 127 ? 0 : sixth,
        onHours: seventh,
        onMinutes: eight,
        standbyDays: nineth,
        standbyHours: tenth,
        standbyMinutes: eleventh,
        statusBits: twelveth,
    }
}

export function parseASCII(values: number[]) {
    const [
        first,
        second,
        third,
        ...rest
    ] = values;

    let result = String.fromCharCode(...rest)
    result = result.split("\r\n")

    return result.length > 1 ? result.join('') : result[0];
}
