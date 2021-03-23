const Discord = require("discord.js")
const Canvas = require('canvas');
let heartAttackImgs = ["heart-attack1.jpg", "herzinfarkt2.png", "herzinfarkt1.webp", "herzinfarkt3.png", "herzinfarkt4.png"]
let types = require("./types.js")
let games = {}
let cluster
let guilds = []
let guildsStats = {}
module.exports = {
    setCluster,
    handleMessage
}
async function setCluster(_cluster) {
    cluster = _cluster
    setTimeout(async () => {
        let guildsInfo = await cluster
            .db("fight-bot")
            .collection("guilds")
            .findOne({
                _id: "known_guilds"
            })
        guilds = guildsInfo.guilds
    }, 1000)
}
async function handleMessage(msg, bot, cluster) {
    let {
        content,
        author,
        member,
        channel,
        guild
    } = msg
    let guildStats
    content = content.toLowerCase()
    if (guilds.indexOf(guild.id) == -1) {
        await createGuildStats(guild)
        guilds.push(guild.id)
        await cluster
            .db("fight-bot")
            .collection("guilds")
            .updateOne({
                _id: "known_guilds"
            }, {
                $set: {
                    guilds
                }
            })
    } else {
        if (guild.id in guildsStats) {
            guildStats = guildsStats[guild.id]
        } else {
            guildStats = await getGuildStats(guild.id)
            guildsStats[guild.id] = guildStats
        }
        if (!("Matt Bot" in guildStats.fighters)) {
            guildStats.fighters["Matt Bot"] = member_to_stats({
                displayName: "Matt Bot"
            })
            setGuildStats(guild.id, guildStats)
        }
        if (!guildStats.name) {
            guildStats.name = guild.name
            setGuildStats(guild.id, guildStats)
        }
    }
    if (msg.author.bot) {
        return
    }

    let playerStats
    if (author.id in guildStats.fighters) {
        playerStats = guildStats.fighters[author.id]
    } else {
        playerStats = member_to_stats(member)
        guildStats.fighters[author.id] = playerStats
        setGuildStats(guild.id, guildStats)
    }
    if (!("games played" in playerStats)) {
        playerStats["games played"] = playerStats.kills + playerStats.deaths
        setGuildStats(guild.id, guildStats)
    }
    if (!("level" in playerStats)) {
        playerStats.exp = playerStats.kills * 2 + playerStats.deaths
        playerStats.level = 0
        await updateLevels(playerStats, channel, member)
        setGuildStats(guild.id, guildStats)
    }
    let game = games[channel.id]
    if (game) {
          if(game.players.some(p=>p.id==author.id)){
      game.lastMessage=new Date().getTime()
      if(content=="end"){
        game.running=false
        delete games[channel.id]
        channel.send("ended game")
      }
    }
        let {
            players,
            turn
        } = game
        let nextTurn = (turn + 1) % 2
        let pIdx
        if (players[turn].id == author.id) {
            pIdx = turn
        }
        /*else if (players[nextTurn] == author.id) {
                   pIdx = nextTurn
               }*/
        if (pIdx != turn) {
            return
        }
        let embed //=new Discord.MessageEmbed()
        //embed.setColor('#0099ff')
        if (game.typesSet < 2) {
            if (pIdx == turn) {
                embed = new Discord.MessageEmbed()
                let player = players[pIdx]
                if (content in types && !types[content].notPlayable) {
                    let type = types[content]
                    embed.setDescription(`${player.name} is now a ${type.name}`)
                    let picName=type.pics.random()
                    embed.attachFiles(["./pics/type-pics/" + picName])
                    embed.setImage("attachment://" + picName)
                    await channel.send(embed)
                    player.type = clone_entirely(type)
                    player.health = type.health
                    type.init(player)
                    game.typesSet++
                    if (game.typesSet < 2) {
                        embed = new Discord.MessageEmbed()
                        embed.setTitle(`${players[nextTurn].name}, please chose your type`)
                        embed.setDescription(`Possible types are ${getValidTypes(types).join(", ")}`)
                        channel.send(embed)
                        game.turn = nextTurn
                    } else {
                        if (game.aiGame) {
                            game.turn = randRange(0, 1)
                        } else {
                            game.turn = nextTurn
                        }
                        //game.turn = nextTurn
                        fight(channel, {
                            game,
                            guildStats
                        })
                    }
                    //turn = nextTurn
                    //game.turn = nextTurn
                } else if (content == "end") {
                    channel.send("ending game...")
                    games[channel.id].running=false
                    delete games[channel.id]
                    return
                } else {
                    embed.setColor("#ff0000")
                    embed.setTitle(`${content} is not a valid type`)
                    embed.setDescription(`Valid types are: ${getValidTypes(types).join(", ")}.`)
                    channel.send(embed)
                }
                return
            }
            return
        }

        if (pIdx == turn) {
            let player = players[pIdx]
            let other = players[(pIdx + 1) % 2]
            let otherStats = guildStats.fighters[other.id]
            if (other.bot) {
                otherStats = guildStats.fighters["Matt Bot"]
            }
            let {
                actions
            } = player.type
            if (!content in actions) {
                if (content == "end") {
                    channel.send("game ended")
                    games[channel.id].running=false
                    delete game[channel.id]
                }
                return
            }
            embed = new Discord.MessageEmbed()
            if (Math.random() <= 0.004) {
                let img = heartAttackImgs.random()
                embed.setTitle(`${player.name} got a heart atack`)
                let filename = "./pics/heart-attack/" + img
                embed.attachFiles([filename]) //filename])
                embed.setImage("attachment://" + img)
                player.health = 1
                playerStats["heart attacks"]++

            } else {
                if (content in actions) {
                    let action = actions[content]
                    action.act(action, {
                        player,
                        other,
                        channel,
                        playerStats,
                        otherStats
                    }, embed)
                    for (let act of player.repeatedActs) {
                        act(player, embed)
                    }
                    for (let act of other.repeatedActs) {
                        act(other, embed)
                    }
                } else {
                    return
                }
            }
            displayHealth(players, embed)
            game.turn = nextTurn
            await channel.send(embed)
            fight(channel, {
                game,
                guildStats
            })
            if (other.health <= 0) {
                    games[channel.id].running=false
                delete games[channel.id]
                await handleGameEnd({
                    winner: player,
                    looser: other,
                    winnerStats: playerStats,
                    looserStats: otherStats,
                    game,
                    channel
                })
                setGuildStats(guild.id, guildStats)
                return
            } else if (player.health <= 0) {
                    games[channel.id].running=false
                delete games[channel.id]
                await handleGameEnd({
                    winner: other,
                    looser: player,
                    winnerStats: otherStats,
                    looserStats: playerStats,
                    game,
                    channel
                })
                setGuildStats(guild.id, guildStats)
                return
            }
            setGuildStats(guild.id, guildStats)
        }
    } else if (content.toLowerCase().startsWith("fight")) {
        //let otherIdStart=content.indexOf("<@")||content.indexOf("<@!")
        content = content.substr("fight".length).trim()
        let other = msg.mentions.members.first()
        if (other) {
            if (other.id == bot.user.id) {
                let mattType
                if (content.includes("as")) {
                    let typeName = content.split(" as ")[1].trim()
                    if (typeName in types) {
                        mattType = types[typeName]
                    }
                } else {
                    //let typeName=Object.keys(types).random()
                    mattType = types[getValidTypes(types).random()]
                }
                let mattMember = await memberFromId(bot.user.id, guild)
                let mattObj = member_to_obj(mattMember)
                mattObj.type = clone_entirely(mattType)
                mattType.init(mattObj)
                mattObj.health = mattType.health
                mattObj.bot = true
                let playerObj = member_to_obj(member)
                let players = [playerObj, mattObj]
                let looseExp = mattType.isBoss ? 0.5 : 0.25
                let winExp = mattType.isBoss ? 10 : 1
                let game = {
                    players,
                    turn: 0,
                    typesSet: 1,
                    aiGame: true,
                    matt: mattObj,
                    player: playerObj,
                    looseExp,
                    winExp,
                    lastMessage:new Date().getTime(),
                    channel,
                    running:true
                }
                setTimeout(checkActivity.bind(game),60000)
                games[channel.id] = game
                let embed = new Discord.MessageEmbed()
                embed.setTitle(`You have challenged me`)
                embed.setDescription(`I am choosing the type ${mattType.name}`)
                let picName=mattType.pics.random()
                embed.attachFiles(["./pics/type-pics/" + picName])
                embed.setImage("attachment://" + picName)
                await channel.send(embed)
                channel.send(`<@${member.id}> now you need to choose your type. Possible types are: ${getValidTypes(types).join(", ")}`)
            } else {
                if (other.id == member.id && member.id != "783043429642797096") {
                    return
                }
                channel.send(`<@${other.id}>, you have been challenged by ${member.displayName}.`)
                let players = [member_to_obj(member), member_to_obj(other)]
                let turn = Math.round(Math.random())
                let embed = new Discord.MessageEmbed()
                embed.setDescription(`<@${players[turn].id}> you need to choose your type. Possible types are ${getValidTypes(types).join(", ")}`)
                channel.send(embed)
                let game = {
                    players,
                    turn,
                    typesSet: 0,
                    winExp: 2,
                    looseExp: 1,
                    lastMessage: new Date().getTime(),
                    channel,
                    running:true
                }
                games[channel.id]=game
                setTimeout(checkActivity.bind(game),60000)
            }
        } else {
            if (content.startsWith("start arena")) {
                let arena = {
                    _id: channel.id,
                    fighters: {}
                }
                addDataOrReplace("arenas", channel.id, arena)
                let embed = new Discord.MessageEmbed()
                embed
                    .setTitle(`${msg.member.name} created a new arena in this channel.`)
                    .setDescription(`When fighting the stats will be saved and can be displayed when typing: fight arena info`)
                channel.send(embed)
            } else if (content.startsWith("stats")) {
                let embed = new Discord.MessageEmbed()
                embed.setTitle(`Stats of ${member.displayName}`)
                let fields = []
                let nonDisplays = ["exp", "level"]
                for (let name in playerStats) {
                    if (!nonDisplays.includes(name)) {
                        fields.push({
                            name: name + ":",
                            value: playerStats[name]
                        })
                    }
                }
                embed.addFields(fields)
                await levelToImg(playerStats.exp, playerStats.level, embed, member)
                channel.send(embed)
            } else if (content.startsWith("leaderboard for")) {
                content = content.substr("leaderboard for".length).trim()
                let fighters = Object.values(guildStats.fighters)
                if (content in fighters[0] && content != "name") {
                    fighters = fighters.filter(f => f[content])
                    if (fighters.length == 0) {
                        channel.send(`not enough players have stats for ${content}`)
                    }
                    fighters = fighters.sort((b, a) => {
                        return a[content] - b[content]
                    })
                    let texts = []
                    for (let fighter of fighters) {
                        texts.push(`${fighter.name} : ${fighter[content]}`)
                    }
                    let embed = new Discord.MessageEmbed()
                    embed.setTitle(`Leaderboard in regards to ${content}`)
                    let text = texts.join("\n---------------\n")
                    embed.setDescription(text)
                    channel.send(embed)
                } else {}
            }
            else if(content.startsWith("data for")){
              content=content.slice("data for ".length).trim()
              if(content in types){
                channel.send(JSON.stringify(types[content],null,4))
              }
            }
        }
    }
}
function checkActivity(){
  if(this.lastMessage+180000<=new Date().getTime()&&this.running){
    delete games[this.channel.id]
    this.channel.send("Ending game because of Inactivity")
  }else if(this.running){
    setTimeout(checkActivity.bind(this),60000)
  }
}
async function handleGameEnd(info) {
    let {
        winner,
        looser,
        winnerStats,
        looserStats,
        game,
        channel
    } = info
    channel.send(`<@!${winner.id}> hat mit ${winner.health}<:HP:821850786870198293> gewonnen`)
    looserStats.deaths++
    winnerStats.kills++
    winnerStats["games played"]++
    looserStats["games played"]++
    looserStats.exp += game.looseExp
    console.log("giving " + looser.name + " " + game.looseExp + " Exp")
    winnerStats.exp += game.winExp
    console.log("giving " + winner.name + " " + game.winExp + " Exp")
    if (looser.type.isBoss) {
        channel.send(`Congratulations, you have successfully defeated ${looser.type.name}`)
        console.log("boss fight won")
        if (!winnerStats["boss fights won"]) {
            winnerStats["boss fights won"] = 0
        }
        winnerStats["boss fights won"]++
    }
    await updateLevels(winnerStats, channel, winner.member)
    await updateLevels(looserStats, channel, looser.member)
}

