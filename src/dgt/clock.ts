// @ts-nocheck
import { write } from "./serial.ts";

import {
    DGT_SEND_CLOCK,
    DGT_COMMAND_CLOCK_ASCII,
    DGT_COMMAND_CLOCK_END,
    DGT_COMMAND_CLOCK_SET_AND_RUN,
    DGT_COMMAND_CLOCK_BUTTON,
    DGT_COMMAND_CLOCK_VERSION,
} from "./constants.ts";

export async function clockVersion(port) {
    return write(port, new Uint8Array([
        ...DGT_COMMAND_CLOCK_VERSION
    ]));
}

export async function sendTextToClock(port, text = '') {
    const word = text.length < 8 ? text.padEnd(8, ' ') : text.substring(0, 8);
    const arr = Array.from(word).map((_, index) => word.charCodeAt(index));

    return write(port, new Uint8Array([
        ...DGT_COMMAND_CLOCK_ASCII,
        ...arr,
        0,
        0], 200)
    );
}

export async function clearTextFromClock(port) {
    return write(port, new Uint8Array([
        ...DGT_COMMAND_CLOCK_END,
    ]));
}

export async function readClock(port) {
    return write(port, new Uint8Array([
        DGT_SEND_CLOCK,
    ]));
}

export async function setTime(port, minutes = 5, seconds = 0, otherMinutes = 5, otherSeconds = 0, turn = 0x4) {
    return write(port, new Uint8Array([
        ...DGT_COMMAND_CLOCK_SET_AND_RUN,
        0,              // 5, left hours
        minutes,        // 6, left minutes
        seconds,        // 7, left seconds
        0,              // 8, right hours
        otherMinutes,   // 9, right minutes
        otherSeconds,   // 10, right seconds
        turn,           // 11, left counts (1) / right counts (2)
        0,              // 12
    ]))
}

export async function readButton(port) {
    return write(port, new Uint8Array([
        ...DGT_COMMAND_CLOCK_BUTTON
    ]));
}
