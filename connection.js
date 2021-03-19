const http = require('http');
const Mongo = require('mongodb');
const mongo_username = process.env.MONGO_USERNAME;
const mongo_password = process.env.MONGO_PASSWORD;
const cluster_url = `mongodb+srv://${mongo_username}:${mongo_password}@cluster0-bot1.vffbm.mongodb.net/dcb1?retryWrites=true&w=majority
`;
const cluster = new Mongo.MongoClient(cluster_url, {
	useNewUrlParser: true,
	useUnifiedTopology: true
});
	http
		.createServer(function(req, res) {
			res.write("I'm alive");
			res.end();
		})
		.listen(8080);
async function init(){
  await cluster.connect()
}
init()
module.exports=cluster