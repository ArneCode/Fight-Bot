function punchAction(stats,info,embed){
  let {dmgs}=stats
  let {player,other,channel,playerStats,otherStats}=info
  let dmg=randRange(...dmgs)
  embed.setTitle(`${player.name} punches <:PunchEmj:821827229163061348> ${other.name}`)
  embed.setDescription(`he deals ${other.name} ${dmg}<:HP:821850786870198293> of damage <:bang:822187290377584660>`)
  playerStats.punches++
  playerStats["damage dealt"]+=dmg
  otherStats["health lost"]+=dmg
  /*channel.send(`${player.name}punches<:PunchEmj:821827229163061348> ${other.name} and deals ${dmg}<:HP:821850786870198293> of damage`)*/
  other.health-=dmg
}
function kickAction(stats,info,embed){
  let {dmgs,fallDmg,fallRate}=stats
  let {player,other,channel,playerStats,otherStats}=info
  if(Math.random()<=fallRate){
    let ownDmg=randRange(...fallDmg)
    embed.setTitle(`${player.name} is useless`)
    embed.setDescription(`He fell on the ground <:bang:822187290377584660> and lost ${ownDmg}<:HP:821850786870198293>`)
    //channel.send(`${player.name} was completely useless and fell on the ground. He loses ${ownDmg}<:HP:821850786870198293>`)
    player.health-=ownDmg
    playerStats["health lost"]+=ownDmg
    playerStats["times fallen"]++
  }else{
  let dmg=randRange(...dmgs)
  embed.setTitle(`${player.name} kicks <:KickEmj:821827114906288178> ${other.name} <:bang:822187290377584660>`)
  embed.setDescription(`${player.name} kicks <:KickEmj:821827114906288178> ${other.name} in the face and deals ${dmg}<:HP:821850786870198293>`)
  //channel.send(` of damage`)
  other.health-=dmg
  playerStats.kicks++
  playerStats["damage dealt"]+=dmg
  otherStats["health lost"]+=dmg
  }
}
function healAction(stats,info,embed){
  let {amounts,maxHeals}=stats
  let {player,other,channel,playerStats}=info
  player.timesHealed++
  if((player.timesHealed)<=maxHeals){
    console.log(player.timesHealed+"/"+maxHeals)
  let amount=randRange(...amounts)
  //channel.send(`${player.name} gains ${amount}<:HP:821850786870198293>`)
  embed.setTitle(`${player.name} is healing`)
  embed.setDescription(`he gains ${amount}<:HP:821850786870198293>. He has already healed ${player.timesHealed}/${maxHeals} times.`)
  player.health+=amount
  playerStats.heals++
  }else{
    //channel.send(`${player.name} you can only heal ${maxHeals} times`)
    embed.setDescription(`${player.name} you can only heal ${maxHeals} times`)
  }
}
function chargeManaAction(stats,info,embed){
  let {factor}=stats
  let {player,channel}=info
  player.mana=Math.round(player.mana*factor)
  embed.setTitle(`${player.name} is charging`)
  embed.setDescription(`he has increased his mana by a factor of ${factor}. Total mana: ${player.mana}<:mana:822191729704435792>`)
  //channel.send(`${player.name} has increased his mana by a factor of ${factor}. Total mana:${player.mana}`)
  console.log("player",player)
}
function shootMagic(stats,info,embed){
  let {minDmg}=stats
  let {player,other,channel,playerStats,otherStats}=info
  let dmg=randRange(minDmg,player.mana)
  console.log("player",player)
  embed.setTitle(`${player.name} fires a ball of pure power <:fireprojectile:822191693575094272> and hits ${other.name}`)
  embed.setDescription(`he deals ${dmg}<:HP:821850786870198293><:bang:822187290377584660>`)
  //channel.send(`${player.name} fired a ball of pure power and hit ${other.name} he dealed `)
  other.health-=dmg
  player.mana=10
  playerStats["damage dealt"]+=dmg
  otherStats["health lost"]+=dmg
}
function increasePoison(stats,info,embed){
  let {amounts}=stats
  let {player,channel,playerStats}=info
  let amount=randRange(...amounts)
  player.poisonApplied+=amount
  embed.setTitle(`${player.name} Is poisoning his arrows`)
  embed.setDescription(`They will now deal ${player.poisonApplied} every round`)
  //playerStats["poison applied"]+=amount
}
function shootPoisoned(stats,info,embed){
  let {dmgs}=stats
  let {player,other,channel,playerStats,otherStats}=info
  let {poisonApplied}=player
  embed.setTitle(`${player.name} shoots ${other.name} with poisoned arrows`)
  embed.setDescription(`Aditionally he will now loose ${poisonApplied}<:HP:821850786870198293> per round`)
  player.poisonApplied=0
  other.repeatedActs.push(poision.bind({poisonApplied,playerStats,otherStats}))

}
function poision(player,embed){
  let {playerStats,otherStats}=this
  console.log("this",this)
  player.health-=this.poisonApplied
  embed.addField("poisoning "+player.name,`-${this.poisonApplied}<:HP:821850786870198293>`)
  playerStats["damage dealt"]+=this.poisonApplied
  otherStats["health lost"]+=this.poisonApplied
}
function rageKick(stats,info,embed){
  let {player,playerStats}=info
  let {rageDmg,rageFromHp}=stats
  let {alreadyRaged}=player
  if(player.health<=rageFromHp&&!alreadyRaged){
    player.alreadyRaged=true
    stats=clone_entirely(stats)
    stats.dmgs=stats.rageDmg
    embed.setColor(`#ff0000`)
    embed.addField(`${player.name} is enraged so he will deal more damage.`)
    kickAction(stats,info,embed)
    playerStats.ragekicks++
  }else{
    kickAction(stats,info,embed)
  }
}
function loadArrows(stats,info,embed){
  let {player,other,channel}=info
  let {amount}=stats
  player.arrows+=amount
  embed.setTitle(`${player.name} puts ${amount} paralysing arrows in his quiver.`)
  embed.setDescription(`He now has ${player.arrows} arrows`)
}
function shootParalysing(stats,info,embed){
  let {player,other,channel,playerStats,otherStats}=info
  let {addedFallRate,punchNerf,dmgs,maxFallRate}=stats
  if(player.arrows>0){
    let {actions}=other.type
  player.arrows--
  let dmg=randRange(...dmgs)
  other.health-=dmg
  playerStats["damage dealt"]+=dmg
  otherStats["health lost"]+=dmg
  actions.kick.fallRate=Math.min(addedFallRate+actions.kick.fallRate,maxFallRate)
  actions.punch.dmgs=actions.punch.dmgs.map((elt,i)=>Math.max(elt-punchNerf,actions.punch.minDmgs[i]))
  //actions.punch.dmgs[1]-=Math.max(punchNerf,actions.punch.dmgs[0])

  console.log("updated punch",actions.punch,punchNerf)
  embed.setTitle(`${player.name} hits ${other.name} with a paralysing arrow`)
  embed.setDescription(`${other.name} looses ${dmg}<:HP:821850786870198293>. Additionally he will be more likely to fall when kicking and his punched will do less damage. ${player.name} has now ${player.arrows} left in his quiver`)
  }else{
    embed.setTitle(`${player.name} tries to shoot but has no arrows left.`)
  }
}
let types={
  tank:{
    name:"tank",
    health:250,
    pic:"tank.jpg",
    init:()=>null,
    actions:{
      punch:{
        act:punchAction,
        dmgs:[5,20],
        minDmgs:[5,5]
        },
      kick:{
        act:rageKick,
        dmgs:[15,30],
        fallRate:0.16666,
        fallDmg:[12,28],
        rageDmg:[1,100],
        rageFromHp:35
      },
      heal:{
        act:healAction,
        amounts:[25,35],
        maxHeals:2
      }
    }
  },
  archer:{
    name:"archer",
    health:150,
    pic:"archer.jpg",
    init:p=>p.arrows=0,
    actions:{
      punch:{
        act:punchAction,
        dmgs:[10,25],
        minDmgs:[5,10]
      },
      kick:{
        act:kickAction,
        dmgs:[16,38],
        fallRate:0.075,
        fallDmg:[8,20]
      },
      heal:{
        act:healAction,
        amounts:[25,40],
        maxHeals:2
      },
      charge:{
        act:loadArrows,
        amount:3
      },
      shoot:{
        act:shootParalysing,
        dmgs:[10,20],
        addedFallRate:0.1,
        punchNerf:1,
        maxFallRate:0.35
      }
    }
  },
  mage:{
    name:"mage",
    health:100,
    pic:"mage.jpg",
    init:player=>{
      player.mana=7.5
      console.log("init!")
    },
    actions:{
      punch:{
        act:punchAction,
        dmgs:[15,30],
        minDmgs:[5,15]
      },
      kick:{
        act:kickAction,
        dmgs:[25,40],
        fallRate:0.1,
        fallDmg:[10,18]
      },
      heal:{
        act:healAction,
        amounts:[25,35],
        maxHeals:3
      },
      charge:{
        act:chargeManaAction,
        factor:2
      },
      shoot:{
        act:shootMagic,
        minDmg:10
      }
    }
  },
  krüppel:{
    name:"krüppel",
    health:125,
    pic:"Kruppel_1.jpg",
    init:p=>p.poisonApplied=0,
    actions:{
      punch:{
        act:punchAction,
        dmgs:[7,15],
        minDmgs:[5,7]
      },
      kick:{
        act:kickAction,
        dmgs:[10,20],
        fallRate:0.2,
        fallDmg:[10,25]
      },
      heal:{
        act:healAction,
        amounts:[20,45],
        maxHeals:4
      },
      charge:{
        act:increasePoison,
        amounts:[2,3]
      },
      shoot:{
        act:shootPoisoned,
        dmgs:[20,20]
      }
    }
  }
}
function randRange(min, max) { // min and max included 
  return Math.floor(Math.random() * (max - min + 1) + min);
}
function clone_entirely(obj){
  //console.log("cloning",obj,typeof obj,obj.constructor)
  if(!obj){
    return obj
  }
  let clone
  if(obj.constructor==Array){
    clone=[]
  }else if((typeof obj)=="object"){
    clone={}
  }else{
    return obj
  }
  for(let attr in obj){
    if(obj.hasOwnProperty(attr)){
    clone[attr]=clone_entirely(obj[attr])
    }
  }
  //console.log("returning:",clone)
  return clone
}
module.exports=types