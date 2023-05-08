//Initialize game and dom controllers

function init() {
  let app = document.getElementById("app");
  let secondHeader = document.getElementById("secondHeader");
  let pLoginMessage = document.getElementById("pLoginMessage");
  let txtUsername = document.getElementById("txtUsername");
  let txtPassword = document.getElementById("txtPassword");
  let newOrActiveGame = document.getElementById("newOrActiveGame");
  let divLogin = document.getElementById("divLogin");
  let divActiveGames = document.getElementById("divActiveGames");
  let divLobby = document.getElementById("divLobby");
  if (gameStarted) {
    boardCreater();
    boardState = setInitialBoard(player);
    render(boardState);
  } else {
  }
}

function render(state) {
  setBoardByState(state);
  // checkForCheck(state);
  // checkForMate(state);
}

//GLOBAL VARiABLES
let player = "White";
let opponent = "Black";
let gameStarted = true;
let partner = true;
let isItMyTurn = true;
let boardState;
let blackKing, whiteKing;
let legalMovesUnderCheck = {};
let username, password;
let gameId;
let currentClickedPiece = null;
let currentClickedSquare = null;

//CLIENT FUNCTIONS

//Sends HTTP request to server to login an existing user, or create a new user

function btnLoginSignupClicked(loginOrSignup) {
  username = txtUsername.value;
  password = txtPassword.value;
  if (!username || !password) return;
  //lock the buttons:
  let elements = document.getElementsByClassName("lock");
  for (let e of elements) {
    e.disabled = true;
  }
  pLoginMessage.innerHTML = "";
  sendHttpGetRequest(
    "api/" + loginOrSignup + "?username=" + username + "&password=" + password,
    (response) => {
      //release the buttons:
      for (let e of elements) {
        e.disabled = false;
      }
      if (response == "ok") {
        newOrActiveGame.className = "shown";
        divLogin.style.display = "none";
      } else if (response == "invalid") {
        pLoginMessage.innerHTML = "invalid username or password.";
      } else if (response == "taken") {
        pLoginMessage.innerHTML = "username already taken.";
      } else {
        //wtf ???
      }
    }
  );
}
window.btnLoginSignupClicked = btnLoginSignupClicked;

//Sends HTTP request to server after clicking a color in 'New Game' screen

function startGame(event) {
  if (!username || !password) return;
  //lock the buttons:
  let elements = document.getElementsByClassName("lock");
  for (let e of elements) {
    e.disabled = true;
  }
  player = event.target.innerHTML.trim();
  opponent = player == "White" ? "Black" : "White";
  let color = player == "White" ? "white_player" : "black_player";
  let boardLayout = JSON.stringify(boardState);
  sendHttpGetRequest(
    "api/newgame" +
      "?username=" +
      username +
      "&password=" +
      password +
      "&color=" +
      color +
      "&layout=" +
      boardLayout,
    (response) => {
      //release the buttons:
      for (let e of elements) {
        e.disabled = false;
      }
      if (response == "invalid") {
      } else {
        gameId = response;
        document.getElementById("secondHeader").innerHTML =
          "Game no. " + gameId;
        document.getElementById(player[0] + "CH").innerHTML += " - " + username;
      }
    }
  );
  gameStarted = true;
  isItMyTurn = player == "White";
  checkForPartner();
  init();
}

//Sends HTTP request to server to join an existing game. Will allow the choice of all available games

function getLobbyOfActiveGames() {
  sendHttpGetRequest(
    "api/get_lobby?username=" + username + "&password=" + password,
    (result) => {
      if (result == "Whoops something went wrong") {
        return;
      }
      let activeGames = JSON.parse(result);
      removeAllChildNodes(divActiveGames);
      //let existsInList = false;
      for (let i = 0; i < activeGames.length; i++) {
        let p = document.createElement("p");
        p.innerHTML = activeGames[i].game_id;
        divActiveGames.appendChild(p);
        p.onclick = (event) => {
          let selectedGame = event.target.innerHTML;
          sendHttpGetRequest(
            "api/join_game?username=" +
              username +
              "&password=" +
              password +
              "&selectedGame=" +
              selectedGame,
            (response) => {
              if (response == "Whoops something went wrong") {
              } else {
                resObj = JSON.parse(response);
                player =
                  resObj.whatIsMyColor == "white_player" ? "White" : "Black";
                opponent = player == "White" ? "Black" : "White";
                partner = resObj.partner;
                boardState = setInitialBoard(player);
                document.getElementById("secondHeader").innerHTML =
                  "Game no. " + selectedGame;
                divLobby.className = "hidden";
                gameStarted = true;
                init();
                isItMyTurn = player == "White";
                document.getElementById(player[0] + "CH").innerHTML +=
                  " - " + username;
                document.getElementById(opponent[0] + "CH").innerHTML +=
                  " - " + partner;
              }
            }
          );
        };
      }
      newOrActiveGame.style.display = "none";
      divLobby.className = "divActiveGame";
    }
  );
}

