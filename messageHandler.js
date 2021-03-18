//let actions=[{name:"punch",damageMin:3,damageMax:40},{name:"defend",damageMin},{name:"kick"}]
let types=require("./types.js")
let games={}
module.exports=(msg,bot)=>{
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
    if(game.typesSet<2){
    if(pIdx==turn){
      let player=players[pIdx]
      console.log(player.name,"chooses Type")
      if(content in types){
        let type=types[content]
        channel.send(`${player.name} choose the type ${type.name}`)
        player.type=type
        player.health=type.health
        type.init(player)
        game.typesSet++
        if(game.typesSet<2){
    channel.send(`<@${players[nextTurn].id}> you need to choose your type. Possible types are ${Object.keys(types).join(", ")}`)
        }else{
          fight(players[nextTurn],channel)
        }
        turn=nextTurn
        game.turn=nextTurn
      }else{
        channel.send(`<@${player.id}> "${content}" is not a valid type. Valid types are: ${Object.keys(types).join(", ")}.`)
      }
      return
    }else{
      console.log("type already set",players[pIdx].type)
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
          console.log("game after deletion",game)
        }
        return
      }
      if(Math.random()<=0.004){
        channel.send(`<@!${player.id}> Got a Heart Atack<:HP:821850786870198293>.`)
        player.health=1
      }else{
        if(content in actions){
          let action = actions[content]
          action.act(action,{player,other,channel})
        }else{
          return
        }
      }
      channel.send(`<@!${player.id}> hat ${player.health}<:HP:821850786870198293>
      <@!${other.id}> hat ${other.health}<:HP:821850786870198293>`)
      if(other.health<=0){
        channel.send(`<@!${player.id}> hat mit ${player.health}<:HP:821850786870198293> gewonnen`)
        delete games[channel.id]
        return
      }else if(player.health<=0){
        channel.send(`<@!${other.id}>
        hat mit ${other.health}<:HP:821850786870198293> gewonnen`)
        delete games[channel.id]
        return
      }
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
    //console.log("found",other)
    channel.send(`<@${other.id}>, du wurdest von ${member.displayName} herausgefordert.`)
    let players=[member_to_obj(member),member_to_obj(other)]
    let turn=Math.round(Math.random())
    channel.send(`<@${players[turn].id}> you need to choose your type. Possible types are ${Object.keys(types).join(", ")}`)
    games[channel.id]={
      players,
      turn,
      typesSet:0
    }
    console.log("created new game",games)
  }
}
function fight(player,channel){
  //let actionsText=actions.map(a=>a.name).join(", ")
  let actionsText=Object.keys(player.type.actions).join(", ")
  channel.send(`<@!${player.id}> was wilst du tun? Mögliche Aktionen sind: ${actionsText}`)
}
function member_to_obj(member){
  return {
    name:member.displayName,
    id:member.id,
    health:0,
    armour:0,
    member,
    timesHealed:0
  }
}
function randRange(min, max) { // min and max included 
  return Math.floor(Math.random() * (max - min + 1) + min);
}