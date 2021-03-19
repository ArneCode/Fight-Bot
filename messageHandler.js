//let actions=[{name:"punch",damageMin:3,damageMax:40},{name:"defend",damageMin},{name:"kick"}]
let heartAttackImgs=["heart-attack1.jpg","herzinfarkt2.png","herzinfarkt1.webp","herzinfarkt3.png","herzinfarkt4.png"]
const Discord=require("discord.js")
let types=require("./types.js")
let games={}
let cluster
module.exports={setCluster,handleMessage}
function setCluster(_cluster){
  cluster=_cluster
}
function handleMessage(msg,bot,cluster){
  let {content,author,member,channel}=msg
  content=content.toLowerCase()
  //console.log(content)
  if(msg.author.bot){
    return
  }
    console.log(content)
    
  //console.log(msg.content)
  let game=games[channel.id]
  if(game){
    let {players,turn}=game
    let nextTurn=(turn+1)%2
    let pIdx
    if(players[turn].id==author.id){
      pIdx=turn
    }else if(players[nextTurn]==author.id){
      pIdx=nextTurn
    }
    if(pIdx!=turn){
      return
    }
    let embed//=new Discord.MessageEmbed()
    //embed.setColor('#0099ff')
    if(game.typesSet<2){
    if(pIdx==turn){
      embed=new Discord.MessageEmbed()
      let player=players[pIdx]
      console.log(player.name,"chooses Type")
      if(content in types){
        let type=types[content]
      embed.setDescription(`${player.name} is now a ${type.name}`)
      embed.attachFiles(["./pics/type-pics/"+type.pic])
      embed.setImage("attachment://"+type.pic)
      channel.send(embed)
        player.type=type
        player.health=type.health
        type.init(player)
        game.typesSet++
        if(game.typesSet<2){
          embed.setTitle(`${players[nextTurn].name}, please chose your type`)
    embed.setDescription(`Possible types are ${Object.keys(types).join(", ")}`)
    channel.send(embed)
        }else{
          fight(players[nextTurn],channel)
        }
        turn=nextTurn
        game.turn=nextTurn
      }else{
        embed.setColor("#ff0000")
        embed.setTitle(`${content} is not a valid type`)
        embed.setDescription(`Valid types are: ${Object.keys(types).join(", ")}.`)
        channel.send(embed)
      }
      return
    }
    return
    }
    //console.log(players[turn].id,author.id,pIdx)
      //console.log("new turn",{players,pIdx,turn,content})
    if(pIdx==turn){
      //console.log("player entered")
      let player=players[pIdx]
      let other=players[(pIdx+1)%2]
      console.log("player",player.type,{pIdx,player})
      let {actions}=player.type
      if(!content in actions){
        if(content=="end"){
          channel.send("game ended")
          delete game[channel.id]
          //console.log("game after deletion",game)
        }
        return
      }
      embed=new Discord.MessageEmbed()
      if(Math.random()<=0.004){
        let img=heartAttackImgs.random()
        embed.setTitle(`${player.name} got a heart atack`)
        let filename="./pics/heart-attack/"+img
        embed.attachFiles([filename])//filename])
        embed.setImage("attachment://"+img)
        player.health=1
      }else{
        if(content in actions){
          let action = actions[content]
          action.act(action,{player,other,channel},embed)
          for(let act of player.repeatedActs){
            act(player,embed)
          }
          for(let act of other.repeatedActs){
            act(other,embed)
          }
        }else{
          return
        }
      }
      embed.addFields(players.map(p=>{
        return {
          name:p.name+":",
          inline:true,
          value:`\t${p.health}<:HP:821850786870198293>`
        }
      }))
      if(other.health<=0){
        channel.send(embed)
        channel.send(`<@!${player.id}> hat mit ${player.health}<:HP:821850786870198293> gewonnen`)
        delete games[channel.id]
        return
      }else if(player.health<=0){
        channel.send(embed)
        channel.send(`<@!${other.id}>
        hat mit ${other.health}<:HP:821850786870198293> gewonnen`)
        delete games[channel.id]
        return
      }
      channel.send(embed)
      game.turn=nextTurn
      if(players.length>0){
        fight(players[nextTurn],channel)
      }
    }else{
      //console.log("player didn't act",{turn,pIdx,id:author.id,players})
    }
  }else if(content.toLowerCase().startsWith("fight")){
    //let otherIdStart=content.indexOf("<@")||content.indexOf("<@!")
    let other=msg.mentions.members.first()
    if(other){
    //console.log("found",other)
    channel.send(`<@${other.id}>, you have been challenged by ${member.displayName}.`)
    let players=[member_to_obj(member),member_to_obj(other)]
    let turn=Math.round(Math.random())
    let embed=new Discord.MessageEmbed()
    embed.setDescription(`<@${players[turn].id}> you need to choose your type. Possible types are ${Object.keys(types).join(", ")}`)
    channel.send(embed)
    games[channel.id]={
      players,
      turn,
      typesSet:0
    }
    console.log("created new game",games)
  }else{
    content=content.substr("fight".length).trim()
    console.log("content",content)
    if(content.startsWith("start arena")){
      let arena={
        _id:channel.id,
        fighters:{}
      }
      addDataOrReplace("arenas",channel.id,arena)
      let embed=new Discord.MessageEmbed()
      embed
      .setTitle(`${msg.member.name} created a new arena in this channel.`)
      .setDescription(`When fighting the stats will be saved and can be displayed when typing: fight arena info`)
      channel.send(embed)
    }
  }
  }
}
function fight(player,channel){
  //let actionsText=actions.map(a=>a.name).join(", ")
  let actionsText=Object.keys(player.type.actions).join(", ")
  let embed=new Discord.MessageEmbed()
  embed.setDescription(`<@!${player.id}> was wilst du tun? Mögliche Aktionen sind: ${actionsText}`)
  channel.send(embed)
}
function member_to_obj(member){
  return {
    name:member.displayName,
    id:member.id,
    health:0,
    armour:0,
    member,
    repeatedActs:[],
    timesHealed:0
  }
}
function randRange(min, max) { // min and max included 
  return Math.floor(Math.random() * (max - min + 1) + min);
}
async function addDataOrReplace(collectionName,id,data){
  try{
    await cluster
    .db("fight-bot")
    .collection(collectionName)
    .deleteOne({_id:id})
  }catch(err){
    console.log("could not delete",err)
  }
  await cluster
  .db("fight-bot")
  .collection(collectionName)
  .insertOne(data)
}
Array.prototype.random=function(){
  return this[Math.floor(Math.random()*this.length)]
}