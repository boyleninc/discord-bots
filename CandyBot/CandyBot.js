////////////////////////////////////////////////////////////////////////
//                              CANDYBOT                              //
////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
// Holiday Event Bot for Discord                                         //
// By axc450 (Github) / Super#0100 (Discord)                             //
//                                                                       //
// CandyBot spawns currency based off sent messages.                     //
// Users can collect the currency and use it to buy event discord roles. //
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////
// Commands:                                     //
//                                               //
// help         Shows the CandyBot help menu     //
// pick         Picks up currency when it spawns //
// value        Shows the users current currency //
// lb           Shows the leaderboard            //
// roles        Shows the buyable roles          //
// buy <num>    Attempts to buy an event role    //
///////////////////////////////////////////////////

/////////////////////////
// Setup - DO NOT EDIT //
/////////////////////////

const version           = 1.6                       //CandyBot Version
const Discord           = require("discord.js")     //Discord API
const fs                = require("fs")             //File System
const client            = new Discord.Client()      //CandyBot Instance
var data                = require("./data.json")    //CandyBot Data
var readyForPicking     = []                        //Proccable channels
var pickid              = []                        //Last candy proc message
var lastSent            = []                        //Last user candy proc
var lastPick            = []                        //Last user candy pick
var channelsString      = ""                        //Active channels
var superString         = ""                        //Author String

//////////////////////////////
// Bot Options - Edit These //
//////////////////////////////

const currency          = "Candy"       //Currency name
const emoji             = ":candy:"     //Currency emoji
const chance            = 0.5           //Chance to spawn currency (0 = 0%, 1 = 100%)
const currMin           = 1             //Minimum currency to drop
const currMax           = 10            //Maximum currency to drop
const currCap           = 0             //Maximum currency a user can hold (0 = no cap)

const serverName        = "My Server"                     //Name of your server
const roleData          = [["Role1", 10], ["Role2", 20]]  //Role names & costs
const activeChannels    = ["Channel 1", "Channel 2"]      //Text channels the bot is active in
const cleanCmds         = ["pick", "buy"]                 //Commands that are 'clean' (command message auto-deleted)

const pickLimit         = 3                 //Amount of times users can .pick in a row
const blacklist_roles   = ["BadRole"]       //Roles that cannot interact with CandyBot
const blacklist_users   = ["BadUser#1234"]  //Users that cannot interact with CandyBot

const cmdPrefix         = "."               //Command prefix
const discordID         = "???????????????????????????????????????????????????????????"    //Discord Bot API Token

////////////////////////
// Code - DO NOT EDIT //
////////////////////////

const currMsg          = emoji + emoji + emoji + emoji + emoji + emoji + emoji + emoji + "\n**Random " + currency + " Appeared!**\n_Type **" + cmdPrefix + "pick** to pick it up!_"    //Bot message on currency proc

client.login(discordID)    //Connects to discord via the token

client.on("ready", () =>    //When the bot connected
{
    console.log("Setting up " + serverName + " Bot...")    //Log message

    for (c of activeChannels)    //For all channels the bot is active in, set up environment variables
    {
        readyForPicking.push([c, false])
        pickid.push([c, 0])
        lastSent.push([c, 0])
        lastPick.push([0, 0])
        channelsString = channelsString + client.channels.find("name",c).toString() + " "
    }

    setupSuperString()  //Setup author string
    
    console.log("Channel array populated: " + readyForPicking)  //Log message
    console.log("Channel array populated: " + pickid)           //Log message
    
    console.log(serverName + " Bot Started!")                   //Log message
})

client.on("message", (m) =>        //When a message is sent
{
    if (activeChannels.indexOf(m.channel.name) == -1){return}    //Exit if its an inactive channel
    
    if (m.author.bot)    //If its a bot message
    {
        if (m.content == currMsg)    //If the bot dropped currency
        {
            arraySet(pickid, m.channel.name, m.id)    //Store the message ID of the dropped currency message
        }
        return    //Exit
    }
    
    if (arrayFind(lastSent, m.channel.name) != m.author.id)  //If a different user has spoken
    {
        arraySet(lastSent, m.channel.name, 0)   //Allow currency to drop
    }

    if (Math.random() < chance && !arrayFind(readyForPicking, m.channel.name) && (arrayFind(lastSent, m.channel.name) != m.author.id) && !m.content.startsWith(cmdPrefix))    //If the requirements to drop currency are met
    {
        m.channel.send(currMsg)    //Drop currency
        arraySet(readyForPicking, m.channel.name, true)    //Dont drop more until the currency has been picked
        arraySet(lastSent, m.channel.name, m.author.id)    //Store the user that procced the currency drop
    }
    
    if (!m.content.startsWith(cmdPrefix)){return}                  //Exit if the message is not a CandyBot command
    if (findBlacklistRoles(m.member.roles)){cleanup(m); return}    //Exit if user role is in the blacklist
    if (blacklist_users.indexOf(m.member.user.tag) != -1){cleanup(m); return}    //Exit if user tag is in the blacklist
    
    m.content = m.content.toLowerCase()     //Ignore uppercase/lowercase in a command
    
    switch (m.content) //Command List
    {
        case (cmdPrefix + "pick"): pick(m); break        //Pick
        case (cmdPrefix + "value"): value(m); break      //Value
        case (cmdPrefix + "help"): help(m); break        //Help
        case (cmdPrefix + "roles"): roles(m); break      //Roles
        case (cmdPrefix + "lb"): lb(m); break            //Leaderboard
    }
    
    if (m.content.startsWith(cmdPrefix + "buy"))
    {
        buy(m)  //Buy
    }
    
    cleanup(m)  //Deletes the message if this is a clean command
})

