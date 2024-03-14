import { useState } from "react";
import { openPort } from "../dgt/dgt.ts";
import { Color, IMove, IPiece } from "../dgt/types.ts";
import { convertFENToPieces, countMove, getMoveSquares } from "../dgt/util.ts";

export function useDGTBoard(): IDGTBoard {
    const [connected, setConnected] = useState<boolean>(false);
    const [fen, setFEN] = useState<string>('');
    const [pieces, setPieces] = useState<IPiece[]>([]);
    const [moves, setMoves] = useState<IMove[]>([]);
    const [info, setInfo] = useState<IBoardInfo|undefined>();
    const [timers, setTimers] = useState<number[]>([]);

    async function connect() {
        disconnect();

        const portOpen = await openPort();
        setConnected(portOpen);

        if (portOpen) {
            setTimers([
                createUpdateLocalStorageFENInterval(),
                createUpdateFENInterval(),
                createUpdatePiecesInterval(),
                createUpdateMovesInterval(),
                await createUpdateBoardInfoInterval(),
            ]);
        }
    }

    function disconnect() {
        timers.forEach(clearInterval);
        setTimers([]);
        setConnected(false);
        // @ts-ignore
        window.dgt?.close();
    }

    function reset() {
        disconnect();
        setPieces([]);
        setInfo(undefined);
        setMoves([]);
        setFEN('');
        removeLocalStorageKeys();
    }

    function takeback() {
        setMoves(moves => {
            const result = [...moves];
            result.pop();

            return result;
        })
    }


    function createUpdateLocalStorageFENInterval(): number {
        return setInterval(async () => {
            // @ts-ignore
            await window.dgt?.getFEN();
        }, 250);
    }

    function createUpdateFENInterval(): number {
        let fen = '';

        return setInterval(() => {
            const tempFEN = localStorage.getItem('boardFEN') ?? '';

            if (tempFEN !== fen) {
                fen = tempFEN;
                setFEN(tempFEN);
            }
        }, 250);
    }

    function createUpdatePiecesInterval(): number {
        let fen = '';

        return setInterval(() => {
            const tempFEN = localStorage.getItem('boardFEN') ?? '';

            if (tempFEN !== fen) {
                fen = tempFEN;
                setPieces(convertFENToPieces(fen));
            }
        }, 250);
    }

    function createUpdateMovesInterval(): number {
        let fen = '';

        const boardMoves = localStorage.getItem('boardMoves') ?? '';

        if (boardMoves.length) {
            setMoves(JSON.parse(boardMoves));
        }

        return setInterval(() => {
            const tempFEN = localStorage.getItem('boardFEN') ?? '';

            if (tempFEN !== fen) {
                fen = tempFEN;

                setMoves(moves => {
                    const lastMove = moves[moves.length - 1];
                    const lastFEN = lastMove?.endFEN ?? 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
                    const move = countMove(lastFEN, fen);
                    const lastMoveColor = lastMove?.color ??  Color.Black;

                    if (move && lastMoveColor !== move.color) {
                        const { startRow, startColumn, endColumn, endRow } = move;

                        const possibleMoves = getMoveSquares(move.piece, {
                            row: startRow,
                            column: startColumn,
                        })

                        if (possibleMoves.some(item =>
                          item.column === endColumn &&
                          item.row === endRow
                        )) {
                            const result = [...moves, move];
                            localStorage.setItem('boardMoves', JSON.stringify(result));

                            return [...moves, move];
                        }
                    }

                    return moves;
                });
            }
        }, 250);
    }

    async function createUpdateBoardInfoInterval(): Promise<number> {
        let info: IBoardInfo = {
            trademark: [],
            capacity: 0,
            serial: '',
            version: ''
        };

        async function updateBoardInfo () {
            // @ts-ignore
            await window.dgt?.getSerial();
            // @ts-ignore
            await window.dgt?.getTrademark();
            // @ts-ignore
            await window.dgt?.getVersion();
            // @ts-ignore
            await window.dgt?.getBattery();

            const serial = localStorage.getItem('boardSerial') ?? '';
            const trademark = localStorage.getItem('boardTrademark') ?? '';
            const version = localStorage.getItem('boardVersion') ?? '';
            const battery = localStorage.getItem('boardBattery') ?? '';
            const batteryObj = battery.length ? JSON.parse(battery) : {};
            const capacity = batteryObj?.currentCapacity ?? 0;
            const [trade1, trade2] = trademark.split('.');

            if (
              info.version !== version ||
              info.serial !== serial ||
              info.capacity !== capacity ||
              info.trademark[0] !== trade1 ||
              info.trademark[1] !== trade2
            ) {
                info = {
                    trademark: [trade1, trade2],
                    version,
                    serial,
                    capacity,
                };

                setInfo(info);
            }
        }

        await updateBoardInfo();

        return setInterval(updateBoardInfo, 10000);
    }

    function removeLocalStorageKeys (): void {
        localStorage.removeItem('boardFEN');
        localStorage.removeItem('boardMoves');
        localStorage.removeItem('boardSerial');
        localStorage.removeItem('boardTrademark');
        localStorage.removeItem('boardVersion');
        localStorage.removeItem('boardBattery');
    }

    return {
        isConnected: connected,
        pieces,
        moves,
        info,
        fen,
        api: {
            connect,
            disconnect,
            reset,
            takeback,
        },
    }
}

export interface IDGTBoard {
    isConnected: boolean;
    pieces: IPiece[];
    moves: IMove[];
    fen: string;
    info?: IBoardInfo,
    api: IDGTAPI;
}

export interface IDGTAPI {
    connect: () => Promise<void>;
    disconnect: () => void;
    reset: () => void;
    takeback: () => void;
}

export interface IBoardInfo {
    trademark: string[];
    version: string;
    serial: string;
    capacity: number;
}
