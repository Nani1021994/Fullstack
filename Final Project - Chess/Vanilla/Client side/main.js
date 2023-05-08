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
        validateUser(username, password, (isValid) => {
          res.writeHead(200, { "Content-Type": "text/plain" });
          res.end(isValid ? "ok" : "invalid");
        });
      } else if (path.startsWith("/newgame")) {
        validateUser(username, password, (isValid) => {
          if (isValid) {
            let color = q.query.color;
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
        //get a list of all users that are currently waiting to be picked up by another user.
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
            } else if (result[0]) {
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
            } else if (result[0]) {
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
      } else if (path.startsWith("/leave_game")) {
        //how to find my partner ??
        //go over all games that I am either player1 or player2.
        //from those games, if I am i.e player1, then player2 is my partner.
        //if I am player2, then my partner is player1.
        st.query(
          "SELECT id,player1,player2 FROM games WHERE (player1=? OR player2=?) AND active=1",
          [username, username],
          (result, err) => {
            if (err) {
              //not now

              return;
            }
            if (result.length >= 1) {
              let gameId = result[0].id;
              let partner;
              if (result[0].player1 == username) {
                partner = result[0].player2;
              } else {
                partner = result[0].player1;
              }

              st.query(
                "UPDATE games SET active=0 WHERE id=? AND active=1",
                [gameId],
                (result, err) => {
                  if (err) {
                    //not now

                    return;
                  }
                  if (result.affectedRows == 1) {
                    st.query(
                      "UPDATE users SET lobby=0 WHERE username IN (?,?)",
                      [username, partner],
                      (result, err) => {
                        if (err) {
                          //not now

                          return;
                        }
                        res.writeHead(200, { "Content-Type": "text/plain" });
                        res.end("ok");
                      }
                    );
                  } else if (result.affectedRows == 0) {
                    st.query(
                      "UPDATE users SET lobby=0 WHERE username = ?",
                      [username],
                      (result, err) => {
                        if (err) {
                          //not now

                          return;
                        }
                        res.writeHead(200, { "Content-Type": "text/plain" });
                        res.end("ok");
                      }
                    );
                  }
                }
              );
            }
          }
        );
      } else if (path.startsWith("/get_game_id")) {
        st.query(
          "SELECT id FROM games WHERE (player1=? OR player2=?) AND active=1",
          [username, username],
          (result, err) => {
            if (err) {
              //not now
              res.end("");
              return;
            }
            if (result.length >= 1) {
              let gameId = result[0].id;
              res.writeHead(200, { "Content-Type": "text/plain" });
              res.end(gameId + "");
            } else {
              res.writeHead(200, { "Content-Type": "text/plain" });
              res.end("-1");
            }
          }
        );
      } else if (path.startsWith("/get_game_status")) {
        let gameId = q.query.id;
        if (!gameId) return;
        st.query(
          "SELECT player1,player2,active,cell1,cell2,cell3,cell4,cell5,cell6,cell7,cell8,cell9 FROM games WHERE id=? AND (player1=? OR player2=?)",
          [gameId, username, username],
          (result, err) => {
            if (err) {
              //not now
              res.end("");
              return;
            }
            if (result.length == 1) {
              let gameStatus = {
                id: gameId,
                player1: result[0].player1,
                player2: result[0].player2,
                active: result[0].active[0] == 1,
                board: [
                  result[0].cell1,
                  result[0].cell2,
                  result[0].cell3,
                  result[0].cell4,
                  result[0].cell5,
                  result[0].cell6,
                  result[0].cell7,
                  result[0].cell8,
                  result[0].cell9,
                ],
              };
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify(gameStatus));
            }
          }
        );
      } else if (path.startsWith("/play_cell")) {
        let cell = q.query.cell;
        let gameId = q.query.id;
        if (cell && gameId) {
          cell = parseInt(cell);
          gameId = parseInt(gameId);
          if (isNaN(cell) || isNaN(gameId) || cell < 0 || cell > 8) {
            res.end("");
            return;
          }
          st.query(
            "SELECT player1,player2,cell1,cell2,cell3,cell4,cell5,cell6,cell7,cell8,cell9 FROM games WHERE id=? AND active=1",
            [gameId],
            (result, err) => {
              if (err) {
                res.end("");

                return;
              }
              if (result.length == 1) {
                let player1 = result[0].player1;
                let player2 = result[0].player2;
                if (player1 == username || player2 == username) {
                  let xOrO = player1 == username ? 1 : 2;
                  let board = [
                    result[0].cell1,
                    result[0].cell2,
                    result[0].cell3,
                    result[0].cell4,
                    result[0].cell5,
                    result[0].cell6,
                    result[0].cell7,
                    result[0].cell8,
                    result[0].cell9,
                  ];
                  let countX = 0;
                  for (let i = 0; i < 9; i++) {
                    if (board[i] != 0) countX++;
                  }
                  let isXturn = countX % 2 == 0;
                  if (
                    board[cell] == 0 &&
                    ((isXturn && xOrO == 1) || (!isXturn && xOrO == 2))
                  ) {
                    st.query(
                      "UPDATE games SET cell" +
                        (cell + 1) +
                        "=" +
                        xOrO +
                        " WHERE id=?",
                      [gameId],
                      (result, err) => {
                        if (err) {
                          res.end("");
                          return;
                        }
                        res.writeHead(200, { "Content-Type": "text/plain" });
                        res.end("ok");
                      }
                    );
                  } else {
                    res.end("ooops");
                    return;
                  }
                }
              } else {
                res.end("ooops");
                return;
              }
            }
          );
        } else {
          res.end();
          return;
        }
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
  let flippedBoard = {};
  if (typeof state == "string") {
    state = JSON.parse(state);
  }
  for (let key in state) {
    flippedBoard[79 - key] = state[key];
  }
  return JSON.stringify(flippedBoard);
}

//PREVIOUS CODE

// let http = require('http');
// let url = require('url');
// let st = require('./server_tools');
// let mysql = require('mysql');

// http.createServer((req,res)=>{
//     let q = url.parse(req.url, true);
//     let path = q.pathname;
//     if(path.startsWith("/api")){
//         path = path.substring(4);
//         let username = q.query.username;
//         let password = q.query.password;
//         if(username && password){
//             if(path.startsWith("/signup")){
//                 st.query("INSERT INTO users (username, password) VALUES (?,?)", [username,password], (result, err)=>{
//                     if(err){
//                         res.writeHead(200, {'Content-Type':'text/plain'});
//                         res.end("taken");
//                     }else{
//                         res.writeHead(200, {'Content-Type':'text/plain'});
//                         res.end("ok");
//                     }
//                 });
//             }else if(path.startsWith("/login")){
//                 validateUser(username, password, (success)=>{
//                     if(success){
//                         res.writeHead(200, {'Content-Type':'text/plain'});
//                         res.end("ok");
//                     }else{
//                         res.writeHead(200, {'Content-Type':'text/plain'});
//                         res.end("invalid");
//                     }
//                 });
//             // }else if(path.startsWith("/send")){
//             //     validateUser(username, password, (success)=>{
//             //         if(success){
//             //             if(req.method == "POST"){
//             //                 st.readPostBody(req, (body)=>{
//             //                     if(body){
//             //                         st.query("INSERT INTO messages(sender,message) VALUES (?,?)",[username, body], (result)=>{
//             //                             console.log(result);
//             //                             res.writeHead(200, {'Content-Type':'text/plain'});
//             //                             res.end("yep...");
//             //                         });

//             //                     }else{

//             //                     }
//             //                 });

//             //             }
//             //         }
//             //     });
//             // }else if(path.startsWith("/pull")){
//             //     validateUser(username, password, (success)=>{
//             //         if(success){
//             //             let lastIdString = q.query.id;
//             //             if(lastIdString){
//             //                 let lastId = parseInt(lastIdString);
//             //                 if(isNaN(lastId)){
//             //                     res.writeHead(400, {'Content-Type':'text/plain'});
//             //                     res.end();
//             //                     return;
//             //                 }
//             //                 st.query("SELECT id,sender,message FROM messages WHERE id>?",[lastId],(result)=>{
//             //                     res.writeHead(200, {'Content-Type':'application/json'});
//             //                     res.end(JSON.stringify(result));
//             //                 },res);
//             //             }
//             //         }
//             //     });
//             // }
//             }else{
//                 res.writeHead(400, {'Content-Type':'text/plain'});
//                 res.end();
//             }
//         }
//     }else{
//         st.serveStaticFile(q.pathname, res);
//     }
// }).listen(8080);

// function validateUser(username, password, callback){
//     st.query("SELECT COUNT(*) AS count FROM users WHERE username=? AND BINARY password=?", [username, password], (result, err)=>{
//         callback (result[0].count == 1);
//     });
// }
