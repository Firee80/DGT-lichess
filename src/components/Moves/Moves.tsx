import { useEffect, useState } from "react";
import {HighlightColor, IHighlight, IMove} from "../../dgt/types.ts";
import {
    convertFENToPieces,
    getLongAlgebraicNotation,
} from "../../dgt/util.ts";
import { Chessboard } from "../Chessboard/Chessboard.tsx";
import './Moves.css'
import classNames from "classnames";

export function Moves({ moves, title, showStartPieces = false, gameResult }: { moves: IMove[], title?: string, showStartPieces?: boolean, gameResult?: string }) {
    const [index, setIndex] = useState(0)

    const backward = (min = false) => {
        if (min) {
            setIndex(-1);
        } else {
            setIndex(idx => idx > -1 ? idx - 1 : -1);
        }
    }

    const forward = (max = false) => {
        if (max) {
            setIndex(moves.length - 1);
        } else {
            setIndex(idx => idx < moves.length - 1 ? idx + 1 : idx);
        }
    }

    let fen = index === -1 ? moves[0]?.startFEN : moves[index]?.endFEN;

    if (showStartPieces && !fen) {
        fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
    }

    const move = moves[index];
    const highlights: IHighlight[] = move ? [
        {
            row: move.startRow,
            column: move.startColumn,
            color: HighlightColor.Yellow,
        },
        {
            row: move.endRow,
            column: move.endColumn,
            color: HighlightColor.Yellow,
        },
      ] : [];

    useEffect(() => {
        // scroll selected item into view
        document.querySelector('.mvs .selected')?.scrollIntoView({ behavior: "smooth"});
    }, [index]);

    useEffect(() => {
        const lastIndex = moves.length > 0 ? moves.length - 1 : 0;

        if (index === 0 || index > lastIndex || index + 1 === lastIndex) {
            setIndex(lastIndex);
        }
    }, [moves]);

    return (
      <div className="moves-container">
          <div className="moves-chessboard">
              <Chessboard pieces={convertFENToPieces(fen)} highlights={highlights} title={title}/>
          </div>
          <div className="moves">
              <div className="buttons">
                  <button onClick={() => backward(true)}>
                      {'<<'}
                  </button>
                  <button onClick={() => backward()}>
                      Backward
                  </button>
                  <button onClick={() => forward()}>
                      Forward
                  </button>
                  <button onClick={() => forward(true)}>
                      {'>>'}
                  </button>
              </div>
              <div className="mvs">
                  {moves.map((move, idx) => {
                      const moveNumber = Math.round((idx + 1) / 2);
                      const showMoveNumber = idx % 2 === 0;

                      return <div
                        className={classNames({
                            even: idx % 2 === 0,
                            odd: idx % 2 !== 0,
                            selected: idx === index,
                        })}
                        key={idx}
                      >
                          <span>{showMoveNumber && `${moveNumber}: `}</span>
                          <span>{getLongAlgebraicNotation(move)}</span>
                      </div>
                  })}
                  {gameResult && (<div>{gameResult}</div>)}
              </div>
          </div>
      </div>
    );
}