function displayHealth(players, embed) {
    embed.addFields(players.map(p => {
        return {
            name: p.name + ":",
            inline: true,
            value: `\t${p.health}<:HP:821850786870198293>`
        }
    }))
}

function fight(channel, info) {
    let {
        game,
        guildStats
    } = info
    let player = game.players[game.turn]
    //let actionsText=actions.map(a=>a.name).join(", ")
    let embed = new Discord.MessageEmbed()
    if (player.bot) {
      channel.startTyping()
      setTimeout(async ()=>{
        channel.stopTyping()
        let {actions}=player.type
                let actionName = Object.keys(player.type.actions).filter(a=>!actions[a].notDoable).random()//Object.values(player.type.actions).filter(a => !a.notDoable).random()
                await channel.send(actionName)
                let action=actions[actionName]
        let botStats = guildStats.fighters["Matt Bot"]
        let playerStats = guildStats.fighters[game.player.id]
        action.act(action, {
            player,
            other: game.player,
            channel,
            playerStats: botStats,
            otherStats: playerStats
        }, embed)
        displayHealth(game.players, embed)
        for (let act of player.repeatedActs) {
            act(player, embed)
        }
        await channel.send(embed)
        game.turn = (game.turn + 1) % 2
        fight(channel, info)
      },1500)
    } else {
        let actionsText = Object.keys(player.type.actions).join(", ")
        embed.setDescription(`<@!${player.id}> what are you going to do, possible actions are: ${actionsText}`)
        channel.send(embed)
    }
}

