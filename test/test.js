// var mysql = require('mysql');

// var con = mysql.createConnection({
//   host: "localhost",
//   user: "root",
//   password: "bses10302",
//   database: "test"
// });
// let res;
// function sqlcb(callback){
//   con.connect(function(err) {
//     if (err) throw err;
//     //Select all customers and return the result object:
//     con.query("SELECT * FROM playing_list", function (err, result, fields) {
//       if (err) throw err;
//       // console.log(result);
//       let random_subject_array = result[0].random_subject
//       callback(JSON.parse(random_subject_array))
      
//     });
//   });
// }
// sqlcb(function(callback){
//   console.log(callback[0])
//   res = callback
// })
let d = new String('dd')
console.log(d.toString())