function pick(m)    //Handles a pick command
{
    if (arrayFind(readyForPicking, m.channel.name) && !(lastPick[0] == m.author.id && lastPick[1] >= pickLimit))    //If there has been currency dropped and user hasnt hit the pick limit
    {
        const amount = getRandomInt(currMin, currMax)                              //Create a random amount of currency
        m.channel.messages.find("id", arrayFind(pickid, m.channel.name)).delete()    //Delete the currency drop message
        m.channel.send(m.author + " picked up __**" + amount + "**__ " + emoji + " !")     //Send the picked message
        updateData(m.author.id, amount)                                              //Update the users currency value
        arraySet(readyForPicking, m.channel.name, false)                             //Set the bot to start dropping currency
        
        if(lastPick[0] == m.author.id)          //If the same user picked again
        {
            lastPick[1] = lastPick[1] + 1       //Increase their pick count
        }
        else
        {
            lastPick[1] = 1                     //Set their pick count to 1
        }
        
        lastPick[0] = m.author.id               //Set the last user picked to this user
    }
}

function value(m)    //Handles a candy command
{
    if (data.hasOwnProperty(m.author.id))    //If user has currency
    {
        m.channel.send(m.author + " You have __**" + data[m.author.id] + "**__ " + emoji + "!")    //Display users currency
    }
    else
    {
        m.channel.send(m.author + " You dont have any " + emoji + "! :frowning: ")    //Display "no currency"
    }
}

function help(m)    //Handles a help command
{
    m.channel.send(emoji + " **__CandyBot Help!__** " + emoji + "\n```" + cmdPrefix + "help        Shows this help menu\n" + cmdPrefix + "pick        Picks up " + currency + "\n" + cmdPrefix + "value       Shows your current " + currency + "\n" + cmdPrefix + "lb          Shows the leaderboard\n"  + cmdPrefix + "roles       Shows the buyable roles (inc. role numbers & cost)\n" + cmdPrefix + "buy <num>   Buys a " + serverName + " Event Role```**CandyBot v" + version + "** active in: " + channelsString + "\n[_Made for " + serverName + "_] [_Created by " + superString + "_]")
}

function roles(m)
{
    var rolesStr = emoji + " **__CandyBot Roles!__** " + emoji + "\n```"   //Starting roles string
    
    for(i = 0; i<roleData.length; i++)  //Get all roles
    {   
        if(i < 9)
        {
            rolesStr = rolesStr + (i+1) + ".    " + roleData[i][0] + "    " + roleData[i][1] + "\n" //Form roles string
        }
        else
        {
            rolesStr = rolesStr + (i+1) + ".   " + roleData[i][0] + "    " + roleData[i][1] + "\n"  //Form roles string
        }
    }
    
    rolesStr = rolesStr + "```_Type **" + cmdPrefix + "buy <num>** to buy a role!_"     //Add a suffix
    m.channel.send(rolesStr)   //Send the leaderboard string
}

function buy(m)    //Handles a buy command
{
    const roleNum = getRoleNum(m)   //Get the role number based on the argument
    
    if (!roleNum || roleNum > roleData.length || roleNum < 0)    //If a valid role hasnt been selected
    {
        cleanup(m)  //Deletes the message if this is a clean command
        return
    }
    
    const roleSelection = roleData[roleNum-1]               //Get selected role
    const name = m.author.id                                //Get users id
    const hasRole = m.member.roles.find("name", roleSelection[0])   //Get users role
    const role = m.guild.roles.find("name", roleSelection[0])       //Get the server role
    
    if (!role)   //If the role doesnt exist
    {
        console.log("Something Went Wrong!")    //Throw error
        cleanup(m)  //Deletes the message if this is a clean command
        return
    }
    
    if (hasRole)    //If the user has the role
    {
        m.channel.send(m.author + " You already have the role! :joy: ")
        cleanup(m)  //Deletes the message if this is a clean command
        return
    }
    
    if (!data.hasOwnProperty(name))    //If the user has currency
    {
        m.channel.send(m.author + " You dont have any " + emoji + "! :frowning: ")
        cleanup(m)  //Deletes the message if this is a clean command
        return
    }
    
    if (data[name] < roleSelection[1])    //If the user does not have enough currency
    {
        m.channel.send(m.author + " You dont have enough " + emoji + "! :frowning: (Need **__" + roleSelection[1] + "__**, you have **__" + data[name] + "__**)")
        cleanup(m)  //Deletes the message if this is a clean command
        return
    }
    
    updateData(name, -roleSelection[1])         //Remove currency
    m.member.addRole(role, "Bot")       //Give the user the role
    m.channel.send(m.author + " You have bought the **" + roleSelection[0] + "** Role! Keep trying to earn " + emoji + "! :sparkles: ")
    saveData()  //Save user currency data
}

