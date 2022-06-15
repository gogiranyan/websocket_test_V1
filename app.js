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
const { restart } = require('nodemon');
const { copyFileSync } = require('fs');

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
let CLIENTS = [];
let pk_random =[];
let machine_id =0;
wss.on('connection', function connection(ws) {
  console.log('A new client Connected!');
  ws.send('Welcome New Client!');
  //接收client訊息後依obj的json內容進function做處理
  ws.on('message', function incoming(message) {
    let obj = JSON.parse(message);
    console.log(obj)
    //test=======
    console.log("obj.round = ",obj.round)
      let temp ={
        device_round: 0,
        device_score: 0,
        id:machine_id,
        ws:ws
      }
      console.log(machine_id++)
    CLIENTS.push(temp)
    //=========

    check_in(obj,CLIENTS,ws);
    all_machine(obj,CLIENTS,ws);
    access(obj,ws)
    new_access(obj,ws)
    get_subject(obj,ws)
    chang_subject(obj,ws)
    game_start(obj,ws,wss)
    machin_info_to_server(obj,ws,wss)
    // send_to_machine(CLIENTS,ws,wss)
    get_playingList(obj,ws,wss)
    get_detail(obj,ws,wss)


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
      //只能先單一遊玩
      var sql = "UPDATE playing_list SET level = '"+ obj.level +"', subject = '"+ obj.subject +"',round = '"+ obj.round +"',time= '"+ obj.time +"',unix_time = '"+ obj.unix_time +"',play_output = '"+ obj.play_output +"',play_input = '"+ obj.play_input +"',play_model = '"+ obj.play_model +"', max_score = '"+obj.max_score+"',finish= '0' WHERE id = '1'";
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
    //creat random in database includ random subject and rnadom machine.
    function callback_playingList(callback){
      let sql = "SELECT * FROM playing_list WHERE id = 1";
      con.query(sql,function(err,result){
        if (err) throw err;
        return callback(JSON.stringify(result)) 
      });
    }
    callback_playingList(function(result_playList){
      let p_list = JSON.parse(result_playList)
      console.log("inplist: "+p_list[0].subject)
      let sql ="SELECT * FROM subject WHERE subject = '"+p_list[0].subject+"'";
      con.query(sql,function(err,result_subjct){
        if(err) throw err;
        console.log(JSON.stringify(result_subjct))
        let data =JSON.stringify(average_random(result_subjct.length,p_list[0].round))
        let random_machine = JSON.stringify(average_random(CLIENTS.length,p_list[0].round))
        sql = "UPDATE playing_list SET random_subject = '"+data+"', random_machine ='"+random_machine+"'"//++datas
        con.query(sql,function(err,result){
          if(err) throw err;
          console.log("update random_subject success");
        })
      })
    })
    send_to_machine(CLIENTS,ws,wss)
  }
}
//洗牌
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
//machine回傳資料
let machine_count =0
function machin_info_to_server(obj,ws,wss){
    if(obj.machin_info_to_server == true){
      if(obj.play_model == 0){//model 0
        //計算是否每台都有登錄了
        CLIENTS.forEach(e => {
          if(e.device_round == game_round){
            machine_count++;
          }
        });
        if(CLIENTS.length == machine_count){
          machine_count = 0;
          game_round++
        }
    }else if(obj.play_model == 1){//model 1
      if(obj.is_right == 1){
        machine_count++
      }else if (obj.is_right == 0){
        machine_count++
      }
      //如果都有防禦跟攻擊都有回傳的話進下一回合
      if(machine_count === 2){
        game_round++;
        machine_count=0
      }    
    }
    let sql ="INSERT INTO history (device, subject, is_right, en_result, unix_time, play_output, play_input, play_model,device_round,playing_list_id) VALUES ('"+obj.device+"','"+ obj.subject+"','"+ obj.is_right+"','"+ obj.en_result+"','"+ obj.unix_time+"','"+ obj.play_output+"','"+ obj.play_input+"','"+ obj.play_model+"','"+ obj.device_round+"','1')";
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
    ws.send(JSON.stringify(CLIENTS))
  }
}
//傳data給machine
function send_to_machine(CLIENTS ,ws,wss){
  function callback_playingList(callback){
    let sql = "SELECT * FROM playing_list WHERE id = 1";
    con.query(sql,function(err,result){
      if (err) throw err;
      return callback(JSON.stringify(result)) 
    });
  }
  callback_playingList(function(result_playList){
    let temp = JSON.parse(result_playList)
    let p_list =temp[0]
    let sql ="SELECT * FROM subject WHERE subject = '"+p_list.subject+"' AND level = '"+p_list.level+"'";
    con.query(sql,function(err,result_subjct){
      if(err) throw err;
      let data = {
        subject: p_list.subject,
        round: CLIENTS[CLIENTS.findIndex(e=>{return e.ws == ws})].device_round,
        time: p_list.time,
        en: result_subjct[JSON.parse(p_list.random_subject)[CLIENTS[CLIENTS.findIndex(e=>{return e.ws == ws})].device_round]].en,
        play_output : p_list.play_output,
        play_input : p_list.play_input,
        play_model : p_list.play_model,
        device_score: CLIENTS[CLIENTS.findIndex(e=>{return e.ws == ws})].device_score, 
        finish : 0,
        max_score:p_list.max_score
      }
      if(data.play_model == 0){//如果 model = 0
        if(data.round < p_list.round){
          let clients = wss.clients;
          clients.forEach(client =>{
            client.send(JSON.stringify(data))
          })
        }else{
          let clients = wss.clients;
          clients.forEach(client =>{
            client.send("finish")
          })
        } 
      }else if(data.play_model == 1){// 如果 model =1
        if(data.device_score < p_list.max_score){
          let clients = wss.clients;
          console.log("model 1: "+ JSON.parse(p_list.random_machine)[game_round])
          console.log("random round:"+game_round)
          CLIENTS[JSON.parse(p_list.random_machine)[game_round]].ws.send(JSON.stringify(data))//?
        }else{
          let clients = wss.clients;
          clients.forEach(client =>{
            client.send("finish")
          })
        }
      }
    })
  })
}
//平均分配亂數 
function average_random(number,rounds){//number,rounds
  let round = rounds/number;
  let random_round =[]
  if(round>1 && round%1 != 0){
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
    for (let i = round; i > 0; i--) {
      for (let k = 0; k < number; k++) {
        random_round.push(k)
      }
    }
    shuffle(random_round)
  }else if(round<1){
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
//取得資料
function get_playingList(obj,ws,wss){
  if(obj.get_playingList == true){
    let sql = "SELECT * FROM playing_list WHERE account = '"+obj.account+"'";
    con.query(sql,function(err,result){
      if(err) throw err;
      ws.send(JSON.stringify(result))
  })
  }
}

function get_detail(obj,ws,wss){
  if(obj.get_detail == true){
    let sql = "SELECT * FROM history WHERE playing_list_id = '"+obj.id+"'";
    con.query(sql,function(err,result){
      if(err) throw err;
      let devices =[]
      result.forEach(result_e => {
        if(devices.findIndex(e=>{return e.device_id == result_e.device})==-1){
            let device = {
            device_id:result_e.device,
            right_pa:0,
            score:0,
            rank:0,
            wrong_info:[]
          }
          devices.push(device)
        }
        if(result_e.is_right == 1){
          devices[devices.findIndex(e=>{return result_e.device == e.device_id})].score++;
        }
        re
        
        
      });
    })
  }
}

//增加學校與姓名
app.get('/', (req, res) => res.send('Hello World!'))
server.listen(3000, () => console.log(`Lisening on port :3000`))
