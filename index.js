const Discord = require('discord.js');
const cluster=require("./connection.js");
const { registerFont } = require('canvas');
const bot = new Discord.Client();
const token = process.env.BOT_TOKEN_DISCORD;
const {handleMessage,setCluster}=require("./messageHandler.js")
setCluster(cluster)
async function main(){
  bot.login(token)
  bot.on("message",msg=>{
    try{
    handleMessage(msg,bot,cluster)
    }catch(err){
      console.log("error occured while handeling message",err)
    }
  })
}
main();
registerFont('./fonts/COMIC.TTF', { family: 'Comic Sans' });