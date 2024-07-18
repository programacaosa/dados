const socket = io();

const board = document.getElementById('board');
let selectedPiece = null;

function createBoard() {
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.classList.add((i + j) % 2 === 0 ? 'white' : 'black');
            cell.dataset.row = i;
            cell.dataset.col = j;
            cell.addEventListener('click', () => onCellClick(i, j));
            board.appendChild(cell);
        }
    }

    // Colocar peças iniciais
    for (let i = 0; i < 3; i++) {
        for (let j = (i + 1) % 2; j < 8; j += 2) {
            addPiece(i, j, 'black');
        }
    }
    for (let i = 5; i < 8; i++) {
        for (let j = (i + 1) % 2; j < 8; j += 2) {
            addPiece(i, j, 'white');
        }
    }
}

function addPiece(row, col, color) {
    const cell = board.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
    if (cell) {
        const piece = document.createElement('div');
        piece.classList.add('piece');
        piece.classList.add(color);
        cell.appendChild(piece);
    }
}

function onCellClick(row, col) {
    if (selectedPiece) {
        movePiece(selectedPiece.row, selectedPiece.col, row, col);
        selectedPiece = null;
    } else {
        const piece = getPiece(row, col);
        if (piece) {
            selectedPiece = { row, col, piece };
        }
    }
}

function getPiece(row, col) {
    const cell = board.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
    return cell ? cell.querySelector('.piece') : null;
}

function movePiece(fromRow, fromCol, toRow, toCol) {
    const fromCell = board.querySelector(`.cell[data-row="${fromRow}"][data-col="${fromCol}"]`);
    const toCell = board.querySelector(`.cell[data-row="${toRow}"][data-col="${toCol}"]`);

    // Verifica se é um movimento de captura
    if (Math.abs(toRow - fromRow) === 2 && Math.abs(toCol - fromCol) === 2) {
        const capturedRow = (fromRow + toRow) / 2;
        const capturedCol = (fromCol + toCol) / 2;
        const capturedPiece = getPiece(capturedRow, capturedCol);
        if (capturedPiece) {
            capturedPiece.remove();
        }
    }

    if (fromCell && toCell) {
        const piece = fromCell.querySelector('.piece');
        if (piece) {
            toCell.appendChild(piece);
            socket.emit('move', { fromRow, fromCol, toRow, toCol });
        }
    }
}

socket.on('move', (data) => {
    const { fromRow, fromCol, toRow, toCol } = data;
    movePiece(fromRow, fromCol, toRow, toCol);
});

createBoard();
