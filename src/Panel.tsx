import { useEffect, useState } from "react";
import { useDGTBoard } from "./custom/useDGTBoard.ts";
import { useLichess } from "./custom/useLichess.ts";
import { Chessboard } from "./components/Chessboard/Chessboard.tsx";
import { OffSyncBoard } from "./components/OffBoardSync/OffSyncBoard.tsx";
import { Moves } from "./components/Moves/Moves.tsx";
import './Panel.css';
import { DGTBoardInfo } from "./components/DGTBoardInfo/DGTBoardInfo.tsx";
import { LichessProfile } from "./components/LichessProfile/LichessProfile.tsx";
import { Clock } from "./components/Clock/Clock.tsx";
import { countMove, getLongAlgebraicNotation } from "./dgt/util.ts";
import { Color, Piece } from "./dgt/types.ts";
import classNames from "classnames";
import { Player } from "./components/Player/Player.tsx";


export function Panel() {
    const [password, setPassword] = useState<string>('');
    const [minutes, setMinutes] = useState<number>(10);
    const [increment, setIncrement] = useState<number>(0);
    const [color, setColor] = useState<Color|undefined>(undefined);
    const [rated, setRated] = useState<boolean>(false);
    const [negRange, setNegRange] = useState<number>(-500);
    const [posRange, setPosRange] = useState<number>(500);
    const [lastMoveMessage, setLastMoveMessage] = useState<string>('');

    const {
        api: dgtAPI,
        pieces: dgtPieces,
        fen: dgtFEN,
        isConnected: dgtConnected,
        info: dgtInfo,
    } = useDGTBoard();

    const {
        api: lichessAPI,
        moves: lichessMoves,
        fen: lichessFEN,
        profile: lichessProfile,
        isConnected: lichessConnected,
        isPlaying,
        myTurn,
        myColor,
        seekLoading,
        blackPlayer,
        whitePlayer,
        game,
    } = useLichess();

    useEffect(() => {
        dgtAPI.connect();
    }, []);

    useEffect(() => {
        // my turn
        if (lichessFEN !== dgtFEN) {
            // boards off sync
            const last = lichessMoves[lichessMoves.length - 1];

            if (last && last.color !== myColor) {
                const notation = getLongAlgebraicNotation(last);
                const text = `${notation.toUpperCase()}`

                // show only once
                if (lastMoveMessage !== text) {
                    // @ts-ignore
                    window.dgt?.clock?.setText?.(text);
                    setLastMoveMessage(text);
                }
            }
        } else {
            // @ts-ignore
            window.dgt?.clock?.clearText?.();
        }
    }, [myTurn, lichessMoves, lichessFEN, dgtFEN, lastMoveMessage, myColor]);

    useEffect(() => {
        if (!isPlaying || !lichessConnected || !dgtConnected || !myTurn) {
            return;
        }

        const newMove = countMove(lichessFEN, dgtFEN);

        // move not valid or moving a wrong colored piece
        if (!newMove || newMove.color !== myColor) {
            return;
        }

        const {
            startColumn,
            startRow,
            endColumn,
            endRow,
            promotionPiece,
        } = newMove;

        const format = {
            [Piece.Queen]: 'q',
            [Piece.Rook]: 'r',
            [Piece.Bishop]: 'b',
            [Piece.Knight]: 'n',
        };

        // @ts-ignore
        const promotionLetter = promotionPiece ? format[promotionPiece] : ''
        const mv = `${startColumn}${startRow}${endColumn}${endRow}${promotionLetter}`;

        lichessAPI.move(mv, password, newMove);
    }, [dgtFEN, lichessFEN, isPlaying, myTurn, myColor]);

    const eventHandler = (setState: any, defaultValue: any, parser: any) => (event: any) => {
        let value = event?.target?.value ?? defaultValue
        value = parser ? parser(value) : value;

        setState(value);
    }

    const updateIncrement  = eventHandler(setIncrement, '0', parseInt);
    const updateMinutes = eventHandler(setMinutes, '0', parseInt);
    const updatePassword = eventHandler(setPassword, '', undefined);
    const updateColor = eventHandler(setColor, undefined, (value: any) => !value ? undefined : value);
    const updateRated = eventHandler(setRated, undefined, (value: any) => value === 'rated');
    const updateNegRange = eventHandler(setNegRange, '0', parseInt);
    const updatePosRange = eventHandler(setPosRange, '0', parseInt);

    const reset = () => {
        lichessAPI.disconnect();
        dgtAPI.reset();

        setMinutes(10);
        setIncrement(0);
        setColor(undefined);
        setRated(false);
        setNegRange(-500);
        setPosRange(500);
        setLastMoveMessage('');
    }

    const seek = async () => {
        await lichessAPI.seek({
            minutes,
            increment,
            color,
            rated,
            negRange,
            posRange,
        }, password);
    }

    const playBlackClock = (myTurn && myColor === 'black') || (!myTurn && myColor === 'white');
    const playWhiteClock = (myTurn && myColor === 'white') || (!myTurn && myColor === 'black');

    return (
      <div className="panel">
          <div className="panel-left">
              <div>
                  <div>
                      <Clock time={blackPlayer.time} increment={game.increment} play={isPlaying && playBlackClock}/>
                      <Player name={blackPlayer.name} rating={blackPlayer.rating} provisional={blackPlayer.provisional}
                              title={blackPlayer.title}/>
                  </div>
                  <div className="panel-left-game">
                      <div>{game.minutes}+{game.increment}</div>
                      <div>{game.rated ? 'Rated' : 'Casual'}</div>
                  </div>
                  <div>
                      <Player name={whitePlayer.name} rating={whitePlayer.rating} provisional={whitePlayer.provisional}
                              title={whitePlayer.title}/>
                      <Clock time={whitePlayer.time} increment={game.increment} play={isPlaying && playWhiteClock}/>
                  </div>
              </div>
          </div>
          <div className="panel-center">
              <div className="panel-center-top">
                  <Moves moves={lichessMoves} title="Lichess" showStartPieces={isPlaying} gameResult={game.result}/>
              </div>
              <div className="panel-center-bottom">
                  <Chessboard pieces={dgtPieces} title="DGT"/>
                  <OffSyncBoard title="Sync" currentFEN={isPlaying ? dgtFEN : ''} finalFEN={isPlaying ? lichessFEN : ''}
                                showText={false}/>
              </div>
          </div>
          <div className="panel-right">
              <div className="panel-right-controls">
                  <button onClick={() => dgtConnected ? dgtAPI.reset() : dgtAPI.connect()}>
                      {dgtConnected ? 'Disconnect DGT' : 'Connect DGT'}
                  </button>
                  <div className="lichess-password">
                      <input type="password" onChange={updatePassword} placeholder='Lichess API key'/>
                  </div>
                  <button onClick={() => lichessConnected ? lichessAPI.disconnect() : lichessAPI.connect(password)}>
                      {lichessConnected ? 'Disconnect Lichess' : 'Connect Lichess'}
                  </button>
                  <div className="rated-choice">
                      <div>
                          <label htmlFor="rated">
                              Rated: <input id="rated" type="radio" name="rated-choice" value="rated"
                                            onChange={updateRated} checked={rated}/>
                          </label>
                          <label htmlFor="casual">
                              Casual: <input id="casual" type="radio" name="rated-choice" value="casual"
                                             onChange={updateRated} checked={!rated}/>
                          </label>
                      </div>
                  </div>
                  <div className="time-choice">
                      <div>
                          Minutes per side: <span>{minutes}</span>
                      </div>
                      <div>
                          <input className="range" type="range" min="8" max="38" defaultValue="10"
                                 onChange={updateMinutes}/>
                      </div>
                  </div>
                  <div className="increment-choice">
                      <div>
                          Increment in seconds: <span>{increment}</span>
                      </div>
                      <div>
                          <input className="range" type="range" min="0" max="30" defaultValue="0"
                                 onChange={updateIncrement}/>
                      </div>
                  </div>
                  <div className="color-choice">
                      <div>
                          Player color:
                      </div>
                      <div>
                          <label htmlFor="player-white">
                              White: <input id="player-white" type="radio" name="player-color" value="white"
                                            onChange={updateColor} checked={color === 'white'}/>
                          </label>
                          <label htmlFor="player-black">
                              Black: <input id="player-black" type="radio" name="player-color" value="black"
                                            onChange={updateColor} checked={color === 'black'}/>
                          </label>
                          <label htmlFor="player-random">
                              Random: <input id="player-random" type="radio" name="player-color" value=""
                                             onChange={updateColor} checked={!color}/>
                          </label>
                      </div>
                  </div>
                  <div className="rating-range-choice">
                      <div>
                          Rating range:
                      </div>
                      <div>
                          {negRange} / {posRange}
                      </div>
                      <div>
                          <input className="range" type="range" min="-500" max="0" step="50" defaultValue="-500"
                                 onChange={updateNegRange}/>
                          <input className="range" type="range" min="0" max="500" step="50" defaultValue="500"
                                 onChange={updatePosRange}/>
                      </div>
                  </div>
                  <button onClick={seek} disabled={!lichessConnected || seekLoading || isPlaying}
                          className={classNames({'loading': seekLoading})}>
                      Seek game
                  </button>
              </div>
              <LichessProfile profile={lichessProfile}/>
              <DGTBoardInfo info={dgtInfo}/>
              <button onClick={reset}>
                  Reset
              </button>
          </div>
      </div>
    )
}