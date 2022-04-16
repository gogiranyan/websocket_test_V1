const express = require('express')
const app = express();
const server =require('http').createServer(app);
const WebSocket = require('ws')
const wss = new WebSocket.Server({server:server});

wss.on('connection',function connection(ws){
    console.log('client Connected!');

    ws.send('Welcome Clinet');

    ws.on('message', function incoming(message){
        console.log('received: %s', message);
        ws.send('Got ur msg its: '+ message);
    })

})