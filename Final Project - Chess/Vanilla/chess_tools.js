export function removeAllChildNodes(parent) {
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild);
  }
}

//calculates ranged movements horizontally, vertically and diagonally for Bishop, Horse, Rook, Queen and King
export function calsRangeMovements(piece, loc, state) {
  let moves = [];
  let pos = parseInt(loc);
  let upperLimit = 80;
  let lowerAndLeftLimit = 0;
  let rightLimit = 9;
  let steps = [];
  let directions = 0;
  let kingWhileCanceler = false;
  switch (piece[1]) {
    case "B":
      steps = [11, 9, -11, -9];
      directions = 4;
      break;
    case "R":
      steps = [10, -10, -1, 1];
      directions = 4;
      break;
    case "Q":
      steps = [11, 9, -11, -9, 10, -10, -1, 1];
      directions = 8;
      break;
    case "K":
      steps = [11, 9, -11, -9, 10, -10, -1, 1];
      directions = 8;
      kingWhileCanceler = true;
  }
  for (let i = 0; i < directions; i++) {
    let tempPos = pos;
    let step = steps[i];
    while (
      tempPos + step > lowerAndLeftLimit &&
      tempPos + step < upperLimit &&
      (tempPos + step) % 10 > lowerAndLeftLimit &&
      (tempPos + step) % 10 < rightLimit
    ) {
      if (
        tempPos + step in state &&
        state[tempPos + step] != null &&
        state[tempPos + step][0] != piece[0]
      ) {
        moves.push(tempPos + step);
        break;
      } else if (
        tempPos + step in state &&
        state[tempPos + step] != null &&
        state[tempPos + step][0] == piece[0]
      ) {
        break;
      }

      moves.push(tempPos + step);
      tempPos += step;
      if (kingWhileCanceler) break;
    }
  }
  return moves;

  //calculates the possible moves for a piece
}
export function movementCalcByPiece(piece, loc, state) {
  let moves = [];
  let pieceElement = document.getElementById(piece);
  let pos = parseInt(loc);
  let lowerAndLeftLimit = 0;
  switch (piece[1]) {
    case "P":
      if (state[pos - 10] == null && pos - 10 > lowerAndLeftLimit) {
        moves.push(pos - 10);
        if (pieceElement.firstTurn && state[pos - 20] == null) {
          moves.push(pos - 20);
        }
      }
      let attackOnTheRight = pos - 11 in state ? pos - 11 : pos;
      let attackOnTheleft = pos - 9 in state ? pos - 9 : pos;
      if (
        state[attackOnTheRight] != null &&
        state[attackOnTheRight][0] != piece[0]
      ) {
        moves.push(attackOnTheRight);
      }
      if (
        state[attackOnTheleft] != null &&
        state[attackOnTheleft][0] != piece[0]
      ) {
        moves.push(attackOnTheleft);
      }
      break;
    case "H":
      let horseMovesRange = [19, 21, 12, 8, -19, -21, -12, -8];
      for (let item of horseMovesRange) {
        if (
          pos + item in state &&
          (state[item + pos] == null || state[item + pos][0] != piece[0])
        ) {
          moves.push(pos + item);
        }
      }
      break;
    case "B":
    case "R":
    case "Q":
    case "K":
      moves = calsRangeMovements(piece, loc, state);
      break;
  }

  return moves;
}

export function checkForCheck(state, player) {
  let opponent = player == "W" ? "B" : "W";
  for (let key in state) {
    if (state[key]) {
      let moves = movementCalcByPiece(state[key], key, state);
      if (blackKing in moves || whiteKing in moves) console.log("Check");
    }
  }
}

export function checkForMate(state) {}
