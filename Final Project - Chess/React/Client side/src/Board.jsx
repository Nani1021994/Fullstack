import "./App.css";
import Squares from "./Squares";

function Board() {
  let topBotFrameBlock = [];
  let leftRiFrameBlock = [];
  const letters = "abcdefgh";
  const flipLetters = { transform: "rotateZ(180deg)" };
  //creating top and bottom block
  for (let i = 0; i < 8; i++) {
    topBotFrameBlock.push(letters[i]);
    leftRiFrameBlock.push(8 - i);
  }
  const top = (
    <div key={"T"} className="contBlocksHor">
      {topBotFrameBlock.map((item, index) => (
        <div key={"T" + index} className="frameBlockHor" style={flipLetters}>
          {item}
        </div>
      ))}
    </div>
  );
  const bottom = (
    <div key={"B"} className="contBlocksHor">
      {topBotFrameBlock.map((item, index) => (
        <div key={"B" + index} className="frameBlockHor">
          {item}
        </div>
      ))}
    </div>
  );
  const left = (
    <div key={"L"} className="contBlocksVer">
      {leftRiFrameBlock.map((item, index) => (
        <div key={"L" + index} className="frameBlockVer">
          {item}
        </div>
      ))}
    </div>
  );
  const right = (
    <div key={"R"} className="contBlocksVer">
      {leftRiFrameBlock.map((item, index) => (
        <div key={"R" + index} className="frameBlockVer" style={flipLetters}>
          {item}
        </div>
      ))}
    </div>
  );

  return (
    <div className="board">
      {top}
      <div className="semiBoard">
        {left}
        {Squares("White")}
        {right}
      </div>
      {bottom}
    </div>
  );
}

export default Board;
