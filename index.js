const Discord = require('discord.js');
require("./connection.js")
const bot = new Discord.Client();
const token = process.env.BOT_TOKEN_DISCORD;
const handleMessage=require("./messageHandler.js")
async function main(){
  bot.login(token)
  bot.on("message",msg=>{
    try{
    handleMessage(msg,bot)
    }catch(err){
      console.log("error occured while handeling message",err)
    }
  })
}
main();