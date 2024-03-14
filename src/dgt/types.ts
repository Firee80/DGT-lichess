export interface IHighlight {
    row: Row;
    column: Column;
    color: HighlightColor;
}

export interface IPiece {
    color: Color;
    row: Row;
    column: Column;
    piece: Piece;
}

export enum HighlightColor {
    'Green' = 'green',
    'Red' = 'red',
    'Yellow' = 'yellow',
}


export enum Color {
    'Black' = 'black',
    'White' = 'white',
}

export type Row = 1|2|3|4|5|6|7|8;

export enum Column {
    'a',
    'b',
    'c',
    'd',
    'e',
    'f',
    'g',
    'h',
}

export enum Piece {
    Pawn = 'pawn',
    Rook = 'rook',
    Knight = 'knight',
    Bishop = 'bishop',
    King = 'king',
    Queen = 'queen',
}

export enum PieceConvert {
    'pawn' = '',
    'rook' = 'R',
    'knight' = 'N',
    'bishop' = 'B',
    'king' = 'K',
    'queen' = 'Q',
}

export interface IMove {
    color: Color;
    startRow: Row;
    startColumn: Column;
    endRow: Row;
    endColumn: Column;
    piece: Piece;
    startFEN: string;
    endFEN: string;
    kingSideCastling?: boolean;
    queenSideCastling?: boolean;
    enPassant?: boolean;
    promotionPiece?: Piece;
    capture?: boolean; // server
    check?: boolean; // server
    mate?: boolean; // server
}

// Long algebraic notation (starting and ending squares, with/without hyphen '-')
// UCI no piece names
// en passant (e.g. exd6e.p.)
// capture Kxa1 (pawn capture e.g. fxe6, only column needed 'f')
// king side castling 0-0 / O-O
// queen side castling 0-0-0 / O-O-O
// promotion (e.g. e8Q)
// ---------------------------------------- SERVER ----------------
// check + (e.g. d5+), double check ++
// mate # (e.g. Qe8#) / X / x
// white won 1-0
// black won 0-1
// draw 1/2 - 1/2

// e2-e4 (pawn move)
// Ng1-f3 (knight move)
// Bb5xc6 (capture)
// e5-d6e.p. (en passant)
// e7-e8Q (promotion)
// 0-0 (king side castle)
// 0-0-0 (queen side castle)

// Qd7-e8# (mate)
// Ra1-a8+ (check)

export interface ICoordinates {
    row: Row;
    column: Column;
}