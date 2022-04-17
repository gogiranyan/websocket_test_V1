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

wss.on('connection', function connection(ws) {
  console.log('A new client Connected!');
  ws.send('Welcome New Client!');

  ws.on('message', function incoming(message) {
  // console.log('received: %s', message);
    let obj = JSON.parse(message);
    if(obj.device === 'machine' && obj.info == ture){
      let machine
    }else if(obj.device === 'phone'){
      
    }

    console.log(JSON.parse(message));
    console.log(obj);


  });

  ws.addEventListener('close', function(event) {
    console.log(event)
  })
  ws.onclose = (event) => {
    console.log('close connection');
    
    var code = event.code;
  var reason = event.reason;
  var wasClean = event.wasClean;
  console.log(code);
    console.log(reason);
    console.log(wasClean)
  }
  ws.on('close', function incoming(message) {
      console.log(message);
  
    });

});

app.get('/', (req, res) => res.send('Hello World!'))

server.listen(3000, () => console.log(`Lisening on port :3000`))

