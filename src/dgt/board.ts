// @ts-nocheck
import {
    write,
} from "./serial.ts";

import {
    DGT_SEND_BOARD,
    DGT_RETURN_SERIAL,
    DGT_SEND_TRADEMARK,
    DGT_SEND_BATTERY_STATUS,
    DGT_RETURN_LONG_SERIAL,
    DGT_SEND_VERSION,
} from './constants.ts';

export async function getFEN(port) {
    return write(port, new Uint8Array([
        DGT_SEND_BOARD,
    ]));
}

export async function getSerialNumber(port) {
    return write(port, new Uint8Array([
        DGT_RETURN_SERIAL,
    ]));
}

export async function getLongSerialNumber(port) {
    return write(port, new Uint8Array([
        DGT_RETURN_LONG_SERIAL,
    ]));
}

export async function getTrademark(port) {
    return write(port, new Uint8Array([
        DGT_SEND_TRADEMARK,
    ]));
}

export async function getBatteryStatus(port) {
    return write(port, new Uint8Array([
        DGT_SEND_BATTERY_STATUS,
    ]));
}

export async function getVersion(port) {
    return write(port, new Uint8Array([
        DGT_SEND_VERSION,
    ]));
}

export async function sendCustom(port, ...hex) {
    return write(port, new Uint8Array([
      ...hex,
    ]));
}
