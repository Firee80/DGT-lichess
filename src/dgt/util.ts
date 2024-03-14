import {Color, Column, ICoordinates, IMove, IPiece, Piece, Row} from "./types.ts";

export function convertFENToPieces(fen: string): IPiece[] {
    if (!fen) {
        return []
    }

    const rows = fen.split('/').reverse();

    if (rows.length !== 8) {
        return [];
    }

    const result: IPiece[] = []

    rows.forEach((row, index) => {
        let counter = 0
        const columns = row.split('');

        if (columns.length >= 8) {
            columns.length = 8;
        }

        columns.forEach((value, columnIndex) => {
            switch (value) {
                case 'p':
                    result.push({
                        piece: Piece.Pawn,
                        color: Color.Black,
                        row: (index + 1) as Row,
                        column: Column[counter + columnIndex] as unknown as Column,
                    });
                    break;
                case 'r':
                    result.push({
                        piece: Piece.Rook,
                        color: Color.Black,
                        row: (index + 1) as Row,
                        column: Column[counter + columnIndex] as unknown as Column,
                    });
                    break;
                case 'n':
                    result.push({
                        piece: Piece.Knight,
                        color: Color.Black,
                        row: (index + 1) as Row,
                        column: Column[counter + columnIndex] as unknown as Column,
                    });
                    break;
                case 'b':
                    result.push({
                        piece: Piece.Bishop,
                        color: Color.Black,
                        row: (index + 1) as Row,
                        column: Column[counter + columnIndex] as unknown as Column,
                    });
                    break;
                case 'q':
                    result.push({
                        piece: Piece.Queen,
                        color: Color.Black,
                        row: (index + 1) as Row,
                        column: Column[counter + columnIndex] as unknown as Column,
                    });
                    break;
                case 'k':
                    result.push({
                        piece: Piece.King,
                        color: Color.Black,
                        row: (index + 1) as Row,
                        column: Column[counter + columnIndex] as unknown as Column,
                    });
                    break;
                case 'P':
                    result.push({
                        piece: Piece.Pawn,
                        color: Color.White,
                        row: (index + 1) as Row,
                        column: Column[counter + columnIndex] as unknown as Column,
                    });
                    break;
                case 'R':
                    result.push({
                        piece: Piece.Rook,
                        color: Color.White,
                        row: (index + 1) as Row,
                        column: Column[counter + columnIndex] as unknown as Column,
                    });
                    break;
                case 'N':
                    result.push({
                        piece: Piece.Knight,
                        color: Color.White,
                        row: (index + 1) as Row,
                        column: Column[counter + columnIndex] as unknown as Column,
                    });
                    break;
                case 'B':
                    result.push({
                        piece: Piece.Bishop,
                        color: Color.White,
                        row: (index + 1) as Row,
                        column: Column[counter + columnIndex] as unknown as Column,
                    });
                    break;
                case 'Q':
                    result.push({
                        piece: Piece.Queen,
                        color: Color.White,
                        row: (index + 1) as Row,
                        column: Column[counter + columnIndex] as unknown as Column,
                    });
                    break;
                case 'K':
                    result.push({
                        piece: Piece.King,
                        color: Color.White,
                        row: (index + 1) as Row,
                        column: Column[counter + columnIndex] as unknown as Column,
                    });
                    break;
                default:
                    counter += (Number(value) - 1);
                    break;
            }
        })
    })

    return result;
}

