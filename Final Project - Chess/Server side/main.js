let http = require('http');
let url = require('url');
let st = require('./server_tools');
let mysql = require('mysql');

http.createServer((req,res)=>{
    let q = url.parse(req.url, true);
    let path = q.pathname;
    if(path.startsWith("/api")){
        path = path.substring(4);
        let username = q.query.username;
        let password = q.query.password;
        if(username && password){
            if(path.startsWith("/signup")){
                st.query("INSERT INTO users (username, password) VALUES (?,?)", [username,password], (result, err, res)=>{
                    if(err){
                        res.writeHead(200, {'Content-Type':'text/plain'});
                        res.end("taken");
                    }else{
                        res.writeHead(200, {'Content-Type':'text/plain'});
                        res.end("ok");
                    }
                }, res);
            }else if(path.startsWith("/login")){
                validateUser(username, password, (success)=>{
                    if(success){
                        res.writeHead(200, {'Content-Type':'text/plain'});
                        res.end("ok");
                    }else{
                        res.writeHead(200, {'Content-Type':'text/plain'});
                        res.end("invalid");
                    }
                });
            // }else if(path.startsWith("/send")){
            //     validateUser(username, password, (success)=>{
            //         if(success){
            //             if(req.method == "POST"){
            //                 st.readPostBody(req, (body)=>{
            //                     if(body){
            //                         st.query("INSERT INTO messages(sender,message) VALUES (?,?)",[username, body], (result)=>{
            //                             console.log(result);
            //                             res.writeHead(200, {'Content-Type':'text/plain'});
            //                             res.end("yep...");
            //                         });
                                    
            //                     }else{

            //                     }
            //                 });


                            
            //             }
            //         }
            //     });
            // }else if(path.startsWith("/pull")){
            //     validateUser(username, password, (success)=>{
            //         if(success){
            //             let lastIdString = q.query.id;
            //             if(lastIdString){
            //                 let lastId = parseInt(lastIdString);
            //                 if(isNaN(lastId)){
            //                     res.writeHead(400, {'Content-Type':'text/plain'});
            //                     res.end();
            //                     return;
            //                 }
            //                 st.query("SELECT id,sender,message FROM messages WHERE id>?",[lastId],(result)=>{
            //                     res.writeHead(200, {'Content-Type':'application/json'});
            //                     res.end(JSON.stringify(result));
            //                 },res);
            //             }
            //         }
            //     });
            // }
            }else{
                res.writeHead(400, {'Content-Type':'text/plain'});
                res.end();
            }
        }
    }else{
        st.serveStaticFile(q.pathname, res);
    }
}).listen(8080);


function validateUser(username, password, callback){
    st.query("SELECT COUNT(*) AS count FROM users WHERE username=? AND BINARY password=?", [username, password], (result, err)=>{
        callback (result[0].count == 1);
    });
}