function member_to_obj(member) {
    return {
        name: member.displayName,
        id: member.id,
        health: 0,
        armour: 0,
        member,
        repeatedActs: [],
        timesHealed: 0
    }
}

function randRange(min, max) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function member_to_stats(member) {
    return {
        "games played": 0,
        kills: 0,
        deaths: 0,
        kicks: 0,
        punches: 0,
        heals: 0,
        "heart attacks": 0,
        "times fallen": 0,
        //"arrows poisoned":0,
        //"paralysing arrows loaded":0,
        //"poisoned arrows shot":0,
        //"paralysing arrows shot":0,
        "damage dealt": 0,
        "health lost": 0,
        ragekicks: 0,
        name: member.displayName,
        exp: 0,
        level: 0
    }
}
async function getGuildStats(guildId) {
    let obj = await cluster
        .db("fight-bot")
        .collection("guilds")
        .findOne({
            _id: guildId
        })
    return obj
}
async function createGuildStats(guild) {
    let stats = {
        _id: guild.id,
        name: guild.name,
        fighters: {
            "Matt Bot": member_to_stats({
                displayName: "Matt Bot"
            })
        }
    }
    await cluster
        .db("fight-bot")
        .collection("guilds")
        .insertOne(stats)
}
async function setGuildStats(guildId, stats) {
    await cluster
        .db("fight-bot")
        .collection("guilds")
        .updateOne({
            _id: guildId
        }, {
            $set: stats
        })
}
Array.prototype.random = function() {
    return this[Math.floor(Math.random() * this.length)]
}

