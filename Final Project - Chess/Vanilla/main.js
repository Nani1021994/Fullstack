let http = require("http");
let url = require("url");
let st = require("./server_tools");
let mysql = require("mysql");

http
  .createServer((req, res) => {
    let q = url.parse(req.url, true);
    let path = q.pathname;
    if (path.startsWith("/api")) {
      path = path.substring(4);
      let username = q.query.username;
      let password = q.query.password;
      if (!username || !password) {
        res.writeHead(400, { "Content-Type": "text/plain" });
        res.end("username and password are required");
        return;
      }
      if (path.startsWith("/signup")) {
        //handles signup
        st.query(
          "INSERT INTO users(username,password) VALUES (?,?)",
          [username, password],
          (result, err) => {
            if (err) {
              res.writeHead(200, { "Content-Type": "text/plain" });
              res.end("taken");
              return;
            }
            res.writeHead(200, { "Content-Type": "text/plain" });
            res.end("ok");
          }
        );
      } else if (path.startsWith("/login")) {
        //handles login, validates user
        validateUser(username, password, (isValid) => {
          res.writeHead(200, { "Content-Type": "text/plain" });
          res.end(isValid ? "ok" : "invalid");
        });
      } else if (path.startsWith("/newgame")) {
        //registers a new game in the database
        validateUser(username, password, (isValid) => {
          if (isValid) {
            let color = q.query.color;
            if (color != "white_player" || color != "black_player") {
              color = "";
            }
            let layout;
            if (color == "white_player") {
              layout = q.query.layout;
            } else if (color == "black_player") {
              layout = flipBoard(q.query.layout);
            } else {
              res.writeHead(200, { "Content-Type": "text/plain" });
              res.end("invalid player color");
              return;
            }

            st.query(
              `INSERT INTO games(${color},is_active, current_layout) VALUES (?,?,?)`,
              [username, 1, layout],
              (result, err) => {
                if (err) {
                  console.log(err);
                  res.writeHead(200, { "Content-Type": "text/plain" });
                  res.end("invalid");
                  return;
                } else {
                  res.writeHead(200, { "Content-Type": "text/plain" });
                  res.end(JSON.stringify(result.insertId));
                  console.log(result);
                  return;
                }
              }
            );
          } else {
            res.writeHead(200, { "Content-Type": "text/plain" });
            res.end("invalid");
          }
        });
      } else if (path.startsWith("/get_lobby")) {
        //get a list of all available games
        st.query(
          "SELECT game_id FROM games WHERE is_active=1 AND ((white_player IS NOT NULL AND black_player IS NULL) OR (black_player IS NOT NULL AND white_player IS NULL))",
          (err, result) => {
            if (err) {
              //not now
              res.writeHead(200, { "Content-Type": "text/plain" });
              res.end("whoops something went wrong");
              console.log(err);
              return;
            } else {
              res.writeHead(200, { "Content-Type": "text/plain" });
              res.end(JSON.stringify(result));
              return;
            }
          }
        );
      } else if (path.startsWith("/join_game")) {
        //when the user selects a game with only one player
        let selectedGame = q.query.selectedGame;
        if (!selectedGame) return;
        st.query(
          "SELECT white_player, black_player FROM games WHERE game_id=?",
          [selectedGame],
          (result, err) => {
            if (err) {
              console.log(err);
              res.writeHead(200, { "Content-Type": "text/plain" });
              res.end("Whoops something went wrong");
              return;
            } else if (result.length == 1) {
              let whatIsMyColor;
              let partner;
              let resObj = {};
              for (let key in result[0]) {
                if (!result[0][key]) {
                  whatIsMyColor = key;
                } else partner = result[0][key];
              }
              resObj.partner = partner;
              resObj.whatIsMyColor = whatIsMyColor;
              st.query(
                `UPDATE games SET ${whatIsMyColor}=? WHERE game_id=?;`,
                [username, selectedGame],
                (result, err) => {
                  if (err) {
                    console.log(err);
                    res.writeHead(200, { "Content-Type": "text/plain" });
                    res.end("Whoops something went wrong");
                    return;
                  } else {
                    console.log(resObj);
                    res.writeHead(200, { "Content-Type": "text/plain" });
                    res.end(JSON.stringify(resObj));
                  }
                }
              );
            } else {
              res.writeHead(200, { "Content-Type": "text/plain" });
              res.end("no available game with this id");
            }
          }
        );
      } else if (path.startsWith("/check_for_partner")) {
        //checks in the database whether a new user has registered for the game
        let game_id = q.query.id;
        st.query(
          `SELECT black_player, white_player FROM games WHERE game_id=?;`,
          [game_id],
          (result, err) => {
            if (err) {
              console.log(err);
              res.writeHead(200, { "Content-Type": "text/plain" });
              res.end("Whoops something went wrong");
              return;
            } else if (result.length == 1) {
              for (let key in result[0]) {
                if (result[0][key] != username) {
                  console.log(result[0][key]);
                  res.writeHead(200, { "Content-Type": "text/plain" });
                  res.end(JSON.stringify(result[0][key]));
                }
              }
            } else {
              res.writeHead(200, { "Content-Type": "text/plain" });
              res.end("game does not exist");
            }
          }
        );
      } else if (path.startsWith("/piece_moved")) {
        //handles the changing of the board
        let gameId = q.query.game_id;
        let boardLayout = q.query.board_layout;
        let checkOn =
          q.query.check_on == "null"
            ? JSON.parse(q.query.check_on)
            : q.query.check_on;
        let mateOn =
          q.query.mate_on == "null"
            ? JSON.parse(q.query.mate_on)
            : q.query.mate_on;
        st.query(
          "UPDATE games SET current_layout=?, check_on=?, mate_on=? WHERE game_id=?",
          [boardLayout, checkOn, mateOn, gameId],
          (result, err) => {
            if (err) {
              //not now
              res.writeHead(200, { "Content-Type": "text/plain" });
              res.end(JSON.stringify(err));
              return;
            } else {
              res.writeHead(200, { "Content-Type": "text/plain" });
              res.end("movement recorded");
            }
          }
        );
      } else if (path.startsWith("/get_game_status")) {
        //return the boardlayout and check/mate status of board
        let gameId = q.query.id;
        if (!gameId) return;
        st.query(
          "SELECT current_layout, check_on, mate_on FROM games WHERE game_id=? ",
          [gameId],
          (result, err) => {
            if (err) {
              //not now
              res.writeHead(200, { "Content-Type": "text/plain" });
              res.end("Whoops something went wrong");
              return;
            } else if (result.length == 1) {
              let gameStatus = {
                boardLayout: JSON.parse(result[0].current_layout),
                checkOn: result[0].check_on,
                mateOn: result[0].mate_on,
              };
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify(gameStatus));
            }
          }
        );
      }
    } else {
      //server static files
      st.serveStaticFile(path, res);
      console.log(path, res);
    }
  })
  .listen(8080, () => {
    console.log("now listening...");
  });

function validateUser(username, password, callback) {
  //validates username and password in the database
  st.query(
    "SELECT COUNT(*) AS count FROM users WHERE username=? AND BINARY password=?",
    [username, password],
    (result, err) => {
      if (err) {
        callback(false);
        return;
      }
      callback(result[0].count == 1);
    }
  );
}

function flipBoard(state) {
  //maintain conformity of board layout deposit in database
  let flippedBoard = {};
  if (typeof state == "string") {
    state = JSON.parse(state);
  }
  for (let key in state) {
    flippedBoard[79 - key] = state[key];
  }
  return JSON.stringify(flippedBoard);
}
