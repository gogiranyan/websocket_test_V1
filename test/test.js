let c=[]
let data ={
	ws:"1",
  round:"2"
}
c.push(data)
data ={
	ws:"3",
  round:"2"
}
c.push(data)
data ={
	ws:"3",
  round:"2"
}
c.push(data)

let ws ={
    g: 20
}
data ={
	ws:"3",
  round:"2",
  ws:ws
}
c.push(data)
console.log(JSON.stringify(c))
console.log(c.findIndex(object=>{return object.ws === "1"}))