function clone_entirely(obj) {
    if (!obj) {
        return obj
    }
    let clone
    if (obj.constructor == Array) {
        clone = []
    } else if ((typeof obj) == "object") {
        clone = {}
    } else {
        return obj
    }
    for (let attr in obj) {
        if (obj.hasOwnProperty(attr)) {
            clone[attr] = clone_entirely(obj[attr])
        }
    }
    return clone
}
async function updateLevels(playerStats, channel, player) {
    let {
        exp,
        level
    } = playerStats
    while (exp >= level + 1) {
        exp -= level + 1
        level++
        if (!player.user.bot) {
          console.log(player)
            let embed = new Discord.MessageEmbed()
            await levelToImg(exp, level, embed, player)
            channel.send(`<@${player.id}> is now Level ${level}`)
            channel.send(embed)
        }
    }
    playerStats.exp = exp
    playerStats.level = level
}
async function levelToImg(exp, level, embed, member) {
    const canvas = Canvas.createCanvas(300, 100);
    const ctx = canvas.getContext('2d');
    let chartWidth = 0.5 * canvas.width
    let chartHeight = 7
    let chartOff = [10, -5]
    let pxFromLast = chartWidth * exp / (level + 1)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = "black"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = "blue"
    ctx.fillRect(chartOff[0], chartOff[1] + canvas.height - chartHeight, chartWidth, chartOff[1] - chartHeight)
    ctx.fillStyle = "#00fff3";
    ctx.fillRect(chartOff[0], chartOff[1] + (canvas.height - chartHeight), pxFromLast, chartOff[1] - chartHeight)
    ctx.fillStyle = "yellow"
    ctx.font = "40px Comic Sans"
    ctx.fillText("Level " + level, 10, 40)
    ctx.fillStyle = "#00fff3"
    ctx.font = "15px Comic Sans"
    exp = String(exp)
    ctx.fillText(exp, chartWidth + chartOff[0] + 3, chartOff[1] + canvas.height - chartHeight)
    ctx.fillStyle = "grey"
    ctx.fillText("/", chartWidth + chartOff[0] + 3 + exp.length * 10, chartOff[1] + canvas.height - chartHeight)
    ctx.fillStyle = "blue"
    ctx.fillText(level + 1, chartWidth + chartOff[0] + 3 + (exp.length + 1) * 10, chartOff[1] + canvas.height - chartHeight)
    const avatar = await Canvas.loadImage(member.user.displayAvatarURL({
        format: 'png'
    }));
    ctx.drawImage(avatar, canvas.width - 70, 10, 50, 50);
    let imgName = `level-${level}-exp-${exp}-${Math.round(Math.random()*10000)}.png`
    const attachment = new Discord.MessageAttachment(canvas.toBuffer(), imgName);
    embed.attachFiles([attachment])
    embed.setImage("attachment://" + imgName)
}
async function memberFromId(id, guild) {
    return guild.members.cache.find(m => m.id == id)
}

function getValidTypes(types) {
    return Object.values(types).filter(t => !t.notPlayable).map(t => t.name)
}