export function countMove(startFEN: string, endFEN: string): IMove | undefined {
    const { add, remove } = getMissingPieces(startFEN, endFEN);

    if (
      add.length === 1 &&
      remove.length === 1 &&
      add[0].piece === remove[0].piece &&
      add[0].color === remove[0].color
    ) {
        // same piece moves
        return {
            color: remove[0].color,
            startColumn: remove[0].column,
            startRow: remove[0].row,
            endColumn: add[0].column,
            endRow: add[0].row,
            piece: remove[0].piece,
            startFEN,
            endFEN,
        }
    } else if (
      remove.length === 1 &&
      add.length === 1 &&
      add[0].color === remove[0].color &&
      remove[0].piece === Piece.Pawn &&
      add[0].piece !== Piece.Pawn
    ) {
        // simple promotion
        return {
            color: remove[0].color,
            startColumn: remove[0].column,
            startRow: remove[0].row,
            endColumn: add[0].column,
            endRow: add[0].row,
            piece: remove[0].piece,
            promotionPiece: add[0].piece,
            startFEN,
            endFEN,
        }
    } else if (remove.length === 2 && add.length === 1) {
        // a piece gets captured
        const endPiece = add[0];
        const startPiece = remove.find(item => item.color === endPiece.color);
        let capturedPiece = remove.find(item => item.color !== endPiece.color && item.row === endPiece.row && item.column === endPiece.column);
        let enPassant = false;

        if (startPiece && !capturedPiece) {
            // different position
            const capturedPawn = remove.find(item => item.color !== endPiece.color && item.piece === Piece.Pawn)

            if (
              startPiece.piece === Piece.Pawn &&
              capturedPawn &&
              (capturedPawn.row === 4 || capturedPawn.row === 5) &&
              (endPiece.row === 3 || endPiece.row === 6)
            ) {
                capturedPiece = capturedPawn;
                enPassant = true;
            }
        }

        if (startPiece && capturedPiece) {
            return {
                capture: true,
                color: endPiece.color,
                startColumn: startPiece.column,
                startRow: startPiece.row,
                endColumn: endPiece.column,
                endRow: endPiece.row,
                piece: endPiece.piece,
                startFEN,
                endFEN,
                enPassant,
                promotionPiece: startPiece.piece === Piece.Pawn && endPiece.piece !== Piece.Pawn ? endPiece.piece : undefined,
            }
        }
    } else if (remove.length === 2 && add.length === 2) {
        const startRook = remove.find(item => item.piece === Piece.Rook);
        const endRook = add.find(item => item.piece === Piece.Rook);
        const startKing = remove.find(item => item.piece === Piece.King);
        const endKing = add.find(item => item.piece === Piece.King);

        // castling
        if (startRook && endRook && startKing && endKing) {
            // @ts-ignore
            const difference = Column[startRook.column] - Column[endRook.column];
            const diff2 = difference < 0 ? difference * -1 : difference;

            return {
                color: startKing.color,
                startColumn: startKing.column,
                startRow: startKing.row,
                endColumn: endKing.column,
                endRow: endKing.row,
                piece: startKing.piece,
                startFEN,
                endFEN,
                queenSideCastling: diff2 > 2,
                kingSideCastling: !(diff2 > 2),
            }
        }
    }

    return undefined;
}

export function getMissingPieces(initialFEN: string, finalFEN: string) {
    const startPieces = convertFENToPieces(initialFEN);
    const endPieces = convertFENToPieces(finalFEN);

    const startFiltered: IPiece[] = [];
    const endFiltered: IPiece[] = []

    startPieces.forEach(startItem => {
        if (!endPieces.some(endItem =>
          startItem.row === endItem.row &&
          startItem.column === endItem.column &&
          startItem.piece === endItem.piece &&
          startItem.color === endItem.color
        )) {
            startFiltered.push(startItem);
        }
    })

    endPieces.forEach(endItem => {
        if (!startPieces.some(startItem =>
          startItem.row === endItem.row &&
          startItem.column === endItem.column &&
          startItem.piece === endItem.piece &&
          startItem.color === endItem.color
        )) {
            endFiltered.push(endItem);
        }
    })

    return {
        add: endFiltered,
        remove: startFiltered,
    }
}

export function getLongAlgebraicNotation(move: IMove) {
    const {
        piece,
        endRow,
        endColumn,
        startRow,
        startColumn,
        capture,
        check,
        kingSideCastling,
        queenSideCastling,
        enPassant,
        mate,
        promotionPiece,
    } = move;

    if (kingSideCastling) {
        return '0-0';
    }
    if (queenSideCastling) {
        return '0-0-0';
    }

    const pieceLetter = {
        [Piece.Rook]: 'R',
        [Piece.Knight]: 'N',
        [Piece.Bishop]: 'B',
        [Piece.King]: 'K',
        [Piece.Queen]: 'Q',
        [Piece.Pawn]: '',
    }

    const firstPart = `${pieceLetter[piece]}${startColumn}${startRow}${capture ? 'x' : '-'}${endColumn}${endRow}`;

    const lastPart = `${mate ? '#' : ''}${check ? '+' : ''}${enPassant ? 'e.p.' : ''}${promotionPiece ? pieceLetter[promotionPiece] : ''}`;

    return `${firstPart}${lastPart}`;
}

