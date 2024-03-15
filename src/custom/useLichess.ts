import {useEffect, useState} from "react";
import {Color, IMove, IPiece} from "../dgt/types.ts";
import {convertFENToPieces, countMove, makeMove,} from "../dgt/util.ts";

export function useLichess(): ILichess {
    const [fen, setFEN] = useState<string>('');
    const [pieces, setPieces] = useState<IPiece[]>([]);
    const [moves, setMoves] = useState<IMove[]>([]);
    const [profile, setProfile] = useState<ILichessProfile|undefined>();
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [gameId, setGameId] = useState<string>('');
    const [myTurn, setMyTurn] = useState<boolean>(false);
    const [myColor, setMyColor] = useState<Color|undefined>(undefined);
    const [seekLoading, setSeekLoading] = useState<boolean>(false);
    const [whiteTime, setWhiteTime] = useState<number>(0);
    const [blackTime, setBlackTime] = useState<number>(0);
    const [gameResult, setGameResult] = useState<GameResult|undefined>();
    const [blackProfile, setBlackProfile] = useState<IProfile|undefined>();
    const [whiteProfile, setWhiteProfile] = useState<IProfile|undefined>();
    const [game, setGame] = useState<IGamePartial|undefined>();

    // update pieces from fen change
    useEffect(() => {
        setPieces(convertFENToPieces(fen));
    }, [fen]);

    // show opponent name + rating at game start on DGT clock
    useEffect(() => {
        if (!isPlaying || !blackProfile || !whiteProfile || !profile) {
            return;
        }

        const opponentProfile = whiteProfile?.name === profile?.userName ? blackProfile : whiteProfile;
        const {
            name,
            rating,
        } = opponentProfile ?? {};

        setTimeout(() => {
            // @ts-ignore
            window.dgt?.clock?.setText?.(`${name.toUpperCase()}`);

            setTimeout(() => {
                // @ts-ignore
                window.dgt?.clock?.setText?.(`${rating}`);

                setTimeout(() => {
                    // @ts-ignore
                    window.dgt?.clock?.clearText?.()
                }, 4000)
            }, 4000)
        })
    }, [blackProfile, whiteProfile, profile, isPlaying]);

    // show game result at game end on DGT clock
    useEffect(() => {
        if (gameResult && !isPlaying) {
            setTimeout(() => {
                // @ts-ignore
                window.dgt?.clock?.setText?.(gameResult)

                setTimeout(() => {
                    // @ts-ignore
                    window.dgt?.clock?.clearText?.()
                }, 10000)
            }, 100)
        }
    }, [gameResult, isPlaying]);

    // update times on DGT clock
    useEffect(() => {
        if (seekLoading || !('dgt' in window)) {
            return;
        }

        const setTime = (wTime: number, bTime: number, runClock: number) => {
            const wSeconds = Math.floor(wTime / 1000);
            const wMinutes = Math.floor(wSeconds / 60);
            const wLeftSeconds = wSeconds - (wMinutes * 60);

            const bSeconds = Math.floor(bTime / 1000);
            const bMinutes = Math.floor(bSeconds / 60);
            const bLeftSeconds = bSeconds - (bMinutes * 60);

            // @ts-ignore
            window.dgt.clock.setTime(wMinutes, wLeftSeconds, bMinutes, bLeftSeconds, runClock)
        }

        if (!isPlaying) {
            setTime(whiteTime, blackTime, 0);
        } else {
            const runClock = myTurn ? (myColor === Color.White ? 1 : 2) : (myColor === Color.White ? 2 : 1);

            setTime(whiteTime, blackTime, runClock);
        }
    }, [whiteTime, blackTime, myColor, myTurn, isPlaying, seekLoading]);

    async function getAccount(password: string): Promise<ILichessProfile|undefined> {
        if (!password || !password.length) {
            return;
        }

        const result = await fetch('https://lichess.org/api/account', {
            headers: {
                "Authorization": `Bearer ${password}`,
            }
        })

        if (!result.body) {
            return;
        }

        const responseText= await result.text();

        const {
            profile,
            username,
            perfs,
            playing,
        } = JSON.parse(responseText);

        return {
              userName: username,
              firstName: profile.firstName,
              lastName: profile.lastName,
              rapidRating: perfs.rapid.rating,
              blitzRating: perfs.blitz.rating,
              bulletRating: perfs.bullet.rating,
              currentGame: playing?.split('/')?.[3] ?? '',
          }
    }

    async function connect(password: string, handleOngoingGame: boolean = true): Promise<ILichessProfile|undefined> {
        const profile = await getAccount(password);

        if (!profile) {
            await disconnect();
            return;
        }

        setProfile(profile);
        setGameId(profile.currentGame ?? '')
        setIsConnected(true)

        if (profile.currentGame && handleOngoingGame) {
            await handleGameStream(profile.currentGame, password);
        }

        return profile;
    }

    async function disconnect() {
        setSeekLoading(false);
        setFEN('');
        setMoves([]);
        setProfile(undefined);
        setIsConnected(false);
        setIsPlaying(false);
        setGameId('');
        setMyTurn(false);
        setMyColor(undefined);
        setWhiteTime(0);
        setBlackTime(0);
        setGameResult(undefined);
        setBlackProfile(undefined);
        setWhiteProfile(undefined);
        setGame(undefined);
        // @ts-ignore
        window.dgt?.clock?.clearText?.();
        // @ts-ignore
        window.dgt?.clock?.setTime?.(0, 0, 0, 0, 0);

        // @ts-ignore
        await window.lichess?.reader?.cancel();
        // @ts-ignore
        await window.lichess?.reader?.releaseLock();

        // @ts-ignore
        if (window?.lichess?.reader) {
            // @ts-ignore
            window.lichess.reader = undefined;
        }
    }

    async function seekGameId(parameters: ISeekParameters, password: string): Promise<string|undefined> {
        const profile = await connect(password, false);

        if (!profile) {
            return;
        }

        const {
            rapidRating,
            currentGame
        } = profile;

        if (currentGame) {
            return currentGame;
        }

        const {
            minutes,
            increment,
            rated,
            color,
            posRange,
            negRange,
        } = parameters;

        const game = {
            time: minutes,
            increment,
            rated,
            ratingRange:  `${rapidRating + negRange}-${rapidRating + posRange}`,
        };

        if (color) {
            Object.assign(game, { color });
        }

        const body = Object.keys(game).reduce((result, key) => {
            // @ts-ignore
            return result.length ? `${result}&${key}=${game[key]}` : `${key}=${game[key]}`;
        }, '');

        const stream = await fetch('https://lichess.org/api/board/seek', {
            headers: {
                "Authorization": `Bearer ${password}`,
                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
            },
            method: "POST",
            body: body
        });

        await readStream()(stream);

        return (await connect(password, false))?.currentGame;
    }

    function updateMoves(mvs: string, myColor: Color = Color.White) {
        const moves = mvs.split(' ');
        let fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
        const newMoves: IMove[] = [];

        moves.forEach((move: string) => {
            const newFEN = makeMove(move, fen);
            const mv = countMove(fen, newFEN);

            if (mv) {
                newMoves.push(mv);
            }

            fen = newFEN;
        })

        const colorTurn = (moves.length % 2) === 1 ? Color.Black : Color.White;

        setMoves(newMoves);
        setMyTurn(colorTurn === myColor)
        setFEN(fen);
    }

    async function seek(parameters: ISeekParameters, password: string): Promise<void> {
        if (!password) {
            return;
        }

        await disconnect();

        const {
            minutes,
            increment,
        } = parameters;

        // @ts-ignore
        window.dgt?.clock?.setText?.(`${minutes} + ${increment}`);

        setSeekLoading(true);

        const id = await seekGameId(parameters, password);

        setSeekLoading(false);

        // @ts-ignore
        window.dgt?.clock?.clearText?.();

        if (id) {
            await handleGameStream(id, password);
        }
    }

    async function handleGameStream(gameStreamId: string, password: string) {
        let myClr: Color|undefined;

        const onGameFullMessage = (data: any) => {
            const {
                white,
                black,
                clock,
                rated,
                state,
            } = data;

            // @ts-ignore
            window.dgt?.sendCustom?.(0x2b, 0x04, 0x03, 0x0b, 0x01, 0x00);

            setBlackProfile({
                name: black.name,
                rating: black.rating,
                provisional: black.provisional ?? false,
                title: black.title ?? '',
            })

            setWhiteProfile({
                name: white.name,
                rating: white.rating,
                provisional: white.provisional ?? false,
                title: white.title ?? '',
            })

            if (white.name === profile?.userName) {
                setMyColor(Color.White);
                setMyTurn(true)
                myClr = Color.White;
            } else if (black.name === profile?.userName) {
                setMyColor(Color.Black);
                setMyTurn(false)
                myClr = Color.Black;
            }

            if (state && state.wtime && state.btime) {
                setWhiteTime(state.wtime);
                setBlackTime(state.btime);
            } else {
                setWhiteTime(clock.initial);
                setBlackTime(clock.initial);
            }

            setGame({
                minutes: Math.floor(clock.initial / 60 / 1000),
                increment: clock.increment / 1000,
                rated: rated ?? false,
            })

            if (state?.moves) {
                updateMoves(state.moves, myClr);
            } else {
                setMoves([]);
                setFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR');
            }
        }

        const onGameStateMessage = (data: any) => {
            const {
                status,
                winner,
                moves,
                wtime: whiteTime,
                btime: blackTime,
            } = data;

            if (
              status === GameStatus.Aborted ||
              status === GameStatus.OutOfTime ||
              status === GameStatus.Resign ||
              status === GameStatus.Mate
            ) {
                // @ts-ignore
                window.dgt?.sendCustom?.(0x2b, 0x04, 0x03, 0x0b, 0x10, 0x00);
            }

            if (winner === Color.White) {
                setGameResult(GameResult.WhiteWon);
            } else if (winner === Color.Black) {
                setGameResult(GameResult.BlackWon);
            } else if (winner) {
                setGameResult(GameResult.Draw);
            }

            if (moves) {
                updateMoves(moves, myClr);
            }

            if (whiteTime) {
                setWhiteTime(whiteTime)
            }

            if (blackTime) {
                setBlackTime(blackTime)
            }
        }

        const onMessage = (data: any) => {
            const { type } = data;

            if (type === MessageType.GameFull) {
                onGameFullMessage(data);
            }

            if (type === MessageType.GameState) {
                onGameStateMessage(data);
            }
        }

        const stream = await fetch(`https://lichess.org/api/board/game/stream/${gameStreamId}`, {
            headers: {
                "Authorization": `Bearer ${password}`,
                "Accept":"application/x-ndjson",
            },
            method: "GET",
        });

        setIsPlaying(true);

        await readStream(onMessage)(stream);

        setIsPlaying(false);
    }

    async function move(move: string, password: string, cacheMove?: IMove): Promise<void> {
        if (!gameId || !password || !isPlaying) {
            return;
        }

        if (cacheMove) {
            setMoves(moves => [...moves, cacheMove]);
            setFEN(cacheMove.endFEN);
        }

        // https://lichess.org/api/board/game/{gameId}/move/{move}
        const stream = await fetch(`https://lichess.org/api/board/game/${gameId}/move/${move}`, {
            headers: {
                "Authorization": `Bearer ${password}`,
                "Accept":"application/x-ndjson",
            },
            method: "POST",
        });

        const result = await readStream()(stream);

        // TODO: handle error (remove cache move)
        console.log('Move result', { result });

        return;
    }

    const api: ILichessAPI = {
        connect,
        disconnect,
        seek,
        move,
    }

    return {
        api,
        pieces,
        moves,
        fen,
        profile,
        isConnected,
        isPlaying,
        myTurn,
        myColor,
        seekLoading,
        whitePlayer: {
            time: whiteTime,
            name: whiteProfile?.name ?? '',
            rating: whiteProfile?.rating ?? 0,
            provisional: whiteProfile?.provisional ?? false,
            title: whiteProfile?.title ?? '',
        },
        blackPlayer: {
            time: blackTime,
            name: blackProfile?.name ?? '',
            rating: blackProfile?.rating ?? 0,
            provisional: blackProfile?.provisional ?? false,
            title: blackProfile?.title ?? '',
        },
        game: {
            id: gameId,
            minutes: game?.minutes ?? 0,
            increment: game?.increment ?? 0,
            rated: game?.rated ?? false,
            result: gameResult,
        },

    }
}

