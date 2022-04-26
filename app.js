const express = require('express');
const { json } = require('express/lib/response');
const app = express()
const server = require('http').createServer(app);
const WebSocket = require('ws');
const mysql = require('mysql');
const { Socket } = require('dgram');
const url = require('url');
const { clone } = require('nodemon/lib/utils');
const { contentDisposition } = require('express/lib/utils');
const res = require('express/lib/response');

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
var game_round =0;
//websocket server
const wss = new WebSocket.Server({ server:server });
let CLIENTS = []
wss.on('connection', function connection(ws) {
  console.log('A new client Connected!');
  ws.send('Welcome New Client!');
  //接收client訊息後依obj的json內容進function做處理
  ws.on('message', function incoming(message) {
    let obj = JSON.parse(message);
    console.log(obj)
    
    check_in(obj,CLIENTS,ws);
    all_machine(obj,CLIENTS,ws);
    access(obj,ws)
    new_access(obj,ws)
    get_subject(obj,ws)
    chang_subject(obj,ws)
    game_start(obj,ws,wss)
    game_info_to_machine(obj,wss,ws)



    let clients = wss.clients  //取得所有連接中的 client
    clients.forEach(client => {
         client.send("ininder")  // 發送至每個 client
         
    })
    console.log(CLIENTS.length);
  });
//裝置關閉後splice CLIENTS
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
    ws.send(CLIENTS.length-1);
    console.log(CLIENTS.length-1)
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
//取得主題
function get_subject(obj,ws){
  if(obj.get_subject == true){
      let sql = "SELECT * FROM subject";
      con.query(sql,function(err,result){
        if (err) throw err;
        ws.send(JSON.stringify(result))
      });
  }
}
//更改主題
function chang_subject(obj,ws){
  if(obj.chang_subject == true){
    if(obj.insert == true){
      var sql = "INSERT INTO subject (subject, level,en,ch) VALUES ('"+obj.subject+"','"+ obj.level+"','"+obj.en+"','"+obj.ch+"')";
      con.query(sql,function(err){
        if (err) throw err;
        console.log("insert success!");
        ws.send("insert success!");
      });
   }else if(obj.update == true){
    var sql = "UPDATE subject SET en = '"+ obj.en +"', ch = '"+ obj.ch +"', level = '"+ obj.level +"', subject = '"+ obj.subject +"' WHERE id = '"+obj.id+"'";
    con.query(sql, function (err) {
      if (err) throw err;
      console.log("update success!");
      ws.send("update success!");
    });
   }
  }
}
//手機傳送info給server
function game_start(obj,ws,wss){
  if(obj.game_start ==true){
    if(obj.play_output == 0 && obj.play_input ==0){
      ws.send("error using sound and mic")
    }else{
      // var sql = "INSERT INTO playing_list (subject, round ,time,unix_time,play_output,play_input,play_model,finish) VALUES ('"+obj.subject+"','"+ obj.round+"','"+obj.time+"','"+obj.unix_time+"','"+obj.play_output+"','"+obj.play_input+"','"+obj.play_model+"',0)";
      var sql = "UPDATE playing_list SET subject = '"+ obj.subject +"',round = '"+ obj.round +"',time= '"+ obj.time +"',unix_time = '"+ obj.unix_time +"',play_output = '"+ obj.play_output +"',play_input = '"+ obj.play_input +"',play_model = '"+ obj.play_model +"',finish= "+ obj.finish +" WHERE id = '1'";
      console.log(sql)
      con.query(sql, function (err) {
        if (err) throw err;
         console.log("insert success!");
        ws.send("insert success!");
        let clients = wss.clients  //取得所有連接中的 client
        clients.forEach(client => {
          client.send("game_is_star")  // 發送至每個 client
        })
      });
    }
  }
}
function game_info_to_machine(obj,wss,ws){
  if(obj.game_info_to_machine == true){
    function get_subjec_info(callback){
      let sql = "SELECT * FROM subject";
      con.query(sql,function(err,result){
        if (err) throw err;
        return callback(JSON.stringify(result)) 
      });
    }     
    get_subjec_info(function(result_s){
      console.log(result_s)
      let sql = "SELECT * FROM playing_list";
      con.query(sql,function(err,result){
        if (err) throw err;
        console.log(result_s)
        let result_l =JSON.stringify(result);
        let row =JSON.parse(result_l)
        if(game_round < row[0].round){//round
          //test
          game_round++
            let temp ={
              ws:ws,
              device:"machin",
              id:"20"
            }
            CLIENTS.push(temp)
            //
            ws.send(CLIENTS.length)
            if(obj.play_model == 0){
              let data ={
                subject : obj.subject,
                switch : 1,
                round : game_round,
                time : obj.time,
                play_output : obj.play_output,
                play_input : obj.play_input,
                play_model : obj.play_model,
                finish : 0
              }
              let clients = wss.clients  //取得所有連接中的 client
              clients.forEach(client => {
                client.send(JSON.stringify(data))  // 發送至每個 client
              })

            }else if(obj.play_model == 1){
              
              CLIENTS.forEach(clients => {
                let i = CLIENTS.length
                if(i/obj.round == 0)

                if(ws.CLIENTS.length !=0){


                  let data ={
                    subject : obj.subject,
                    switch : 1,
                    round : game_round,
                    time : obj.time,
                    play_output : obj.play_output,
                    play_input : obj.play_input,
                    play_model : obj.play_model,
                    finish : 0
                  }
                  
                });
              }
              let data ={
                subject : obj.subject,
                switch : 1,
                round : game_round,
                time : obj.time,
                play_output : obj.play_output,
                play_input : obj.play_input,
                play_model : obj.play_model,
                finish : 0
              }
              let clients = wss.clients  //取得所有連接中的 client
              clients.forEach(client => {
                client.send(JSON.stringify(data))  // 發送至每個 client
              })


            }


          
          
        }else{
          let clients = wss.clients  //取得所有連接中的 client
          game_round =0;
          let data ={
            finish : 1
          }
          clients.forEach(client => {
          client.send(JSON.stringify(data))  // 發送至每個 client
          })
        }

      });
     
      if(game_round < obj.game_round){
        let clients = wss.clients  //取得所有連接中的 client
        clients.forEach(client => {
          client.send(result)  // 發送至每個 client
        })
      }
    })
  }
}

app.get('/', (req, res) => res.send('Hello World!'))
server.listen(3000, () => console.log(`Lisening on port :3000`))