function lb(m)    //Handles a lb command
{
    const array = sort()    //Sort the data
    var lbStr = emoji + " **__CandyBot Leaderboard!__** " + emoji + "\n```"    //Starting leaderboard string
    
    for (i = 0; i<10; i++)    //First 10 places
    {
        if (i>array.length-1){break}    //Exit if less then 10 people exist in the JSON data
        
        if (i < 9)
        {
            lbStr = lbStr + (i+1) + ".    " + format(array[i][0]) + "    " + idtoname(array[i][1]) + "\n"    //Form Leaderboard String
        }
        else
        {
            lbStr = lbStr + (i+1) + ".   " + format(array[i][0]) + "    " + idtoname(array[i][1]) + "\n"    //Form Leaderboard String
        }
    }
    
    lbStr = lbStr + "```"   //Add a suffix
    m.channel.send(lbStr)   //Send the leaderboard string
}

function cleanup(m)     //Deletes a command message if the command is clean
{
    var cmd = m.content.slice(cmdPrefix.length, m.length)   //Get the command
    
    if (cmd.indexOf(" ") != -1) //If the command has extra arguments
    {
        cmd = cmd.slice(0, cmd.indexOf(" "))    //Remove extra arguments
    }
    
    if (cleanCmds.indexOf(cmd) != -1)   //If its clean
    {
        m.delete()  //Delete the message
    }
}

function updateData(name, amount)    //Updates JSON data
{
    if (data.hasOwnProperty(name))    //If user exists in the JSON data
    {
        if (data[name]+amount >= currCap && currCap != 0)     //If currency cap has been reached
        {
            data[name] = currCap              //Cap currecny
        }
        else
        {
            data[name] = data[name]+amount    //Add currency to a user
        }
    }
    else
    {
        data[name] = amount    //Set users currency level
    }
    
    saveData()    //Save JSON data
}

function sort()    //Sorts JSON data
{
      var sortedArray = []    //Create temp array

      for (var i in data)    //Search all JSON data
      {
        sortedArray.push([data[i], i])    //Populate array
      }

    return sortedArray.sort((a,b) => b[0] - a[0])    //Sort array on sort function
}

function format(n)    //Format string for data alignment
{
    const l = n.toString()
    
    if (l.length == 3)
    {
        return (l + " ")
    }
    
    if (l.length == 2)
    {
        return (l + "  ")
    }
    
    if (l.length == 1)
    {
        return (l + "   ")
    }
    
    return l
}

function idtoname(str)    //Converts a user ID to a username
{
    const user = client.users.find("id", str) //Gets the user
    
    if (user)   //If they exist on discord
    {
        return user.username    //Resolve their username
    }
    
    return "Unknown User"   //Else 'Unknown User'
}

function saveData()    //Save JSON data
{
    fs.writeFile("data.json", JSON.stringify(data, null, 2), 'utf8', (error) => { if (error) {console.log("Something Went Wrong!")} })
}

function getRandomInt(min, max)    //Return random integer
{
    return Math.floor(Math.random() * (max - min + 1)) + min
}

function setupSuperString()
{
    superString = client.users.get("157591768177573888")       //Get Super tag
    
    if (superString == undefined)    //If Super is not on the server
    {
        superString = "Super#0010"  //Use Discord tag instead
    }
}

function getRoleNum(m)
{
	return Number(m.content.slice(cmdPrefix.length+4, m.length))    //Gets a role from a buy command argument
}

function findBlacklistRoles(roles)
{
    for (var r of blacklist_roles)
    {
        if(roles.find("name", r)){return true}
    }
    return false
}

function arraySet(a, k, v)    //Sets array dara
{
    for (var i of a)
    {
        if (i[0] == k)
        {
            i[1] = v
            return
        }
    }
}

function arrayFind(a, k)    //Finds array data
{
    for (var i of a)
    {
        if (i[0] == k)
        {
            return i[1]
        }
    }
}
