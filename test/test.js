var mysql = require('mysql');

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "bses10302",
  database: "test"
});
let res;
function sqlcb(callback){
  con.connect(function(err) {
    if (err) throw err;
    //Select all customers and return the result object:
    con.query("SELECT * FROM subject", function (err, result, fields) {
      if (err) throw err;
      // console.log(result);
      callback(result.length)
      
    });
  });
}
sqlcb(function(callback){
  console.log(callback)
  res = callback
})
console.log(res)
