function punchAction(stats,info,embed){
  let {dmgs}=stats
  let {player,other,channel}=info
  let dmg=randRange(...dmgs)
  embed.setTitle(`${player.name} punches <:PunchEmj:821827229163061348> ${other.name}`)
  embed.setDescription(`he deals ${other.name} ${dmg}<:HP:821850786870198293> of damage <:bang:822187290377584660>`)
  /*channel.send(`${player.name}punches<:PunchEmj:821827229163061348> ${other.name} and deals ${dmg}<:HP:821850786870198293> of damage`)*/
  other.health-=dmg
}
function kickAction(stats,info,embed){
  let {dmgs,fallDmg,fallRate}=stats
  let {player,other,channel}=info
  if(Math.random()<=fallRate){
    let ownDmg=randRange(...fallDmg)
    embed.setTitle(`${player.name} is useless`)
    embed.setDescription(`He fell on the ground <:bang:822187290377584660> and lost ${ownDmg}<:HP:821850786870198293>`)
    //channel.send(`${player.name} was completely useless and fell on the ground. He loses ${ownDmg}<:HP:821850786870198293>`)
    player.health-=ownDmg
  }else{
  let dmg=randRange(...dmgs)
  embed.setTitle(`${player.name} kicks <:KickEmj:821827114906288178> ${other.name} <:bang:822187290377584660>`)
  embed.setDescription(`${player.name} kicks <:KickEmj:821827114906288178> ${other.name} in the face and deals ${dmg}<:HP:821850786870198293>`)
  //channel.send(` of damage`)
  other.health-=dmg
  }
}
function healAction(stats,info,embed){
  let {amounts,maxHeals}=stats
  let {player,other,channel}=info
  if(player.timesHealed<=maxHeals){
  let amount=randRange(...amounts)
  //channel.send(`${player.name} gains ${amount}<:HP:821850786870198293>`)
  player.timesHealed++
  embed.setTitle(`${player.name} is healing`)
  embed.setDescription(`he gains ${amount}<:HP:821850786870198293>. He has already healed ${player.timesHealed}/${maxHeals} times.`)
  player.health+=amount
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
  let {player,other,channel}=info
  let dmg=randRange(minDmg,player.mana)
  console.log("player",player)
  embed.setTitle(`${player.name} fires a ball of pure power <:fireprojectile:822191693575094272> and hits ${other.name}`)
  embed.setDescription(`he deals ${dmg}<:HP:821850786870198293><:bang:822187290377584660>`)
  //channel.send(`${player.name} fired a ball of pure power and hit ${other.name} he dealed `)
  other.health-=dmg
  player.mana=10
}
function increasePoison(stats,info,embed){
  let {amounts}=stats
  let {player,channel}=info
  let amount=randRange(...amounts)
  player.poisonApplied+=amount
  embed.setTitle(`${player.name} Is poisoning his arrows`)
  embed.setDescription(`They will now deal ${player.poisonApplied} every round`)
}
function shootPoisoned(stats,info,embed){
  let {dmgs}=stats
  let {player,other,channel}=info
  let {poisonApplied}=player
  let dmg=randRange(...dmgs)
  embed.setTitle(`${player.name} shoots ${other.name} with poisoned arrows`)
  embed.setDescription(`${player.name} looses ${dmg}<:HP:821850786870198293>. Aditionally he will now loose ${poisonApplied}<:HP:821850786870198293> per round`)
  player.poisonApplied=0
  other.repeatedActs.push(poision.bind(poisonApplied))
}
function poision(player,embed){
  console.log("this",this)
  player.health-=this
  embed.addField("poisoning "+player.name,`-${this}<:HP:821850786870198293>`)
}
let types={
  tank:{
    name:"tank",
    health:250,
    init:()=>null,
    actions:{
      punch:{
        act:punchAction,
        dmgs:[5,20]
        },
      kick:{
        act:kickAction,
        dmgs:[15,25],
        fallRate:0.16666,
        fallDmg:[12,28]
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
    init:()=>null,
    actions:{
      punch:{
        act:punchAction,
        dmgs:[10,25]
      },
      kick:{
        act:kickAction,
        dmgs:[10,40],
        fallRate:0.075,
        fallDmg:[8,20]
      },
      heal:{
        act:healAction,
        amounts:[25,40],
        maxHeals:2
      }
    }
  },
  mage:{
    name:"mage",
    health:100,
    init:player=>{
      player.mana=12
      console.log("init!")
    },
    actions:{
      punch:{
        act:punchAction,
        dmgs:[15,30]
      },
      kick:{
        act:kickAction,
        dmgs:[25,50],
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
        factor:2.5
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
    init:p=>p.poisonApplied=0,
    actions:{
      punch:{
        act:punchAction,
        dmgs:[5,13]
      },
      kick:{
        act:kickAction,
        dmgs:[10,20],
        fallRate:0.2,
        fallDmg:[10,25]
      },
      heal:{
        act:healAction,
        amounts:[20,50],
        maxHeals:4
      },
      charge:{
        act:increasePoison,
        amounts:[3,5]
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
module.exports=types