import './Chessboard.css'
import {IHighlight, IPiece} from "../../dgt/types.ts";

export function Chessboard({ pieces, highlights = [], title }: { pieces: IPiece[], highlights?: IHighlight[], title?: string }) {
    const array: string[] = Array(64);
    array.fill('');

    return (
      <div>
          {title && <h3>{title}</h3>}
          <div className="chessboard-container">
              {pieces.map(({ color, row, column, piece}, index) => (
                <div className={`piece ${color}-${piece} ${column}${row}`} key={`piece-${index}`}></div>
              ))}

              {highlights.map(({ color, row, column}, index) => (
                <div className={`highlight highlight-${color} ${column}${row}`} key={`highlight-${index}`}></div>
              ))}

              <div className='chessboard'>
                  {array.map((_, index) => {
                      const row = index % 8;
                      const column = Math.floor(index / 8);
                      const rowPair = Boolean(row % 2);
                      const columnPair = Boolean(column % 2);
                      const color = columnPair ? (rowPair ? 'white' : 'black') : (rowPair ? 'black' : 'white');

                      return <div className={color} key={`square-${index}`}></div>
                  })}
              </div>
          </div>
      </div>
    );
}