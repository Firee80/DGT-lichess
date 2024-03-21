// @ts-nocheck
import { write } from "./serial.ts";

import {
    DGT_SEND_CLOCK,
    DGT_COMMAND_CLOCK_ASCII,
    DGT_COMMAND_CLOCK_END,
    DGT_COMMAND_CLOCK_SET_AND_RUN,
    DGT_COMMAND_CLOCK_BUTTON,
    DGT_COMMAND_CLOCK_VERSION,
    DGT_CLOCK_MESSAGE,
    DGT_CMD_CLOCK_BEEP,
    DGT_CMD_CLOCK_END,
} from "./constants.ts";

let commands: ClockCommand[] = [];
let executing = false;
let id = 0;
let executingCmd: ClockCommand|undefined;

interface ClockCommand {
    cb: () => Promise<void>;
    name: string,
    priority: number;
    timestamp: number;
    delay?: number;
    cleanup?: () => Promise<void>;
    id?: number;
    reset?: boolean;
    permanent?: boolean;
}

function stateMachine(cmd: ClockCommand) {
    commands.push({ ...cmd, id: id++ });

    if (executing) {
        return;
    }

    const findHighestPriorityCmd = (pop: boolean = true): ClockCommand => {
        let result = {
            cb: () => {},
            priority: -1,
            name: '',
        };

        commands.forEach(item => {
            if (item.priority > result.priority) {
                result = item;
            }
        })

        if (pop) {
            let tempCommands = [...commands];
            tempCommands = tempCommands.filter(item => item.id !== result.id)
            commands = [...tempCommands];
        }

        return result;
    }

    const runCommand = () => {
        executing = true;

        setTimeout(async () => {
            const command = findHighestPriorityCmd();

            if (executingCmd?.permanent && !command.reset && !command.permanent) {
                commands.push({ ...executingCmd });
            }

            executingCmd = command;
            await command.cb();

            if (command.delay && command.cleanup) {
                setTimeout(async () => {
                    // if next command same -> skip cleanup
                    if (command.name !== findHighestPriorityCmd(false).name) {
                        await command.cleanup();
                    }
                    executing = false;

                    if (commands.length > 0) {
                        runCommand();
                    }
                 }, command.delay);
            } else if (commands.length > 0) {
                runCommand();
            } else {
                executing = false;
            }
        }, 100)
    }

    runCommand();
}

export async function clockVersion(port) {
    stateMachine({
        cb: () => write(port, new Uint8Array([
            ...DGT_COMMAND_CLOCK_VERSION
        ])),
        priority: 3,
        timestamp: performance.now(),
        name: 'clockVersion',
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
        priority: time ? 2 : 1, // text,2s (prio=2), text permanent (prio=1)
        timestamp: performance.now(),
        delay: time,
        cleanup: time ? () => clearTextFromClock(port, 4) : undefined,
        name: 'sendTextToClock',
        permanent: !time,
    })
}

export async function clearTextFromClock(port, priority = 0) {
    stateMachine({
        cb: () => write(port, new Uint8Array([
            ...DGT_COMMAND_CLOCK_END
        ])),
        priority,
        timestamp: performance.now(),
        name: 'clearTextFromClock',
        reset: true,
    })
}

export async function readClock(port) {
    stateMachine({
        cb: () => write(port, new Uint8Array([
            DGT_SEND_CLOCK
        ])),
        priority: 3,
        timestamp: performance.now(),
        name: 'readClock',
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
        name: 'setTime',
    })
}

export async function readButton(port) {
    stateMachine({
        cb: () => write(port, new Uint8Array([
            ...DGT_COMMAND_CLOCK_BUTTON
        ])),
        priority: 3,
        timestamp: performance.now(),
        name: 'readButton',
    })
}

export async function beep(port, time) {
    const beepTime = time > 64 ? Math.floor(time / 64) : 1;

    stateMachine({
        cb: () => write(port, new Uint8Array([
            DGT_CLOCK_MESSAGE,         // 0x2b
            4,                         // 0x04
            DGT_CMD_CLOCK_END,         // 0x03
            DGT_CMD_CLOCK_BEEP,        // 0x0b
            beepTime,                  // multiples of 64ms
            0,                         // 0x00
        ])),
        priority: 3,
        timestamp: performance.now(),
        delay: time,
        cleanup: () => {},
        name: 'beep',
    })
}