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
  password: "bses10302"
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
  console.log(typeof(ws))
  
  ws.on('message', function incoming(message) {
  // console.log('received: %s', message);
    console.log(message);
    let obj = JSON.parse(message);
    if(obj.login == true){
      let temp ={
        ws:ws,
        device:obj.device,
        id:obj.id
      }
      CLIENTS.push(temp);
      console.log(CLIENTS)

    }



    if(obj.device === 'machine' && obj.info == true){
      let machine
    }else if(obj.device === 'phone'){
      
    }
    console.log(obj);


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
    console.log(CLIENTS)
  })
  
});

app.get('/', (req, res) => res.send('Hello World!'))

server.listen(3000, () => console.log(`Lisening on port :3000`))

