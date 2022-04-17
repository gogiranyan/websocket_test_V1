const express = require('express');
const { json } = require('express/lib/response');
const app = express()
const server = require('http').createServer(app);
const WebSocket = require('ws');
const mysql = require('mysql');
const { Socket } = require('dgram');
const url = require('url');

//connect mysql---------------
var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "bses10302",
  database: "test"

});
con.connect(function(err) {
  if (err) throw err;
  console.log("Server is Connected!");
});

const wss = new WebSocket.Server({ server:server });
let CLIENTS = []
wss.on('connection', function connection(ws) {
  console.log('A new client Connected!');
  ws.send('Welcome New Client!');
  
  ws.on('message', function incoming(message) {
    let obj = JSON.parse(message);
    console.log(obj)
    
    if(obj.login == true){
      let temp ={
        ws:ws,
        device:obj.device,
        id:obj.id
      }
      CLIENTS.push(temp)
    }
    check_in(obj,CLIENTS,ws);
    all_machine(obj,CLIENTS,ws);
    access(obj,ws)
    new_access(obj,ws)

  });

  ws.addEventListener('close', function(event) {
    console.log('client end');
    let i = 0; 
    CLIENTS.forEach(e=>{
	    if(e.ws === ws){
        CLIENTS.splice(i, 1);
      } 
      i++
    })
    i = 0
  })
  
});
//登陸裝置
function check_in(obj,CLIENTS,ws){
  if(obj.check_in == true){
    let temp ={
      ws:ws,
      device:obj.device,
      id:obj.id
    }
    CLIENTS.push(temp)
  }
}
//確認扣除手機後連線中的機器
function all_machine(obj,CLIENTS,ws){
  if(obj.all_machine == true){
    ws.send(CLIENTS.length);
    console.log('all_machine'+CLIENTS.length-1)
  }
}
//手機帳號登陸
function access(obj,ws){
  if(obj.access == true){
    con.query("SELECT * FROM access", function (err, result, fields) {
      if (err) throw err;
      let i = 'false'
      result.forEach(e=>{
        if(e.account == obj.account && e.password === obj.password){
          i = 'true'
        }
      })
      ws.send(i);
      console.log('access' + i)
    });
  }
}
//新增手機帳號
function new_access(obj,ws){
  if(obj.new_access == true){
    con.query("SELECT * FROM access", function (err, result, fields) {
      if (err) throw err;
      let i = 'false'
      result.forEach(e=>{
        if(e.account == obj.account){
          i = 'true'
        }
      })
      console.log('in'+i)
      if(i =='false'){
        var sql = "INSERT INTO access (account, password) VALUES ('"+obj.account+"','"+ obj.password+"')";
         con.query(sql, function (err, result) {
          if (err) throw err;
      });
      i = 'true'
      }else{
        i = 'false'
      }
      ws.send(i);
      console.log('new_access: ' + i)
    });
  }
}






app.get('/', (req, res) => res.send('Hello World!'))

server.listen(3000, () => console.log(`Lisening on port :3000`))

