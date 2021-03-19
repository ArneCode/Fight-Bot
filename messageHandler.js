//let actions=[{name:"punch",damageMin:3,damageMax:40},{name:"defend",damageMin},{name:"kick"}]
let heartAttackImgs=["heart-attack1.jpg","herzinfarkt2.png","herzinfarkt1.webp","herzinfarkt3.png","herzinfarkt4.png"]
const Discord=require("discord.js")
let types=require("./types.js")
let games={}
let cluster
let guilds=[]
let guildsStats={}
module.exports={setCluster,handleMessage}
async function setCluster(_cluster){
  cluster=_cluster
  setTimeout(async ()=>{
  let guildsInfo=await cluster
  .db("fight-bot")
  .collection("guilds")
  .findOne({_id:"known_guilds"})
  guilds=guildsInfo.guilds
  console.log("guilds",guilds)
  },1000)
}
async function handleMessage(msg,bot,cluster){
  let {content,author,member,channel,guild}=msg
  let guildStats
  content=content.toLowerCase()
  if(guilds.indexOf(guild.id)==-1){
    console.log(guild.id,typeof guild.id)
    await createGuildStats(guild.id)
    guilds.push(guild.id)
    await cluster
    .db("fight-bot")
    .collection("guilds")
    .updateOne({_id:"known_guilds"},{$set:{guilds}})
  }else{
    if(guild.id in guildsStats){
      guildStats=guildsStats[guild.id]
    }else{
    guildStats=await getGuildStats(guild.id)
    guildsStats[guild.id]=guildStats
  }
  }
  console.log("guildStats",guildStats)
  //console.log(content)
  if(msg.author.bot){
    return
  }
    console.log(content)
    let playerStats
    if(author.id in guildStats.fighters){
      playerStats=guildStats.fighters[author.id]
    }else{
      playerStats=member_to_stats(member)
      guildStats.fighters[author.id]=playerStats
      await setGuildStats(guild.id,guildStats)
    }
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
      await channel.send(embed)
        player.type=type
        player.health=type.health
        type.init(player)
        game.typesSet++
        if(game.typesSet<2){
          embed=new Discord.MessageEmbed()
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
      let otherStats=guildStats.fighters[other.id]
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
        playerStats["heart attacks"]++
      }else{
        if(content in actions){
          let action = actions[content]
          action.act(action,{player,other,channel,playerStats,otherStats},embed)
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
        otherStats.deaths++
        playerStats.kills++
      setGuildStats(guild.id,guildStats)
        return
      }else if(player.health<=0){
        channel.send(embed)
        channel.send(`<@!${other.id}>
        hat mit ${other.health}<:HP:821850786870198293> gewonnen`)
        delete games[channel.id]
        playerStats.deaths++
        otherStats.kills++
      setGuildStats(guild.id,guildStats)
        return
      }
      setGuildStats(guild.id,guildStats)
      channel.send(embed)
      game.turn=nextTurn
      if(players.length>0){
        fight(players[nextTurn],channel)
      }
    }
  }else if(content.toLowerCase().startsWith("fight")){
    //let otherIdStart=content.indexOf("<@")||content.indexOf("<@!")
    let other=msg.mentions.members.first()
    if(other){
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
  }else{
    content=content.substr("fight".length).trim()
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
    }else if(content.startsWith("stats")){
      let embed=new Discord.MessageEmbed()
      embed.setTitle(`Stats of ${member.displayName}`)
      let fields=[]
      for(let name in playerStats){
        fields.push({name:name+":",value:playerStats[name]})
      }
      embed.addFields(fields)
      channel.send(embed)
    }else if(content.startsWith("leaderboard for")){
      content=content.substr("leaderboard for".length).trim()
      let fighters=Object.values(guildStats.fighters)
      if(content in fighters[0]&&content!="name"){
        fighters=fighters.sort((b,a)=>{
          return a[content]-b[content]
        })
        let texts=[]
        for(let fighter of fighters){
          texts.push(`${fighter.name} : ${fighter[content]}`)
        }
        let embed=new Discord.MessageEmbed()
        embed.setTitle(`Leaderboard in regards to ${content}`)
        let text=texts.join("\n---------------\n")
        embed.setDescription(text)
        channel.send(embed)
      }else{
      }
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
function member_to_stats(member){
  return {
    kills:0,
    deaths:0,
    kicks:0,
    punches:0,
    heals:0,
    "heart attacks":0,
    "times fallen":0,
    //"arrows poisoned":0,
    //"paralysing arrows loaded":0,
    //"poisoned arrows shot":0,
    //"paralysing arrows shot":0,
    "damage dealt":0,
    "health lost":0,
    ragekicks:0,
    name:member.displayName
  }
}
async function getGuildStats(guildId){
  let obj = await cluster
  .db("fight-bot")
  .collection("guilds")
  .findOne({_id:guildId})
  return obj
}
async function createGuildStats(guildId){
  let stats={
    _id:guildId,
    fighters:{}
  }
  await cluster
  .db("fight-bot")
  .collection("guilds")
  .insertOne(stats)
}
async function setGuildStats(guildId,stats){
  await cluster
  .db("fight-bot")
  .collection("guilds")
  .updateOne({_id:guildId},{$set:stats})
}
Array.prototype.random=function(){
  return this[Math.floor(Math.random()*this.length)]
}