export function getMoveSquares(piece: Piece, coordinates: ICoordinates): ICoordinates[] {
    const { row, column} = coordinates;
    const columnNumber = parseInt(Column[column]);
    let result: ICoordinates[] = [];

    switch (piece) {
        case Piece.King:
            result = [
                { column, row: (row + 1) as Row }, // up
                { column: Column[columnNumber + 1] as unknown as Column, row: (row + 1) as Row }, // up-right
                { column: Column[columnNumber + 1] as unknown as Column, row }, // right
                { column: Column[columnNumber + 1] as unknown as Column, row: (row - 1) as Row }, // down-right
                { column, row: (row - 1) as Row }, // down
                { column: Column[columnNumber - 1] as unknown as Column, row: (row - 1) as Row }, // down-left
                { column: Column[columnNumber - 1] as unknown as Column, row }, // left
                { column: Column[columnNumber - 1] as unknown as Column, row: (row + 1) as Row }, // up-left
                { column: Column[columnNumber - 2] as unknown as Column, row }, // castle left
                { column: Column[columnNumber + 2] as unknown as Column, row }, // castle right
            ];
            break;
        case Piece.Rook:
            result = [
                { column, row: (row + 1) as Row }, // up 1
                { column, row: (row + 2) as Row }, // up 2
                { column, row: (row + 3) as Row }, // up 3
                { column, row: (row + 4) as Row }, // up 4
                { column, row: (row + 5) as Row }, // up 5
                { column, row: (row + 6) as Row }, // up 6
                { column, row: (row + 7) as Row }, // up 7
                { column, row: (row - 1) as Row }, // down 1
                { column, row: (row - 2) as Row }, // down 2
                { column, row: (row - 3) as Row }, // down 3
                { column, row: (row - 4) as Row }, // down 4
                { column, row: (row - 5) as Row }, // down 5
                { column, row: (row - 6) as Row }, // down 6
                { column, row: (row - 7) as Row }, // down 7
                { column: Column[columnNumber + 1] as unknown as Column, row }, // right 1
                { column: Column[columnNumber + 2] as unknown as Column, row }, // right 2
                { column: Column[columnNumber + 3] as unknown as Column, row }, // right 3
                { column: Column[columnNumber + 4] as unknown as Column, row }, // right 4
                { column: Column[columnNumber + 5] as unknown as Column, row }, // right 5
                { column: Column[columnNumber + 6] as unknown as Column, row }, // right 6
                { column: Column[columnNumber + 7] as unknown as Column, row }, // right 7
                { column: Column[columnNumber - 1] as unknown as Column, row }, // left 1
                { column: Column[columnNumber - 2] as unknown as Column, row }, // left 2
                { column: Column[columnNumber - 3] as unknown as Column, row }, // left 3
                { column: Column[columnNumber - 4] as unknown as Column, row }, // left 4
                { column: Column[columnNumber - 5] as unknown as Column, row }, // left 5
                { column: Column[columnNumber - 6] as unknown as Column, row }, // left 6
                { column: Column[columnNumber - 7] as unknown as Column, row }, // left 7
            ];
            break;
        case Piece.Knight:
            result = [
                { column: Column[columnNumber - 1] as unknown as Column, row: (row + 2) as Row }, // up-left
                { column: Column[columnNumber + 1] as unknown as Column, row: (row + 2) as Row }, // up-right
                { column: Column[columnNumber + 2] as unknown as Column, row: (row + 1) as Row }, // left-up
                { column: Column[columnNumber + 2] as unknown as Column, row: (row - 1) as Row }, // left-down
                { column: Column[columnNumber - 1] as unknown as Column, row: (row - 2) as Row }, // down-left
                { column: Column[columnNumber + 1] as unknown as Column, row: (row - 2) as Row }, // down-right
                { column: Column[columnNumber - 2] as unknown as Column, row: (row + 1) as Row }, // left-up
                { column: Column[columnNumber - 2] as unknown as Column, row: (row - 1) as Row }, // left-down
            ];
            break;
        case Piece.Bishop:
            result = [
                { column: Column[columnNumber + 1] as unknown as Column, row: (row + 1) as Row }, // up-right
                { column: Column[columnNumber + 2] as unknown as Column, row: (row + 2) as Row }, // up-right
                { column: Column[columnNumber + 3] as unknown as Column, row: (row + 3) as Row }, // up-right
                { column: Column[columnNumber + 4] as unknown as Column, row: (row + 4) as Row }, // up-right
                { column: Column[columnNumber + 5] as unknown as Column, row: (row + 5) as Row }, // up-right
                { column: Column[columnNumber + 6] as unknown as Column, row: (row + 6) as Row }, // up-right
                { column: Column[columnNumber + 7] as unknown as Column, row: (row + 7) as Row }, // up-right
                { column: Column[columnNumber + 1] as unknown as Column, row: (row - 1) as Row }, // down-right
                { column: Column[columnNumber + 2] as unknown as Column, row: (row - 2) as Row }, // down-right
                { column: Column[columnNumber + 3] as unknown as Column, row: (row - 3) as Row }, // down-right
                { column: Column[columnNumber + 4] as unknown as Column, row: (row - 4) as Row }, // down-right
                { column: Column[columnNumber + 5] as unknown as Column, row: (row - 5) as Row }, // down-right
                { column: Column[columnNumber + 6] as unknown as Column, row: (row - 6) as Row }, // down-right
                { column: Column[columnNumber + 7] as unknown as Column, row: (row - 7) as Row }, // down-right
                { column: Column[columnNumber - 1] as unknown as Column, row: (row - 1) as Row }, // down-left
                { column: Column[columnNumber - 2] as unknown as Column, row: (row - 2) as Row }, // down-left
                { column: Column[columnNumber - 3] as unknown as Column, row: (row - 3) as Row }, // down-left
                { column: Column[columnNumber - 4] as unknown as Column, row: (row - 4) as Row }, // down-left
                { column: Column[columnNumber - 5] as unknown as Column, row: (row - 5) as Row }, // down-left
                { column: Column[columnNumber - 6] as unknown as Column, row: (row - 6) as Row }, // down-left
                { column: Column[columnNumber - 7] as unknown as Column, row: (row - 7) as Row }, // down-left
                { column: Column[columnNumber - 1] as unknown as Column, row: (row + 1) as Row }, // up-left
                { column: Column[columnNumber - 2] as unknown as Column, row: (row + 2) as Row }, // up-left
                { column: Column[columnNumber - 3] as unknown as Column, row: (row + 3) as Row }, // up-left
                { column: Column[columnNumber - 4] as unknown as Column, row: (row + 4) as Row }, // up-left
                { column: Column[columnNumber - 5] as unknown as Column, row: (row + 5) as Row }, // up-left
                { column: Column[columnNumber - 6] as unknown as Column, row: (row + 6) as Row }, // up-left
                { column: Column[columnNumber - 7] as unknown as Column, row: (row + 7) as Row }, // up-left
            ];
            break;
        case Piece.Queen:
            result = [
                { column: Column[columnNumber + 1] as unknown as Column, row: (row + 1) as Row }, // up-right
                { column: Column[columnNumber + 2] as unknown as Column, row: (row + 2) as Row }, // up-right
                { column: Column[columnNumber + 3] as unknown as Column, row: (row + 3) as Row }, // up-right
                { column: Column[columnNumber + 4] as unknown as Column, row: (row + 4) as Row }, // up-right
                { column: Column[columnNumber + 5] as unknown as Column, row: (row + 5) as Row }, // up-right
                { column: Column[columnNumber + 6] as unknown as Column, row: (row + 6) as Row }, // up-right
                { column: Column[columnNumber + 7] as unknown as Column, row: (row + 7) as Row }, // up-right
                { column: Column[columnNumber + 1] as unknown as Column, row: (row - 1) as Row }, // down-right
                { column: Column[columnNumber + 2] as unknown as Column, row: (row - 2) as Row }, // down-right
                { column: Column[columnNumber + 3] as unknown as Column, row: (row - 3) as Row }, // down-right
                { column: Column[columnNumber + 4] as unknown as Column, row: (row - 4) as Row }, // down-right
                { column: Column[columnNumber + 5] as unknown as Column, row: (row - 5) as Row }, // down-right
                { column: Column[columnNumber + 6] as unknown as Column, row: (row - 6) as Row }, // down-right
                { column: Column[columnNumber + 7] as unknown as Column, row: (row - 7) as Row }, // down-right
                { column: Column[columnNumber - 1] as unknown as Column, row: (row - 1) as Row }, // down-left
                { column: Column[columnNumber - 2] as unknown as Column, row: (row - 2) as Row }, // down-left
                { column: Column[columnNumber - 3] as unknown as Column, row: (row - 3) as Row }, // down-left
                { column: Column[columnNumber - 4] as unknown as Column, row: (row - 4) as Row }, // down-left
                { column: Column[columnNumber - 5] as unknown as Column, row: (row - 5) as Row }, // down-left
                { column: Column[columnNumber - 6] as unknown as Column, row: (row - 6) as Row }, // down-left
                { column: Column[columnNumber - 7] as unknown as Column, row: (row - 7) as Row }, // down-left
                { column: Column[columnNumber - 1] as unknown as Column, row: (row + 1) as Row }, // up-left
                { column: Column[columnNumber - 2] as unknown as Column, row: (row + 2) as Row }, // up-left
                { column: Column[columnNumber - 3] as unknown as Column, row: (row + 3) as Row }, // up-left
                { column: Column[columnNumber - 4] as unknown as Column, row: (row + 4) as Row }, // up-left
                { column: Column[columnNumber - 5] as unknown as Column, row: (row + 5) as Row }, // up-left
                { column: Column[columnNumber - 6] as unknown as Column, row: (row + 6) as Row }, // up-left
                { column: Column[columnNumber - 7] as unknown as Column, row: (row + 7) as Row }, // up-left
                { column, row: (row + 1) as Row }, // up 1
                { column, row: (row + 2) as Row }, // up 2
                { column, row: (row + 3) as Row }, // up 3
                { column, row: (row + 4) as Row }, // up 4
                { column, row: (row + 5) as Row }, // up 5
                { column, row: (row + 6) as Row }, // up 6
                { column, row: (row + 7) as Row }, // up 7
                { column, row: (row - 1) as Row }, // down 1
                { column, row: (row - 2) as Row }, // down 2
                { column, row: (row - 3) as Row }, // down 3
                { column, row: (row - 4) as Row }, // down 4
                { column, row: (row - 5) as Row }, // down 5
                { column, row: (row - 6) as Row }, // down 6
                { column, row: (row - 7) as Row }, // down 7
                { column: Column[columnNumber + 1] as unknown as Column, row }, // right 1
                { column: Column[columnNumber + 2] as unknown as Column, row }, // right 2
                { column: Column[columnNumber + 3] as unknown as Column, row }, // right 3
                { column: Column[columnNumber + 4] as unknown as Column, row }, // right 4
                { column: Column[columnNumber + 5] as unknown as Column, row }, // right 5
                { column: Column[columnNumber + 6] as unknown as Column, row }, // right 6
                { column: Column[columnNumber + 7] as unknown as Column, row }, // right 7
                { column: Column[columnNumber - 1] as unknown as Column, row }, // left 1
                { column: Column[columnNumber - 2] as unknown as Column, row }, // left 2
                { column: Column[columnNumber - 3] as unknown as Column, row }, // left 3
                { column: Column[columnNumber - 4] as unknown as Column, row }, // left 4
                { column: Column[columnNumber - 5] as unknown as Column, row }, // left 5
                { column: Column[columnNumber - 6] as unknown as Column, row }, // left 6
                { column: Column[columnNumber - 7] as unknown as Column, row }, // left 7
            ];
            break;
        case Piece.Pawn:
            result = [
                { column, row: (row + 1) as Row }, // up 1
                { column, row: (row + 2) as Row }, // up 2
                { column: Column[columnNumber + 1] as unknown as Column, row: (row + 1) as Row }, // up-right
                { column: Column[columnNumber + 1] as unknown as Column, row: (row - 1) as Row }, // down-right
                { column, row: (row - 1) as Row }, // down 1
                { column, row: (row - 2) as Row }, // down 2
                { column: Column[columnNumber - 1] as unknown as Column, row: (row - 1) as Row }, // down-left
                { column: Column[columnNumber - 1] as unknown as Column, row: (row + 1) as Row }, // up-left
            ];
            break;
    }

    return result.filter(item => item.column && item.row > 0 && item.row < 9)
}

