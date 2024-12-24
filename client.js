const socket = io();

const board = document.getElementById('board');
let selectedPiece = null;
const moveSound = new Audio('som.mp3'); // Caminho para o arquivo de áudio no diretório raiz

// Contadores de peças capturadas
let whiteCapturedCount = 0;
let blackCapturedCount = 0;

// Referências para as áreas de captura
const whiteCapturedArea = document.getElementById('whiteCaptured');
const blackCapturedArea = document.getElementById('blackCaptured');

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
        const existingPiece = cell.querySelector('.piece');
        if (!existingPiece) { // Adiciona a peça somente se não houver uma peça na célula
            const piece = document.createElement('div');
            piece.classList.add('piece');
            piece.classList.add(color);
            cell.appendChild(piece);
        }
    }
}

function onCellClick(row, col) {
    const cell = board.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
    if (selectedPiece) {
        const piece = selectedPiece.piece;
        // Verificar se a célula de destino já está ocupada por outra peça
        if (!getPiece(row, col) && isValidMove(selectedPiece.row, selectedPiece.col, row, col, piece.classList.contains('white'))) {
            movePiece(selectedPiece.row, selectedPiece.col, row, col);
            selectedPiece = null;
        } else {
            selectedPiece = null; // Deselect piece if the move is invalid
        }
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

            // Atualizar a contagem de peças capturadas
            const capturedColor = capturedPiece.classList.contains('white') ? 'white' : 'black';
            if (capturedColor === 'white') {
                whiteCapturedCount++;
                whiteCapturedArea.textContent = `Peças capturadas (Brancas): ${whiteCapturedCount}`;
            } else {
                blackCapturedCount++;
                blackCapturedArea.textContent = `Peças capturadas (Pretas): ${blackCapturedCount}`;
            }
        }
    }

    if (fromCell && toCell) {
        const piece = fromCell.querySelector('.piece');
        if (piece) {
            toCell.appendChild(piece);
            moveSound.play(); // Toca o som de movimento
            socket.emit('move', { fromRow, fromCol, toRow, toCol });
        }
    }
}


function isValidMove(fromRow, fromCol, toRow, toCol, isWhite) {
    const rowDiff = toRow - fromRow;
    const colDiff = Math.abs(toCol - fromCol);

    // Verifica se o movimento é para uma célula preta
    const toCell = board.querySelector(`.cell[data-row="${toRow}"][data-col="${toCol}"]`);
    if (!toCell || !toCell.classList.contains('black')) return false;

    // Movimentos normais (não captura)
    if (colDiff === 1 && ((isWhite && rowDiff === -1) || (!isWhite && rowDiff === 1))) {
        return true;
    }

    // Movimentos de captura
    if (colDiff === 2 && ((isWhite && rowDiff === -2) || (!isWhite && rowDiff === 2))) {
        const capturedRow = (fromRow + toRow) / 2;
        const capturedCol = (fromCol + toCol) / 2;
        const capturedPiece = getPiece(capturedRow, capturedCol);

        if (capturedPiece && capturedPiece.classList.contains(isWhite ? 'black' : 'white')) {
            return true;
        }
    }

    return false;
}

socket.on('move', (data) => {
    const { fromRow, fromCol, toRow, toCol } = data;
    movePiece(fromRow, fromCol, toRow, toCol);
});

createBoard();
