function punchAction(stats,info){
  let {dmgs}=stats
  let {player,other,channel}=info
  let dmg=randRange(...dmgs)
  channel.send(`${player.name}punches<:PunchEmj:821827229163061348> ${other.name} and deals ${dmg}<:HP:821850786870198293> of damage`)
  other.health-=dmg
}
function kickAction(stats,info){
  let {dmgs,fallDmg,fallRate}=stats
  let {player,other,channel}=info
  if(Math.random()<=fallRate){
    let ownDmg=randRange(...fallDmg)
    channel.send(`${player.name} was completely useless and fell on the ground. He loses ${ownDmg}<:HP:821850786870198293>`)
    player.health-=ownDmg
  }else{
  let dmg=randRange(...dmgs)
  channel.send(`${player.name} kicks<:KickEmj:821827114906288178> ${other.name} in the face and deals ${dmg}<:HP:821850786870198293> of damage`)
  other.health-=dmg
  }
}
function healAction(stats,info){
  let {amounts,maxHeals}=stats
  let {player,other,channel}=info
  if(player.timesHealed<=maxHeals){
  let amount=randRange(...amounts)
  channel.send(`${player.name} gains ${amount}<:HP:821850786870198293>`)
  player.timesHealed++
  player.health+=amount
  }else{
    channel.send(`${player.name} you can only heal ${maxHeals} times`)
  }
}
function chargeManaAction(stats,info){
  let {factor}=stats
  let {player,channel}=info
  player.mana*=factor
  channel.send(`${player.name} has increased his mana by a factor of ${factor}. Total mana:${player.mana}`)
}
function shootMagic(stats,info){
  let {minDmg}=stats
  let {player,other,channel}=info
  let dmg=randRange(minDmg,player.mana)
  channel.send(`${player.name} fired a ball of pure power and hit ${other.name} he dealed ${dmg}<:HP:821850786870198293>`)
  other.health-=dmg
  player.mana=10
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
        amounts:[25,35],
        maxHeals:2
      }
    }
  },
  mage:{
    name:"mage",
    health:100,
    init:player=>{
      player.mana=10
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
        factor:3
      },
      shoot:{
        act:shootMagic,
        minDmg:10
      }
    }
  }
}
function randRange(min, max) { // min and max included 
  return Math.floor(Math.random() * (max - min + 1) + min);
}
module.exports=types