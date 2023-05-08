import React from "react";

//Parent class 'Piece'

class Piece extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      alive: true,
      position: props.position,
      color: props.color,
      player: props.player,
    };
  }

  givePos() {
    return this.state.position;
  }
}

//Child class 'Pawn'
class Pawn extends Piece {
  constructor(props) {
    super(props);
    this.state = {
      alive: true,
      position: props.position,
      color: props.color,
      player: props.player,
      firstTurn: true,
      moves: [],
      attackMoves: [],
      step: 10,
    };
  }

  handleMoves = () => {
    if (this.state.color == this.state.player) {
      if (this.state.firstTurn) {
        this.setState({
          moves: 1,
        });
        this.setState(
          {
            moves: [
              this.state.position - this.state.step,
              this.state.position - this.state.step * 2,
            ],
          },
          () => {
            console.log(this.state.moves);
          }
        );
      } else {
        this.setState(
          { moves: [this.state.position + this.state.step] },
          () => {
            console.log(this.state.moves);
          }
        );
      }
    }
  };
  render() {
    return (
      <img
        src={this.state.color + " Pawn.png"}
        alt=""
        onClick={this.handleMoves}
      />
    );
  }
}

//Child class 'Rook'
class Rook extends Piece {
  constructor(props) {
    super(props);
    this.state = {
      alive: true,
      position: props.position,
      color: props.color,
      firstTurn: true,
      player: props.player,
      moves: [],
      attackMoves: [],
      step: 10,
    };
  }
  handleMoves = () => {
    if (this.state.color == this.state.player) {
      console.log(this.constructor.name);
    }
  };
  render() {
    return (
      <img
        src={this.state.color + " Rook.png"}
        alt=""
        onClick={this.handleMoves}
      />
    );
  }
}

//Child class 'Horse'
class Horse extends Piece {
  constructor(props) {
    super(props);
    this.state = {
      alive: true,
      position: props.position,
      color: props.color,
      firstTurn: true,
      player: props.player,
      moves: [],
      attackMoves: [],
      step: 10,
    };
  }
  handleMoves = () => {
    if (this.state.color == this.state.player) {
      console.log(this.constructor.name);
    }
  };
  render() {
    return (
      <img
        src={this.state.color + " Horse.png"}
        alt=""
        onClick={this.handleMoves}
      />
    );
  }
}

//Child class 'King'
class King extends Piece {
  constructor(props) {
    super(props);
    this.state = {
      alive: true,
      position: props.position,
      color: props.color,
      firstTurn: true,
      player: props.player,
      moves: [],
      attackMoves: [],
      step: 10,
    };
  }
  handleMoves = () => {
    if (this.state.color == this.state.player) {
      console.log(this.constructor.name);
    }
  };
  render() {
    return (
      <img
        src={this.state.color + " King.png"}
        alt=""
        onClick={this.handleMoves}
      />
    );
  }
}

//Child class 'Bishop'
class Bishop extends Piece {
  constructor(props) {
    super(props);
    this.state = {
      alive: true,
      position: props.position,
      color: props.color,
      firstTurn: true,
      player: props.player,
      moves: [],
      attackMoves: [],
      step: 10,
    };
  }
  handleMoves = () => {
    if (this.state.color == this.state.player) {
      console.log(this.constructor.name);
    }
  };
  render() {
    return (
      <img
        src={this.state.color + " Bishop.png"}
        alt=""
        onClick={this.handleMoves}
      />
    );
  }
}

//Child class 'Queen'
class Queen extends Piece {
  constructor(props) {
    super(props);
    this.state = {
      alive: true,
      position: props.position,
      color: props.color,
      player: props.player,
      firstTurn: true,
      moves: [],
      attackMoves: [],
      step: 10,
    };
  }
  handleMoves = () => {
    if (this.state.color == this.state.player) {
      console.log(this.constructor.name);
    }
  };
  render() {
    return (
      <img
        src={this.state.color + " Queen.png"}
        alt=""
        onClick={this.handleMoves}
      />
    );
  }
}

export { Piece, Pawn, King, Queen, Bishop, Horse, Rook };