function checkForPartner() {
  if (gameStarted && !partner) {
    //1. send http request to get game status
    //2. update UI
    sendHttpGetRequest(
      "api/check_for_partner?username=" +
        username +
        "&password=" +
        password +
        "&id=" +
        gameId,
      (response) => {
        if (
          response != "game does not exist" &&
          response != "Whoops something went wrong"
        ) {
          partner = response;
          if (partner != "null") {
            //render board   gameStatus.board
            document.getElementById(opponent[0] + "CH").innerHTML +=
              " - " + JSON.parse(partner);
          } else {
            partner = false;
            setTimeout(checkForPartner, 500);
          }
        } else {
          setTimeout(checkForPartner, 500);
        }
        //we stopped here
        //we need to process the response which is the game status
        //if game is not active then go back to lobby
      }
    );
  }
}

function getBoardState() {
  //1. send http request to get game status
  //2. update UI
  sendHttpGetRequest(
    "api/get_game_status?username=" +
      username +
      "&password=" +
      password +
      "&id=" +
      gameId,
    (response) => {
      //we stopped here
      //we need to process the response which is the game status
      //if game is not active then go back to lobby
      let gameStatus = JSON.parse(response);
      if (gameStatus.active) {
        //render board   gameStatus.board
        for (let i = 0; i < 9; i++) {
          let cellStatus = gameStatus.board[i];
          if (cellStatus == 0) {
            divCells[i].innerHTML = "";
          } else if (cellStatus == 1) {
            divCells[i].innerHTML = '<img src="x.png" />';
          } else if (cellStatus == 2) {
            divCells[i].innerHTML = '<img src="o.png" />';
          }
        }
        setTimeout(getGameStatus, 500);
      } else {
        show(divLobby);
        getLobby();
      }
    }
  );
}

function newGame() {
  colorPicker();
}

//BOARD CONTROLLERS

//Set the initial board according to the selected color

function setInitialBoard(player) {
  if (player) {
    let board = {};
    if (player == "White" || player == "Black") {
      let pieces = [
        "R1",
        "H1",
        "B1",
        "Q",
        "K",
        "B2",
        "H2",
        "R2",
        "P1",
        "P2",
        "P3",
        "P4",
        "P5",
        "P6",
        "P7",
        "P8",
      ];
      if (player == "Black") {
        pieces[3] = "K";
        pieces[4] = "Q";
      }
      for (let i = 0; i < 8; i++) {
        for (let j = 1; j < 9; j++) {
          board[j + i * 10] = null;
        }
      }
      for (let i = 1; i < 9; i++) {
        if (pieces[i - 1] == "K") {
          board[i] = opponent[0] + pieces[i - 1];
          board[i + 10] = opponent[0] + pieces[23 - i - 7];
          board[i + 60] = player[0] + pieces[i + 7];
          board[i + 70] = player[0] + pieces[i - 1];
        } else if (pieces[i - 1] == "Q") {
          board[i] = opponent[0] + pieces[i - 1];
          board[i + 10] = opponent[0] + pieces[23 - i - 7];
          board[i + 60] = player[0] + pieces[i + 7];
          board[i + 70] = player[0] + pieces[i - 1];
        } else {
          board[i] = opponent[0] + pieces[9 - i - 1];
          board[i + 10] = opponent[0] + pieces[23 - i - 7];
          board[i + 60] = player[0] + pieces[i + 7];
          board[i + 70] = player[0] + pieces[i - 1];
        }
      }
    } else return;
    return board;
  }
}

//State of board, being rendered to the board

