function machin_info_to_server(obj,ws,wss){
    if(obj.machin_info_to_server == true){
    let data={
      device: obj.device,
      subject: obj.subject,
      is_right:obj.right,
      en_result:obj.en_result,
      unix_time:obj.unix_time,
      play_model:obj.play_model,
      play_input:obj.play_input,
      play_output:obj.play_output,
      device_round:obj.device_round
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
function model_0(obj){
    if(obj.device_round < game_round){
        let sql = "SELECT playing_list.subject FROM subject where subject ='" + obj.subject+"'";
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

    }
} 
function sand_to_machin(obj){
    if(obj.play_model == 0){
        
    }else if(obj.play_model == 1){

    }
}
