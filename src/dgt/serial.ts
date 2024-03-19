// @ts-nocheck
import { getVersion } from "./board.ts";

export async function read(port, cbs) {
    if (!port || !port.readable || port.readable.locked) {
        return;
    }

    const reader = port.readable.getReader();

    if ('dgt' in window) {
        Object.assign(window.dgt, { reader: reader });
    }

    if (!reader) {
        return;
    }

    const values: any[] = [];

    let counter = 0;
    let messageCode = 0;
    let messageLength = 0;

    try {
        while (!reader.locked) {
            const result = await reader.read();

            result.value?.forEach(item => {
                if (counter === 0) {
                    messageCode = item;
                } else if (counter === 2) {
                    if (messageCode === 146) {
                        messageLength = 164;
                    } else {
                        messageLength = item;
                    }
                }

                values.push(item);
                counter++;

                if (counter === messageLength) {
                    let transform;

                    if (cbs?.[messageCode]) {
                        transform = cbs?.[messageCode](values);
                    }

                    window.dgt.data.push({
                        code: messageCode,
                        data: transform ?? [...values],
                    });
                    values.length = 0;
                    counter = 0;
                    messageCode = 0;
                    messageLength = 0;
                }
            });

            if (result.done) {
                window.dgt.data.push(values);
                values.length = 0;
                counter = 0;
                messageCode = 0;
                messageLength = 0;
                break;
            }
        }

        reader.releaseLock();

        return values;
    } catch (e) {
        console.log('Reader error',  { error: e, data: values });
    } finally {
        reader.releaseLock();
    }
}

export async function write(port, data) {
    if (!port || !port.writable || !data) {
        return;
    }

    const writer = !port.writable.locked && port.writable.getWriter();

    if (!writer) {
        return;
    }

    try {
        await writer.write(data);
    } catch (e) {
        console.log('Writer error',  { error: e, data });
    } finally {
        writer.releaseLock();
    }
}

export async function testConnection(port: any) {
    if (!port) {
        return false;
    }

    await port.open({ baudRate: 9600 });

    if (!port.readable || port.readable.locked) {
        return false;
    }

    setTimeout(() => getVersion(port));

    const reader = port.readable.getReader();

    if (!reader) {
        return false;
    }

    let counter = 0;
    let messageLength = 5;

    try {
        while (true) {
            if (reader.locked) {
                break;
            }

            const result = await reader.read();

            counter += result.value?.length ?? 0;

            if (counter >= messageLength) {
                return true;
            }

            if (result.done) {
                break;
            }
        }
    } finally {
        reader.releaseLock();
    }

    return false;
}

export async function closePort(port) {
    try {
        await window.dgt?.reader?.cancel();
        await window.dgt?.reader?.releaseLock();

        const writer = port.writable;
        await writer?.close();
        await port.close();
    } catch (e) {
        console.log('error', e);
    }

    if (window.dgt?.timer) {
        clearInterval(window.dgt.timer);
    }

    if (window.dgt?.data) {
        window.dgt.data.length = 0;
    }

    if ('dgt' in window) {
        delete window.dgt;
    }
}