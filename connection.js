const http = require('http');
const Mongo = require('mongodb');
const fs = require("fs")
const mongo_username = process.env.MONGO_USERNAME;
const mongo_password = process.env.MONGO_PASSWORD;
const cluster_url = `mongodb+srv://${mongo_username}:${mongo_password}@cluster0-bot1.vffbm.mongodb.net/dcb1?retryWrites=true&w=majority
`;
const cluster = new Mongo.MongoClient(cluster_url, {
	useNewUrlParser: true,
	useUnifiedTopology: true
});
let indexHTML
	http
		.createServer(function(req, res) {
      //console.log("req",req)
      if(!indexHTML){
      fs.readFile("./index.html","utf8",(err,data)=>{
			  res.write(data);
			  res.end();
        indexHTML=data
      })
      }else{
        res.write(indexHTML)
        res.end()
      }
		})
		.listen(8080);
async function init(){
  await cluster.connect()
  console.log("initialized")
}
console.log("initilizing")
init()
module.exports=cluster