export function convertPiecesToFEN(pieces: IPiece[]): string {
    const getPieceLetter = (item: IPiece) => {
        switch (item.piece) {
            case Piece.Pawn:
                return item.color === Color.Black ? 'p' : 'P';
            case Piece.Rook:
                return item.color === Color.Black ? 'r' : 'R';
            case Piece.King:
                return item.color === Color.Black ? 'k' : 'K';
            case Piece.Queen:
                return item.color === Color.Black ? 'q' : 'Q';
            case Piece.Bishop:
                return item.color === Color.Black ? 'b' : 'B';
            case Piece.Knight:
                return item.color === Color.Black ? 'n' : 'N';
            default:
                return '';
        }
    }

    const resultRows = [];

    for (let i = 8 ; i > 0 ; i--) {
        const rowPieces = pieces.filter(it => it.row === i);
        const row = new Array(8);
        row.fill(1);

        rowPieces.forEach(item => {
            const index: number = parseInt(Column[item.column]);
            row[index] = getPieceLetter(item);
        })

        const result: any[] = [];
        let counter = 0;

        row.forEach((item, index) => {
            if (item === 1) {
                counter++;
            } else {
                if (counter > 0) {
                    result.push(counter);
                    counter = 0;
                }
                result.push(item)
            }
            if (index === 7 && counter !== 0) {
                result.push(counter);
                counter = 0;
            }
        })

        resultRows.push(result.join(''))
    }

    return resultRows.join('/');
}

