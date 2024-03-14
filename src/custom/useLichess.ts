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
    const [gameResult, setGameResult] = useState<string>('');
    const [blackProfile, setBlackProfile] = useState<IProfile|undefined>();
    const [whiteProfile, setWhiteProfile] = useState<IProfile|undefined>();
    const [game, setGame] = useState<IGamePartial|undefined>();

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

    useEffect(() => {
        if (gameResult) {
            setTimeout(() => {
                // @ts-ignore
                window.dgt?.clock?.setText?.(gameResult)

                setTimeout(() => {
                    // @ts-ignore
                    window.dgt?.clock?.clearText?.()
                }, 10000)
            }, 100)
        }
    }, [gameResult]);

    useEffect(() => {
        const setTime = (wTime: any, bTime: any, run: any) => {
            const wSeconds = Math.floor(wTime / 1000);
            const wMinutes = Math.floor(wSeconds / 60);
            const wLeftSeconds = wSeconds - (wMinutes * 60);

            const bSeconds = Math.floor(bTime / 1000);
            const bMinutes = Math.floor(bSeconds / 60);
            const bLeftSeconds = bSeconds - (bMinutes * 60);

            // @ts-ignore
            window.dgt?.clock?.setTime?.(wMinutes, wLeftSeconds, bMinutes, bLeftSeconds, run)
        }

        if (seekLoading) {
            return;
        }

        if (!isPlaying) {
            setTime(whiteTime, blackTime, 0);
        } else {
            const turn = myTurn ? (myColor === Color.White ? 1 : 2) : (myColor === Color.White ? 2 : 1);

            setTime(whiteTime, blackTime, turn);
        }
    }, [whiteTime, blackTime, myColor, myTurn, isPlaying, seekLoading]);

    async function getAccount(password: string) {
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

        const resText= await result.text();

        return JSON.parse(resText);
    }

    async function connect(password: string): Promise<ILichessProfile|undefined> {
        setSeekLoading(false);

        const prof = await getAccount(password);
        const connected = Boolean(prof);

        if (!connected) {
            setProfile(undefined);
            setIsConnected(false)
            return;
        }

        const id = prof?.playing?.split('/')?.[3] ?? ''

        const profile: ILichessProfile = {
            userName: prof?.username ?? '',
            firstName: prof?.profile?.firstName ?? '',
            lastName: prof?.profile?.lastName ?? '',
            rapidRating: prof?.perfs?.rapid?.rating ?? 0,
            blitzRating: prof?.perfs?.blitz?.rating ?? 0,
            bulletRating: prof?.perfs?.bullet?.rating ?? 0,
            currentGame: id,
        }

        setGameId(id)
        setProfile(profile);
        setIsConnected(true)

        if (id) {
            await handleGameStream(id, password);
        }

        return profile;
    }

    async function disconnect() {
        setSeekLoading(false);
        setFEN('');
        setPieces([]);
        setMoves([]);
        setProfile(undefined);
        setIsConnected(false);
        setIsPlaying(false);
        setGameId('');
        setMyTurn(false);
        setMyColor(undefined);
        setWhiteTime(0);
        setBlackTime(0);
        setGameResult('');
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
        const profile = await connect(password);

        if (profile && profile.currentGame) {
            return profile.currentGame;
        }

        setSeekLoading(true);

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
        };

        if (profile?.rapidRating) {
            Object.assign(game, { ratingRange:  `${profile.rapidRating + negRange}-${profile.rapidRating + posRange}` });
        }

        if (color) {
            Object.assign(game, { color });
        }

        const body = Object.keys(game).reduce((result, key) => {
            // @ts-ignore
            return result.length ? `${result}&${key}=${game[key]}` : `${key}=${game[key]}`;
        },'');

        const stream = await fetch('https://lichess.org/api/board/seek', {
            headers: {
                "Authorization": `Bearer ${password}`,
                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
            },
            method: "POST",
            body: body
        });

        await readStream(() => {})(stream);

        return (await connect(password))?.currentGame;
    }

    function updateMoves(mvs: any, myColor: any) {
        const movesLength = mvs?.length ?? 0;

        setPieces([]);
        setMoves([]);
        setFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR');

        let fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
        const moves = movesLength > 0 ? mvs?.split(' ') : [];

        moves.forEach((move: any) => {
            const newFEN = makeMove(move, fen);
            const mv = countMove(fen, newFEN);

            if (mv) {
                setMoves(mvs => [...mvs, mv]);
            }

            fen = newFEN;
        })

        const colorTurn = (moves.length % 2) === 1 ? 'black' : 'white';
        const myT = colorTurn === myColor;

        setMyTurn(myT)
        setPieces(convertFENToPieces(fen));
        setFEN(fen);
    }

    async function seek(parameters: ISeekParameters, password: string) {
        if (!password) {
            return;
        }

        disconnect();

        // @ts-ignore
        window.dgt?.clock?.setText?.(`${parameters.minutes} + ${parameters.increment}`);
        // SEEK 10+, SE 10+20, 10+20

        const id = await seekGameId(parameters, password);

        if (!id) {
            console.log('No game ID found :(');
            // @ts-ignore
            window.dgt?.clock?.clearText?.();

            return;
        }

        await handleGameStream(id, password);
    }

    async function handleGameStream(gameStreamId: string, password: string) {
        let myClr: Color|undefined;

        const onGameFullMessage = (obj: any) => {
            // @ts-ignore
            window.dgt?.sendCustom?.(0x2b, 0x04, 0x03, 0x0b, 0x01, 0x00);
            setPieces(convertFENToPieces('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR'));
            setFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR');
            setIsPlaying(true);
            setIsConnected(true);
            setMoves([]);

            setBlackProfile({
                name: obj.black?.name ?? '',
                rating: obj.black?.rating ?? 0,
                provisional: obj.black?.provisional ?? false,
                title: obj.black?.title ?? '',
            })

            setWhiteProfile({
                name: obj.white?.name ?? '',
                rating: obj.white?.rating ?? 0,
                provisional: obj.white?.provisional ?? false,
                title: obj.white?.title ?? '',
            })

            if (profile && obj && obj.white && obj.white.name && obj.white.name === profile.userName) {
                setMyColor(Color.White);
                myClr = Color.White;
                setMyTurn(true)
            } else if (profile && obj && obj.black && obj.black.name && obj.black.name === profile.userName) {
                setMyColor(Color.Black);
                myClr = Color.Black;
                setMyTurn(false)
            }

            setWhiteTime(obj.clock?.initial ?? 0);
            setBlackTime(obj.clock?.initial ?? 0);

            setGame({
                minutes: Math.floor((obj.clock?.initial ?? 0) / 60 / 1000),
                increment: (obj.clock?.increment ?? 0) / 1000,
                rated: obj.rated ?? false,
            })

            updateMoves(obj.state?.moves, myClr);
        }

        const onGameStateMessage = (obj: any) => {
            if (obj.status === 'aborted') {
                setIsPlaying(false);
                // @ts-ignore
                window.dgt?.sendCustom?.(0x2b, 0x04, 0x03, 0x0b, 0x10, 0x00);
                return;
            }

            if (obj.status === 'outoftime' || obj.status === 'resign' || obj.status === 'mate') {
                setIsPlaying(false);

                if (obj.winner === 'white') {
                    setGameResult('1-0');
                } else if (obj.winner === 'black') {
                    setGameResult('0-1');
                } else if (obj.winner) {
                    setGameResult('1/2-1/2');
                }
                // @ts-ignore
                window.dgt?.sendCustom?.(0x2b, 0x04, 0x03, 0x0b, 0x10, 0x00);
            }

            updateMoves(obj.moves, myClr);

            if (obj.wtime) {
                setWhiteTime(obj.wtime)
            }

            if (obj.btime) {
                setBlackTime(obj.btime)
            }
        }

        const onMessage = (obj: any) => {
            console.log(obj);

            if (obj.type === 'gameFull') {
                onGameFullMessage(obj);
            }

            if (obj.type === 'gameState') {
                onGameStateMessage(obj);
            }
        }

        const stream = await fetch(`https://lichess.org/api/board/game/stream/${gameStreamId}`, {
            headers: {
                "Authorization": `Bearer ${password}`,
                "Accept":"application/x-ndjson",
            },
            method: "GET",
        });

        await readStream(onMessage)(stream);
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

        const onMessage = (obj: any) => console.log(obj);

        const result = await readStream(onMessage)(stream);

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

const readStream = (processLine: any) => (response: any) => {
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
    result: string;
}

interface IGamePartial {
    minutes: number;
    increment: number;
    rated: boolean;
}