const readStream = (processLine: any = () => {}) => (response: any) => {
    const reader = response.body.getReader();
    const matcher = /\r?\n/;
    const decoder = new TextDecoder();
    let buf = '';

    Object.assign(window, { lichess: { reader: reader } });

    const loop = () =>
      // @ts-ignore
      reader.read().then(({ done, value }) => {
          if (done) {
              if (buf.length > 0) processLine(JSON.parse(buf));
          } else {
              const chunk = decoder.decode(value, {
                  stream: true
              });
              buf += chunk;

              const parts = buf.split(matcher);
              // @ts-ignore
              buf = parts.pop();

              for (const i of parts.filter(p => p)) processLine(JSON.parse(i));
              return loop();
          }
      });

    return loop();
}

export interface ILichess {
    api: ILichessAPI;
    pieces: IPiece[];
    moves: IMove[];
    fen: string;
    profile?: ILichessProfile;
    isConnected: boolean;
    isPlaying: boolean;
    myTurn: boolean;
    myColor?: Color;
    seekLoading: boolean;
    blackPlayer: IPlayer;
    whitePlayer: IPlayer;
    game: IGame;
}

export interface ILichessAPI {
    connect: (password: string) => Promise<ILichessProfile|undefined>;
    disconnect: () => void;
    seek: (parameters: ISeekParameters, password: string) => Promise<void>;
    move: (move: string, password: string, cacheMove?: IMove) => Promise<void>;
}

export interface ILichessProfile {
    userName: string;
    firstName: string;
    lastName: string;
    rapidRating: number;
    blitzRating: number;
    bulletRating: number;
    currentGame?: string;
}

interface ISeekParameters {
    minutes: number;
    increment: number;
    rated: boolean;
    negRange: number;
    posRange: number;
    color?: Color;
}

interface IPlayer {
    time: number;
    name: string;
    rating: number;
    provisional: boolean;
    title: string;
}

interface IProfile {
    name: string;
    rating: number;
    provisional: boolean;
    title: string;
}

interface IGame {
    id: string;
    minutes: number;
    increment: number;
    rated: boolean;
    result?: GameResult;
}

interface IGamePartial {
    minutes: number;
    increment: number;
    rated: boolean;
}

enum GameStatus {
    Aborted = 'aborted',
    OutOfTime = 'outoftime',
    Resign = 'resign',
    Mate = 'mate',
    Started = 'started',
}

enum MessageType {
    GameFull = 'gameFull',
    GameState = 'gameState',
}

enum GameResult {
    WhiteWon = '1-0',
    BlackWon = '0-1',
    Draw = '1/2-1/2',
}