import './OffSyncBoard.css'
import {Chessboard} from "../Chessboard/Chessboard.tsx";
import {convertFENToPieces, getMissingPieces} from "../../dgt/util.ts";
import { HighlightColor, IHighlight, IPiece, PieceConvert } from "../../dgt/types.ts";

export function OffSyncBoard ({ finalFEN, currentFEN, showText = true, title }: { finalFEN: string, currentFEN: string, showText?: boolean, title?:string }) {
    const { add, remove } = getMissingPieces(currentFEN, finalFEN);
    const removeHighlights: IHighlight[] = remove.map(item => ({
        row: item.row,
        column: item.column,
        color: HighlightColor.Red,
    }));
    const addHighlights: IHighlight[] = add.map(item => ({
        row: item.row,
        column: item.column,
        color: HighlightColor.Green,
    }));

    const map = new Map<string, IHighlight>();

    addHighlights.forEach(item =>
        map.set(`${item.column}${item.row}`, item)
    )
    removeHighlights.forEach(item =>
      map.set(`${item.column}${item.row}`, item)
    )

    const convertPiecesToCoordinates = (pieces: IPiece[], prefix: string) => {
        const sorter = (a: IPiece, b: IPiece): number => {
            return a.color > b.color ? -1 : 1;
        }

        return pieces.sort(sorter).map(item => {
            // @ts-ignore
            const letter = PieceConvert[item.piece];

            return (<span>{`${prefix}${letter}${item.column}${item.row}`}</span>)
        });
    }

    return (
      <div className="off-sync">
          <div className="off-sync-board">
              <Chessboard pieces={convertFENToPieces(finalFEN)} highlights={[...map.values()]} title={title} />
          </div>
          {showText && (
            <div className="off-sync-pieces">
              {convertPiecesToCoordinates(remove, '-')}
              {convertPiecesToCoordinates(add, '+')}
            </div>
          )}
      </div>
    )
}