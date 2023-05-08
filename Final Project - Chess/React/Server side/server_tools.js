let fs = require('fs');
let mysql = require('mysql');

const connectionParameters = {
    host: "localhost",
    user: "root",
    password: "Shadow13#!",
    database: "my_db"
};

exports.serveStaticFile = function(filename, res) {
    //let filename = q.pathname;
    if (filename == "/") {
        filename = "/index.html";
    }
    let readStaticFile = function (ct) {
        fs.readFile("." + filename, function (err, data) {
            if (!err) {
                res.writeHead(200, { 'Content-Type': ct });
                return res.end(data);
            } else {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                return res.end();
            }
        });
    };

    let extToCT = {
        ".html": "text/html",
        ".css": "text/css",
        ".js": "application/javascript",
        ".jpg": "image/jpeg"
    };

    let indexOfDot = filename.lastIndexOf(".");
    if (indexOfDot == -1) {
        console.log('oops not dot');
        res.writeHead(400, { 'Content-Type': 'text/html' });
        return res.end();
    } else {
        let ext = filename.substring(indexOfDot);
        let ct = extToCT[ext];
        if (!ct) {
            console.log('extension does not exist');
            res.writeHead(400, { 'Content-Type': 'text/html' });
            return res.end();
        } else {
            readStaticFile(ct);
        }
    }
};


exports.readPostBody = function(req, listener){
    let body = '';
    req.on('data', function(data){
        body += data;
    });
    req.on('end', function(){
        listener(body);
    });
};


exports.query = function(sql, params, callback, res){
    let conn = mysql.createConnection(connectionParameters);
    conn.connect((err)=>{
        if(err){
            console.log(err);
            res.writeHead(500, {'Content-Type':'text/plain'});
            res.end();
        }else{
            conn.query(sql,params,(err,result,fields)=>{
                if(err){
                    callback(result, err, res); // pass response object to callback
                }else{
                    callback(result, err, res); // pass response object to callback
                }
            });
        }
    });
};
