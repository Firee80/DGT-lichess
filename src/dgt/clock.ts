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

let commands: ClockCommand[] = [];
let executing = false;

interface ClockCommand {
    cb: () => Promise<void>;
    priority: number;
    timestamp: number;
    delay?: number;
    cleanup?: () => Promise<void>;
}

function stateMachine(cmd: ClockCommand) {
    commands.push(cmd);

    if (executing) {
        return;
    }

    const findHighestPriorityCmd = (): ClockCommand => {
        let result = {
            cb: () => {},
            priority: -1,
        };

        commands.forEach(item => {
            if (item.priority > result.priority) {
                result = item;
            }
        })

        return result;
    }

    const runCommand = () => {
        executing = true;
        const {
            cb,
            cleanup,
            timestamp,
            priority,
            delay,
        } = findHighestPriorityCmd();

        let tempCommands = [...commands];
        tempCommands = tempCommands.filter(item =>
          item.timestamp !== timestamp &&
          item.priority !== priority &&
          item.delay !== delay
        )

        commands = [...tempCmds];

        setTimeout(async () => {
            await cb();

            if (delay && cleanup) {
                setTimeout(async () => {
                    await cleanup();
                    executing = false;

                    if (commands.length > 0) {
                        runCommand();
                    }
                 }, delay);
            } else if (commands.length > 0) {
                runCommand();
            }
        }, 100)
    }
}

export async function clockVersion(port) {
    stateMachine({
        cb: () => write(port, new Uint8Array([
            ...DGT_COMMAND_CLOCK_VERSION
        ])),
        priority: 3,
        timestamp: performance.now(),
    })
}

export async function sendTextToClock(port, text = '', time) {
    const word = text.length < 8 ? text.padEnd(8, ' ') : text.substring(0, 8);
    const arr = Array.from(word).map((_, index) => word.charCodeAt(index));

    stateMachine({
        cb: () => write(port, new Uint8Array([
            ...DGT_COMMAND_CLOCK_ASCII,
            ...arr,
            0,
            0])),
        priority: time ? 2 : 1,
        timestamp: performance.now(),
        time,
        cleanup: time ? () => clearTextFromClock(port) : undefined,
    })
}

export async function clearTextFromClock(port) {
    stateMachine({
        cb: () => write(port, new Uint8Array([
            ...DGT_COMMAND_CLOCK_END
        ])),
        priority: 0,
        timestamp: performance.now(),
    })
}

export async function readClock(port) {
    stateMachine({
        cb: () => write(port, new Uint8Array([
            DGT_SEND_CLOCK
        ])),
        priority: 3,
        timestamp: performance.now(),
    })
}

export async function setTime(port, minutes = 5, seconds = 0, otherMinutes = 5, otherSeconds = 0, turn = 0x4) {
    stateMachine({
        cb: () => write(port, new Uint8Array([
            ...DGT_COMMAND_CLOCK_SET_AND_RUN,
            0,              // 5, left hours
            minutes,        // 6, left minutes
            seconds,        // 7, left seconds
            0,              // 8, right hours
            otherMinutes,   // 9, right minutes
            otherSeconds,   // 10, right seconds
            turn,           // 11, left counts (1) / right counts (2)
            0,              // 12
        ])),
        priority: 3,
        timestamp: performance.now(),
    })
}

export async function readButton(port) {
    stateMachine({
        cb: () => write(port, new Uint8Array([
            ...DGT_COMMAND_CLOCK_BUTTON
        ])),
        priority: 3,
        timestamp: performance.now(),
    })
}