function setBoardByState(state) {
  for (let key in state) {
    let square = document.getElementById(key);
    if (state[key]) {
      let piece = document.getElementById(state[key]);
      square.appendChild(piece);
      if (piece.id[1] == "K") {
        switch (piece.id[0]) {
          case "B":
            blackKing = parseInt(key);
            break;
          case "W":
            whiteKing = parseInt(key);
            break;
        }
      }
    } else if (square.firstChild) {
      let temp = document.getElementById("WC");
      temp.appendChild(square.firstChild);
      removeAllChildNodes(square);
    }
  }
}

//BOARD COLORING FUNCTIONS

//marking possible squares for next move with an opaque yellow color

function colorSqaureYellow(positions) {
  for (let pos of positions) {
    if (pos) document.getElementById(pos).classList.add("yellow-layer");
  }
}

//Removes all yellow bricks

function removeYellowMark() {
  for (let key in boardState) {
    document.getElementById(key).classList.remove("yellow-layer");
  }
}

//Removes all red bricks

function removeCheckMark() {
  for (let key in boardState) {
    document.getElementById(key).classList.remove("check");
  }
}

//Move start click handler
function handleClickOfPiece(e) {
  removeYellowMark();
  if (gameStarted && partner && isItMyTurn) {
    if (e.target.id[0] == player[0]) {
      currentClickedPiece = e.target.id;
      currentClickedSquare = e.target.parentNode.id;
      let moves = movementCalcByPiece(
        currentClickedPiece,
        currentClickedSquare,
        boardState
      );
      colorSqaureYellow(moves);
    }
  }
}
//Move end click handler
function handleClickOfTarget(e) {
  if (currentClickedPiece && e.target.id[0] != currentClickedPiece[0]) {
    let target = e.target;
    let moves = movementCalcByPiece(
      currentClickedPiece,
      currentClickedSquare,
      boardState
    );
    let myKingPos = player == "White" ? whiteKing : blackKing;
    let opponentKingPos = player == "White" ? blackKing : whiteKing;
    if (
      moves.includes(parseInt(target.id)) ||
      moves.includes(parseInt(target.parentNode.id))
    ) {
      let isCheckOnSelf;
      let boardCopy = { ...boardState };
      if (target.childNodes.length == 0 && target.tagName == "DIV") {
        boardCopy[target.id] = currentClickedPiece;
        boardCopy[currentClickedSquare] = null;
        if (currentClickedPiece[1] == "K") myKingPos = target.id;
        isCheckOnSelf = checkForCheckOnSelf(boardCopy, myKingPos);
        console.log("if i move here " + isCheckOnSelf + " will eat me");
        if (isCheckOnSelf) {
          removeYellowMark();
          currentClickedSquare = null;
          currentClickedPiece = null;
          return;
        }
        boardState[target.id] = currentClickedPiece;
        boardState[currentClickedSquare] = null;
      } else if (target.tagName == "IMG") {
        boardCopy[target.parentNode.id] = currentClickedPiece;
        boardCopy[currentClickedSquare] = null;
        if (currentClickedPiece[1] == "K") myKingPos = target.parentNode.id;
        isCheckOnSelf = checkForCheckOnSelf(boardCopy, myKingPos);
        console.log("if i move here " + isCheckOnSelf + " will eat me");
        if (isCheckOnSelf) {
          removeYellowMark();
          currentClickedSquare = null;
          currentClickedPiece = null;
          return;
        }
        boardState[target.parentNode.id] = currentClickedPiece;
        boardState[currentClickedSquare] = null;
        let cont = document.getElementById(target.id[0] + "C");
        let piece = document.getElementById(target.id);
        cont.appendChild(piece);
      }
    }
    let temp = document.getElementById(currentClickedPiece);
    if (temp.firstTurn) temp.firstTurn = false;
    removeYellowMark();
    render(boardState);
    removeCheckMark();
    let isOp = checkForCheckOnOpponent(boardState, opponentKingPos);
    console.log(isOp);
    if (isOp) {
      checkForMate(boardState, opponentKingPos);
    }
    currentClickedSquare = null;
    currentClickedPiece = null;
  }
}

function removeAllChildNodes(parent) {
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild);
  }
}