export function makeMove(move: string, fen: string) {
    // @ts-ignore
    const pieces = convertFENToPieces(fen);

    // @ts-ignore
    const [from, to, promotion] = move.match(/.{1,2}/g) || [];

    // @ts-ignore
    const [fromColumn, fromRow] = from.split('');

    // @ts-ignore
    const [toColumn, toRow] = to.split('');

    const fromCoordinates: ICoordinates = {
        column: fromColumn as unknown as Column,
        row: parseInt(fromRow) as Row
    }

    // @ts-ignore
    const toCoordinates: ICoordinates = {
        column: toColumn as unknown as Column,
        row: parseInt(toRow) as Row
    }

    // remove piece
    const resultPieces = pieces.filter(item => {
        const { column: toColumn, row: toRow } = toCoordinates;
        const { column: itemColumn, row: itemRow} = item;

        return !(toColumn === itemColumn && toRow === itemRow);
    });

    // find piece
    const piece = resultPieces.find(item =>
        item.row === fromCoordinates.row && item.column === fromCoordinates.column
    )

    if (piece) {
        piece.row = toCoordinates.row;
        piece.column = toCoordinates.column;

        // castle
        if (piece.piece === Piece.King && (piece.row === 8 || piece.row === 1)) {
            // @ts-ignore
            const diff = Column[toCoordinates.column] - Column[fromCoordinates.column];

            if (diff === 2 || diff === -2) {
                const rook = resultPieces.find(item => {
                    const isRook = item.piece === Piece.Rook;
                    const isOnSameRow = item.row === piece.row;
                    const kingOnG = Column[piece.column] as unknown as Column === Column.g;
                    const rookOnH = Column[item.column] as unknown as Column === Column.h;
                    const kindOnC = Column[piece.column] as unknown as Column === Column.c;
                    const rookOnA = Column[item.column] as unknown as Column === Column.a;

                    return isRook && isOnSameRow && ((kingOnG && rookOnH) || (kindOnC && rookOnA));
                });

                if (rook) {
                    // @ts-ignore
                    rook.column = Column[piece.column] as unknown as Column === Column.g ? Column[Column.f] : Column[Column.d];
                }
            }
        }
        // en passant
        if (piece.piece === Piece.Pawn && fromCoordinates.column !== toCoordinates.column && pieces.length === resultPieces.length) {
            const column = piece.column;
            const row = piece.color === Color.White ? piece.row - 1 : piece.row + 1;

            const newResult = resultPieces.filter(item =>
              !(item.column === column && item.row === row)
            )

            if ((resultPieces.length - 1) === newResult.length) {
                return convertPiecesToFEN(newResult);
            }
        }

        // promotion
        if (piece.piece === Piece.Pawn && (piece.row === 8 || piece.row === 1) && promotion) {
            const format = {
                'q': Piece.Queen,
                'r': Piece.Rook,
                'b': Piece.Bishop,
                'n': Piece.Knight,
            };

            // @ts-ignore
            piece.piece = format[promotion as string];
        }

        return convertPiecesToFEN(resultPieces);
    }

    return fen;
}