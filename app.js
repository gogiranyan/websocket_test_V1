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
let pk_random =[]
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
    machin_info_to_server(obj,ws,wss)
    test_sql()


    let clients = wss.clients  //取得所有連接中的 client
    clients.forEach(client => {
         client.send("ininder")  // 發送至每個 client
         
    })
    console.log("CLIENTS: "+CLIENTS.length);
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
      device_id:obj.device_id,
      device_round:0
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
      var sql = "UPDATE playing_list SET level = '"+ obj.level +"', subject = '"+ obj.subject +"',round = '"+ obj.round +"',time= '"+ obj.time +"',unix_time = '"+ obj.unix_time +"',play_output = '"+ obj.play_output +"',play_input = '"+ obj.play_input +"',play_model = '"+ obj.play_model +"',finish= "+ obj.finish +" WHERE id = '1'";
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
    }//creat random
    if(obj.play_model == 1){
      let round = obj.round/CLIENTS.length
      console.log(round)
      console.log(obj.round)
      console.log(CLIENTS.length)
      // let cl_length = CLIENTS.length
      let cl_length = CLIENTS.length
      for(i = 0;i<round;i++){
        let temp =[]
        for(k=0;k<cl_length;k++){
          temp.push(k);
        }
        shuffle(temp);
        for(k=0;k<cl_length;k++){
          pk_random.push(temp[k])
        }
      }
      console.log("random_round" + JSON.stringify(pk_random))
      console.log("random_round" + CLIENTS.length)
    }    
    game_info_to_machine()
  }
}
function game_info_to_machine(obj,wss,ws){
    function get_subjec_info(callback){
      let sql = "SELECT * FROM subject where subject ='" + obj.subject+"'";
      con.query(sql,function(err,result){
        if (err) throw err;
        return callback(JSON.stringify(result)) 
      });
    }     
    get_subjec_info(function(result_s){
      let result_subject = JSON.parse(result_s)
      console.log(result_s)
      console.log(result_s.length)
      let sql = "SELECT * FROM playing_list";
      con.query(sql,function(err,result){
        if (err) throw err;
        console.log(result_s)
        let result_list =JSON.stringify(result);
        let row =JSON.parse(result_list)
        if(game_round < row[0].round){//round
          //test=======
          console.log("obj.round = : ",obj.round)
          game_round++
            let temp ={
              ws:ws,
              device:"machin",
              id:"20"
            }
            CLIENTS.push(temp)
            //=========
            ws.send(CLIENTS.length)
            let random_subject = getRandomInt(result_subject.length)
            if(obj.play_model == 0){//----moodle = 0
              console.log("radoms"+random_subject)
                let data ={
                  subject : obj.subject,
                  switch : 1,
                  round : game_round,
                  time : obj.time,
                  en : result_subject[random_subject].en,
                  play_output : obj.play_output,
                  play_input : obj.play_input,
                  play_model : obj.play_model,
                  finish : 0
                }
                let clients = wss.clients  //取得所有連接中的 client

                clients.forEach(client => {
                  client.send(JSON.stringify(data))  // 發送至每個 client
                })
            }else if(obj.play_model == 1){//----model =1
              console.log("obj.round = : ",obj.round)
              console.log(CLIENTS.length)
              let data ={
                subject : obj.subject,
                switch : 1,
                round : game_round,
                time : obj.time,
                en : result_subject[random_subject].en,
                play_output : obj.play_output,
                play_input : obj.play_input,
                play_model : obj.play_model,
                finish : 0
              }
              // let clients = CLIENTS[pk_random[game_round]].ws//取得所有連接中的 client
              let clients = CLIENTS[0].ws//取得所有連接中的 client
              clients.send(JSON.stringify(data))
              console.log(JSON.stringify(data))
              console.log("client.lenth: "+CLIENTS.length)

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
  function getRandomInt(max) {
    return Math.floor(Math.random() * max);
  }
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function machin_info_to_server(obj,ws,wss){
    if(obj.machin_info_to_server == true){
      if(obj.play_model == 0){
        var count = 0
        CLIENTS.forEach(e => {
          if(e.device_round == game_round){
            count+=1;
          }
        });
        if(CLIENTS.length == count){

        }
      }

    
    let sql ="INSERT INTO history (device, subject, is_right, en_result, unix_time, play_output, play_input, play_model,device_round) VALUES ('"+obj.device+"','"+ obj.subject+"','"+ obj.is_right+"','"+ obj.en_result+"','"+ obj.unix_time+"','"+ obj.play_output+"','"+ obj.play_input+"','"+ obj.play_model+"','"+ obj.device_round+"')";
    con.query(sql,function(err,result){
      if(err)throw err;
      console.log("update success!");
    })
    let temp={
      ws:ws,
      device:"101",
      device_round:obj.device_round,
    }
    CLIENTS.push(temp)
    console.log(CLIENTS[CLIENTS.findIndex(e=>{return e.ws == ws})].device_round+=1)
    console.log("deviec round:"+CLIENTS[CLIENTS.findIndex(e=>{return e.ws == ws})].device_round)
    console.log("array index: "+CLIENTS.findIndex(e=>{return e.ws == ws}))
  }
}
function get_history(obj,ws,wss){
  if(obj.get_history == true){
    let sql = "SELECT * FROM playing_list";
  }
}
function test_sql(){
  console.log("randmmmm: "+average_random(6,6))//number,rounds
  function callback_playingList(callback){
    let sql = "SELECT * FROM playing_list WHERE id = 1";
    con.query(sql,function(err,result){
      if (err) throw err;
      return callback(JSON.stringify(result)) 
    });
  }
  callback_playingList(function(result_playList){
    let p_list = JSON.parse(result_playList)
    let sql ="SELECT * FROM subjcet";
    con.pause(sql,function(err,result_subjct){
      let data ={

      }
    })

  })

}
function average_random(number,rounds){//round =1
  let round = rounds/number;
  let random_round =[]
  console.log("round:"+round)
  if(round>1 && round%1 != 0){
    console.log("1.111")
    for(let i = round;i > 1;i--){
      let temp =[]
      for (let k = 0; k < number; k++) {
        temp.push(k)
      }
      shuffle(temp)
      for (let k = 0; k < number; k++) {
        random_round.push(temp[k]);
      }
    }
    let temp=[]
    for (let k = 0; k < number; k++) {
      temp.push(k)
    }
    shuffle(temp)
    for(let i = 0;i<(rounds-number*parseInt(round));i++){
      random_round.push(temp[i])
    }
    shuffle(random_round)
  }else if(round %1 === 0){
    console.log("1.0")
    for (let i = round; i > 0; i--) {
      for (let k = 0; k < number; k++) {
        random_round.push(k)
      }
    }
    shuffle(random_round)
    console.log("ddd"+random_round)
  }else if(round<1){
    console.log("0.9")
    let temp=[]
    for (let k = 0; k < number; k++) {
      temp.push(k)
    }
    shuffle(temp)
    for(let i = 0;i<rounds;i++){
      random_round.push(temp[i])
    }
  }
  return random_round
}


function server_to_machine(){
  // let sql = "SELECT * FROM playing_list WHERE id = 1";
  // con.query(sql,function(err,p_list){
  //   let p_list = JSON.stringify(p_list)
  //   if(err) throw err;
  //   let sql = ""
  // })

}

 
//增加學校與姓名
app.get('/', (req, res) => res.send('Hello World!'))
server.listen(3000, () => console.log(`Lisening on port :3000`))
