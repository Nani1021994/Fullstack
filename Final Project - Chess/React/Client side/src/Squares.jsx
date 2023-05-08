import { useState } from "react";
import "./App.css";
import { Pawn, Rook, Horse, Bishop, Queen, King } from "./Pieces";
import React from "react";

let cellColor = "blackCell";

function blackOrWhite() {
  if (cellColor === "whiteCell") {
    cellColor = "blackCell";
  } else {
    cellColor = "whiteCell";
  }
}

let current = "";

function Squares(player) {
  let divArray = [];
  let piece = null;
  let boardState = {};

  for (let i = 0; i < 8; i++) {
    blackOrWhite();

    if (i < 2) {
      current = player === "Black" ? "White" : "Black";
    } else if (i > 5) {
      current = player;
    } else {
      current = "";
    }

    for (let j = 1; j < 9; j++) {
      let key = j + i * 10;

      if (i === 0 || i === 7) {
        switch (j) {
          case 1:
          case 8:
            piece = (
              <Rook position={key} color={current} player={player}></Rook>
            );
            break;
          case 2:
          case 7:
            piece = (
              <Horse position={key} color={current} player={player}></Horse>
            );
            break;
          case 3:
          case 6:
            piece = (
              <Bishop position={key} color={current} player={player}></Bishop>
            );
            break;
          case 4:
            piece = (
              <Queen position={key} color={current} player={player}></Queen>
            );
            break;
          case 5:
            piece = (
              <King position={key} color={current} player={player}></King>
            );
            break;
        }
      } else if (i === 1 || i === 6) {
        piece = <Pawn position={key} color={current} player={player}></Pawn>;
      } else {
        piece = null;
      }
      boardState.key = piece;
      let nextCell = <div key={key} className={cellColor}></div>;
      divArray.push(nextCell);

      blackOrWhite();
    }
  }

  // const [stateOfBoard, setStateOfBoard] = useState(divArray);

  // function handleClick() {
  //   const updatedDivArray = [...divArray];
  //   updatedDivArray[15] = (
  //     <div key="18" className={"whiteCell"}>
  //       {null}
  //     </div>
  //   );
  //   updatedDivArray[23] = (
  //     <div key="28" className={"blackCell"}>
  //       {<Pawn position={21} color={"Black"} player={"White"}></Pawn>}
  //     </div>
  //   );
  //   setStateOfBoard(updatedDivArray);
  // }

  return (
    <div className="squares">
      {divArray.map((div) => {
        <div key={div.key} className={div.props.className}>
          {boardState[key]}
        </div>;
      })}
    </div>
  );
}

export default Squares;
