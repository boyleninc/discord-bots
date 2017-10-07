///////////////////////////////////////////////////////////////////////////
//                                CANDYBOT                               //
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
// Holiday Event Bot for Discord                                         //
// By axc450 (Github) / Super#0100 (Discord)                             //
//                                                                       //
// CandyBot spawns candy based off sent messages.                        //
// Users can collect the candy and use it to buy an event discord role.  //
///////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////
// Commands:                               //
//                                         //
// .help    Shows the CandyBot help menu   //
// .pick    Picks up candy when it spawns  //
// .candy   Shows the users current candy  //
// .lb      Shows the leaderboard          //
// .buy     Attempts to buy the event role //
/////////////////////////////////////////////

///////////
// Setup //
///////////

const Discord       = require("discord.js");
const fs            = require("fs");
const client        = new Discord.Client();
var data            = require("./data.json");
var readyForPicking = []
var pickid          = []

//////////////////////////////
// Bot Options - Edit These //
//////////////////////////////

const chance            =	0.5		//Chance to spawn a candy (0 = 0%, 1 = 100%)
const candyMin          =	1		//Minimum candy to drop
const candyMax          =	10		//Maximum candy to drop
const roleCost          =	20		//Cost of the special discord role
const roleName          =	"My Role"		//Name of the special discord role
const serverName        =	"My Server"		//Name of your server
const activeChannels    =	["Channel One", "Channel 2"]		//Text channels the bot is active in

const discordID         =	"???????????????????????????????????????????????????????????"	//Discord Bot API Token
const candyMsg          =	":candy::candy::candy::candy::candy::candy::candy:\n**Random Candy Appeared!**\n_Type .pick to pick them up!_"		//Bot message on candy proc

////////////////////////
// Code - DO NOT EDIT //
////////////////////////

client.login(discordID);

client.on("ready", () => 
{
	console.log("Setting up " + serverName + " Bot...")

	for(c in activeChannels)
	{
		readyForPicking.push([activeChannels[c], false])
		pickid.push([activeChannels[c], 0])
	}

	console.log("Channel array populated: " + readyForPicking)
	console.log("Channel array populated: " + pickid)
	console.log(serverName + " Bot Started!");
});

client.on("message", (m) => 
{
	if(activeChannels.indexOf(m.channel.name) == -1){return;}
	
	if(m.author.bot)
	{
		if (m.content == candyMsg)
		{
			arraySet(pickid, m.channel.name, m.id);
		}
		return;
	}

	if(Math.random() < chance && !arrayFind(readyForPicking, m.channel.name) && !m.content.startsWith("."))
	{
		m.channel.send(candyMsg);
		arraySet(readyForPicking, m.channel.name, true);
	}
	
	if(!m.content.startsWith(".")){return;}

	switch(m.content) 
	{
    		case ".pick": pick(m); break;
		case ".candy": candy(m); break;
		case ".help": help(m); break;
		case ".buy": buy(m); break;
		case ".lb": lb(m); break;
	}
});

function pick(m)
{
	if(arrayFind(readyForPicking, m.channel.name))
	{
		m.channel.messages.find("id", arrayFind(pickid, m.channel.name)).delete();
		amount = getRandomInt(candyMin, candyMax)
		m.channel.send(m.author + " picked up __**" + amount + "**__ :candy: !");
		updateData(m.author.id, amount)
		arraySet(readyForPicking, m.channel.name, false)
	}
	
	m.delete()
}

function candy(m)
{
	if(data.hasOwnProperty(m.author.id))
	{
		m.channel.send(m.author + " You have __**" + data[m.author.id] + "**__ candy!");	
	}
	else
	{
		m.channel.send(m.author + " You dont have any candy! :frowning: ")
	}
}

function help(m)
{
	m.channel.send(":candy: **__Candy Bot Help!__** :candy:\n```.help	Shows this help menu\n.pick	Picks up candy\n.candy   Shows your current candy\n.lb      Shows the leaderboard\n.buy     Buys a " + serverName + " Halloween Role! (Cost " + roleCost + ")```_Made by Super for " + serverName + "_");
}

function buy(m)
{
	name = m.author.id
	hasRole = m.member.roles.find("name", roleName)
	role = m.guild.roles.find("name", roleName)
	
	if(hasRole)
	{
		m.channel.send(m.author + " You already have the role! :joy: ");
		return;
	}
	if(!data.hasOwnProperty(name))
	{
		m.channel.send(m.author + " You dont have any candy! :frowning: ");
		return;
	}
	if(data[name] < roleCost)
	{
		m.channel.send(m.author + " You dont have enough candy! :frowning: (Need **__" + roleCost + "__**, you have **__" + data[name] + "__**)")
		return;
	}
	
	data[name] = data[name]-roleCost
	m.member.addRole(role, "Bot")
	m.channel.send(m.author + " You have bought the " + roleName + " Role! Keep trying to earn candy! :sparkles: ");
	saveData();
}

function lb(m)
{
	array = sort()
	lbStr = ":candy: **__Candy Bot Leaderboard!__** :candy:\n```"
	for(i = 0; i<10; i++)
	{
		if(i>array.length-1){break;}
		lbStr = lbStr + (i+1) + ".	" + format(array[i][0]) + "	" + idtoname(array[i][1]) + "\n"
	}
	lbStr = lbStr + "```"
	m.channel.send(lbStr)
}

function updateData(name, amount)
{
	if(data.hasOwnProperty(name))
	{
		data[name] = data[name]+amount	
	}
	else
	{
		data[name] = amount
	}
	saveData()
}

function sort()
{
  	var sortedArray = [];

  	for(var i in data)
  	{
		sortedArray.push([data[i], i]);
	}

	return sortedArray.sort((a,b) => b[0] - a[0]);
}

function format(n)
{
	l = n.toString();
	if (l.length == 3)
	{
		return l+" "
	}
	if (l.length == 2)
	{
		return l+"  "
	}
	if (l.length == 1)
	{
		return l+"   "
	}
	return l;
	
}

function idtoname(str)
{
	return client.users.find("id", str).username;
}

function saveData()
{
	fs.writeFile("data.json", JSON.stringify(data, null, 2), 'utf8', (error) => { if (error) {console.log("Something Went Wrong!")} })
}

function getRandomInt(min, max) 
{
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function arraySet(a, k, v)
{
	for(i in a)
	{
		if (a[i][0] == k)
		{
			a[i][1] = v;
			return;
		}
	}
}

function arrayFind(a, k)
{
	for(i in a)
	{
		if (a[i][0] == k)
		{
			return a[i][1];
		}
	}
}