//calculates ranged movements horizontally, vertically and diagonally for Bishop, Horse, Rook, Queen and King
function calsRangeMovements(piece, loc, state) {
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
function movementCalcByPiece(piece, loc, state) {
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

function checkForCheckOnOpponent(state, opponentKingPos) {
  let isCheck = null;
  for (let key in state) {
    if (state[key] && state[key][0] == player[0]) {
      let moves = movementCalcByPiece(state[key], key, state);
      if (moves.includes(opponentKingPos)) {
        document.getElementById(opponentKingPos).classList.add("check");
        isCheck = state[opponentKingPos];
        return isCheck;
      }
    }
  }
  return isCheck;
}

function checkForCheckOnSelf(state, myKingPos) {
  let flippedPlayerKingPos = 79 - myKingPos;
  let flippedBoard = flipBoard(state);
  console.log(flippedBoard);
  let isCheck = null;
  for (let key in flippedBoard) {
    if (flippedBoard[key] && flippedBoard[key][0] == opponent[0]) {
      let moves = movementCalcByPiece(flippedBoard[key], key, flippedBoard);
      if (moves.includes(flippedPlayerKingPos)) {
        isCheck = flippedBoard[flippedPlayerKingPos];
        return isCheck;
      }
    }
  }
  return isCheck;
}

function flipBoard(state) {
  let flippedBoard = {};
  for (let key in state) {
    flippedBoard[79 - key] = state[key];
  }
  return flippedBoard;
}

//CHECKMATE CHALLENGE

function checkForMate(state, opponentKingPos) {
  let flippedBoard = flipBoard(state);
  let flippedOpponentKingPos = 79 - opponentKingPos;
  for (let key in flippedBoard) {
    if (flippedBoard[key] && flippedBoard[key][0] == opponent[0]) {
      let moves = movementCalcByPiece(flippedBoard[key], key, flippedBoard);
      if (moves) {
        console.log("here are the moves of " + flippedBoard[key]);
        console.log(moves);
        for (let move of moves) {
          flippedBoard[move] = flippedBoard[key];
          flippedBoard[key] = null;
          if (flippedBoard[move] && flippedBoard[move][1] == "K") {
            flippedOpponentKingPos = move;
          }
          let flippedBack = flipBoard(flippedBoard);
          let isCheck = checkForCheckOnOpponent(
            flippedBack,
            79 - flippedOpponentKingPos
          );
          console.log("check is on " + isCheck);
          if (!isCheck) {
            console.log("the king should live another day!");
            return false;
          }
          flippedBoard = flipBoard(state);
          flippedOpponentKingPos = 79 - opponentKingPos;
        }
      }
    }
  }
  console.log("the king is dead");
  return true;
}

function findPos(piece) {
  for (let key in boardState) {
    if (boardState[key] == piece) return key;
  }
  return "eaten";
}
//COLOR PICKER PAGE

function colorPicker() {
  let colPickerBlack = document.getElementById("colPickerBlack");
  let colPickerWhite = document.getElementById("colPickerWhite");
  colPickerBlack.onclick = startGame;
  colPickerWhite.onclick = startGame;
  newOrActiveGame.style.display = "none";
  document.getElementById("colorPickerContainer").className = "shown";
}

//BOARD AND PIECES CREATION

function boardCreater() {
  //alternates between different styles, black and white squares
  function blackOrWhite() {
    if (cellColor == "whiteCell") {
      cellColor = "blackCell";
    } else {
      cellColor = "whiteCell";
    }
  }
  let cellColor = "blackCell"; //initilize it with black square

  //hashtable for img sources by abbr.
  const pieces = {
    BR: "Black_Rook.png",
    BH: "Black_Horse.png",
    BB: "Black_Bishop.png",
    BQ: "Black_Queen.png",
    BK: "Black_King.png",
    BP: "Black_Pawn.png",
    WR: "White_Rook.png",
    WH: "White_Horse.png",
    WB: "White_Bishop.png",
    WQ: "White_Queen.png",
    WK: "White_King.png",
    WP: "White_Pawn.png",
  };

  //ELEMENTS

  //code bloack for creating the squares component with 64 black and white divs
  let squares = document.createElement("div");
  squares.id = "squares";
  squares.className = "squares";
  for (let i = 0; i < 8; i++) {
    blackOrWhite();
    for (let j = 1; j < 9; j++) {
      let key = j + i * 10;
      let cell = document.createElement("div");
      cell.id = key.toString();
      cell.className = cellColor;
      cell.onclick = handleClickOfTarget;
      squares.appendChild(cell);
      blackOrWhite();
    }
  }

  //creates the frame of the board
  let topBotFrameBlock = [];
  let leftRiFrameBlock = [];
  const letters = "abcdefgh";
  for (let i = 0; i < 8; i++) {
    topBotFrameBlock.push(letters[i]);
    leftRiFrameBlock.push(8 - i);
  }
  let topPart = document.createElement("div");
  topPart.id = "T";
  topPart.className = "contBlocksHor";
  topBotFrameBlock.map((item, index) => {
    let temp = document.createElement("div");
    temp.id = "T" + index;
    temp.className = "frameBlockHor";
    temp.style.transform = "rotateZ(180deg)";
    temp.innerHTML = item;
    topPart.appendChild(temp); // Append temp to the topPart element
  });
  let bottom = document.createElement("div");
  bottom.id = "B";
  bottom.className = "contBlocksHor";
  topBotFrameBlock.map((item, index) => {
    let temp = document.createElement("div");
    temp.id = "B" + index;
    temp.className = "frameBlockHor";
    temp.innerHTML = item;
    bottom.appendChild(temp); // Append temp to the bottom element
  });
  let right = document.createElement("div");
  right.id = "R";
  right.className = "contBlocksVer";
  leftRiFrameBlock.map((item, index) => {
    let temp = document.createElement("div");
    temp.id = "R" + index;
    temp.className = "frameBlockVer";
    temp.innerHTML = item;
    right.appendChild(temp); // Append temp to the right element
  });
  let left = document.createElement("div");
  left.id = "R";
  left.className = "contBlocksVer";
  leftRiFrameBlock.map((item, index) => {
    let temp = document.createElement("div");
    temp.id = "R" + index;
    temp.className = "frameBlockVer";
    temp.style.transform = "rotateZ(180deg)";
    temp.innerHTML = item;
    left.appendChild(temp); // Append temp to the left element
  });

  //creates the semiboard with right and left board sides, and squares in the middle
  let semiBoard = document.createElement("div");
  semiBoard.id = "semiBoard";
  semiBoard.className = "semiBoard";
  semiBoard.appendChild(left);
  semiBoard.appendChild(squares);
  semiBoard.appendChild(right);

  //creates the full board
  let board = document.createElement("div");
  board.id = "board";
  board.className = "board";
  board.appendChild(topPart);
  board.appendChild(semiBoard);
  board.appendChild(bottom);

  //creates pieces containers
  let blackContainer = document.createElement("div");
  blackContainer.id = "BC";
  blackContainer.className = "pieceContainer";
  let bcHeader = document.createElement("h1");
  bcHeader.id = "BCH";
  bcHeader.className = "pieceContainerHeader";
  bcHeader.innerHTML = "Black Pieces";
  blackContainer.appendChild(bcHeader);

  let whiteContainer = document.createElement("div");
  whiteContainer.id = "WC";
  whiteContainer.className = "pieceContainer";
  let wcHeader = document.createElement("h1");
  wcHeader.className = "pieceContainerHeader";
  wcHeader.id = "WCH";
  wcHeader.innerHTML = "White Pieces";
  whiteContainer.appendChild(wcHeader);

  //creating the pieces and appending them in the containers
  for (let key in pieces) {
    let piece;
    switch (key[1]) {
      case "P":
        for (let i = 1; i < 9; i++) {
          piece = document.createElement("img");
          piece.id = key + i;
          piece.src = pieces[key];
          piece.onclick = handleClickOfPiece;
          piece.firstTurn = true;
          piece.style.alignSelf = "flex-end";
          key[0] == "W"
            ? whiteContainer.appendChild(piece)
            : blackContainer.appendChild(piece);
        }
        break;
      case "R":
      case "B":
      case "H":
        for (let i = 1; i < 3; i++) {
          piece = document.createElement("img");
          piece.id = key + i;
          piece.src = pieces[key];
          piece.onclick = handleClickOfPiece;
          piece.firstTurn = true;
          piece.style.alignSelf = "flex-end";
          key[0] == "W"
            ? whiteContainer.appendChild(piece)
            : blackContainer.appendChild(piece);
        }
        break;
      case "Q":
      case "K":
        piece = document.createElement("img");
        piece.id = key;
        piece.src = pieces[key];
        piece.onclick = handleClickOfPiece;
        piece.firstTurn = true;
        piece.style.alignSelf = "flex-end";
        key[0] == "W"
          ? whiteContainer.appendChild(piece)
          : blackContainer.appendChild(piece);
        break;
    }
  }

  //append all elements in app
  app.appendChild(blackContainer);
  app.appendChild(board);
  app.appendChild(whiteContainer);
}

window.init = init;
