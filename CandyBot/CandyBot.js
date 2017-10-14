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
// help    Shows the CandyBot help menu    //
// pick    Picks up candy when it spawns   //
// candy   Shows the users current candy   //
// lb      Shows the leaderboard           //
// buy     Attempts to buy the event role  //
/////////////////////////////////////////////

/////////////////////////
// Setup - DO NOT EDIT //
/////////////////////////

const version           = 1.3                       //CandyBot Version
const Discord           = require("discord.js")     //Discord API
const fs                = require("fs")             //File System
const client            = new Discord.Client()      //CandyBot Instance
var data                = require("./data.json")    //CandyBot Data
var readyForPicking     = []                        //Proccable channels
var pickid              = []                        //Last candy proc message
var lastSent            = []                        //Last user candy proc
var channelsString      = ""                        //Active channels
var superString         = ""                        //Author String

//////////////////////////////
// Bot Options - Edit These //
//////////////////////////////

const chance            = 0.5              //Chance to spawn a candy (0 = 0%, 1 = 100%)
const candyMin          = 1                //Minimum candy to drop
const candyMax          = 10               //Maximum candy to drop
const roleCost          = 20               //Cost of the special discord role
const roleName          = "My Role"        //Name of the special discord role
const serverName        = "My Server"      //Name of your server
const activeChannels    = ["Channel 1", "Channel 2"]    //Text channels the bot is active in
const cleanCmds         = ["pick", "buy"]               //Commands that are 'clean' (command message auto-deleted)

const cmdPrefix         = "."   //Command prefix
const discordID         = "???????????????????????????????????????????????????????????"    //Discord Bot API Token

////////////////////////
// Code - DO NOT EDIT //
////////////////////////

const candyMsg          = ":candy::candy::candy::candy::candy::candy::candy:\n**Random Candy Appeared!**\n_Type " + cmdPrefix + "pick to pick them up!_"    //Bot message on candy proc

client.login(discordID)    //Connects to discord via the token

client.on("ready", () =>    //When the bot connected
{
    console.log("Setting up " + serverName + " Bot...")    //Log message

    for(c in activeChannels)    //For all channels the bot is active in, set up environment variables
    {
        readyForPicking.push([activeChannels[c], false])
        pickid.push([activeChannels[c], 0])
        lastSent.push([activeChannels[c], 0])
        channelsString = channelsString + client.channels.find("name",activeChannels[c]) + " "
    }

    setupSuperString()  //Setup author string
    
    console.log("Channel array populated: " + readyForPicking)  //Log message
    console.log("Channel array populated: " + pickid)           //Log message
    console.log(serverName + " Bot Started!")                   //Log message
})

client.on("message", (m) =>        //When a message is sent
{
    if(activeChannels.indexOf(m.channel.name) == -1){return}    //Exit if its an inactive channel
    
    if(m.author.bot)    //If its a bot message
    {
        if (m.content == candyMsg)    //If the bot dropped some candy
        {
            arraySet(pickid, m.channel.name, m.id)    //Store the message ID of the dropped candy message
        }
        return    //Exit
    }
    
    if(arrayFind(lastSent, m.channel.name) != m.author.id)  //If a different user has spoken
    {
        arraySet(lastSent, m.channel.name, 0)   //Allow candy to drop
    }

    if(Math.random() < chance && !arrayFind(readyForPicking, m.channel.name) && (arrayFind(lastSent, m.channel.name) != m.author.id) && !m.content.startsWith(cmdPrefix))    //If the requirements to drop candy are met
    {
        m.channel.send(candyMsg)    //Drop candy
        arraySet(readyForPicking, m.channel.name, true)    //Dont drop more until the candy has been picked
        arraySet(lastSent, m.channel.name, m.author.id)
    }
    
    if(!m.content.startsWith(cmdPrefix)){return}    //Exit if the message is not a CandyBot command

    switch(m.content) //Command List
    {
        case (cmdPrefix + "pick"): pick(m); break        //Pick
        case (cmdPrefix + "candy"): candy(m); break      //Candy
        case (cmdPrefix + "help"): help(m); break        //Help
        case (cmdPrefix + "buy"): buy(m); break          //Buy
        case (cmdPrefix + "lb"): lb(m); break            //Leaderboard
    }
})

function pick(m)    //Handles a pick command
{
    if(arrayFind(readyForPicking, m.channel.name))    //If there has been candy dropped
    {
        const amount = getRandomInt(candyMin, candyMax)                              //Create a random amount of candy
        m.channel.messages.find("id", arrayFind(pickid, m.channel.name)).delete()    //Delete the candy drop message
        m.channel.send(m.author + " picked up __**" + amount + "**__ :candy: !")     //Send the picked message
        updateData(m.author.id, amount)                                              //Update the users candy level
        arraySet(readyForPicking, m.channel.name, false)                             //Set the bot to start dropping candy
    }
    
    cleanup(m)  //Deletes the message if this is a clean command
}

function candy(m)    //Handles a candy command
{
    if(data.hasOwnProperty(m.author.id))    //If user has candy
    {
        m.channel.send(m.author + " You have __**" + data[m.author.id] + "**__ candy!")    //Display users candy
    }
    else
    {
        m.channel.send(m.author + " You dont have any candy! :frowning: ")    //Display "no candy"
    }
    
    cleanup(m)  //Deletes the message if this is a clean command
}

function help(m)    //Handles a help command
{
    m.channel.send(":candy: **__CandyBot Help!__** :candy:\n```" + cmdPrefix + "help    Shows this help menu\n" + cmdPrefix + "pick    Picks up candy\n" + cmdPrefix + "candy   Shows your current candy\n" + cmdPrefix + "lb      Shows the leaderboard\n" + cmdPrefix + "buy     Buys a " + serverName + " Halloween Role! (Cost " + roleCost + ")```**CandyBot v" + version + "** active in: " + channelsString + "\n[_Made for " + serverName + "_] [_Created by " + superString + "_]")
    cleanup(m)  //Deletes the message if this is a clean command
}

function buy(m)    //Handles a buy command
{
    const name = m.author.id                                //Get users id
    const hasRole = m.member.roles.find("name", roleName)   //Get users role
    const role = m.guild.roles.find("name", roleName)       //Get the server role
    
    if(hasRole)    //If the user has the role
    {
        m.channel.send(m.author + " You already have the role! :joy: ")
        cleanup(m)  //Deletes the message if this is a clean command
        return
    }
    
    if(!data.hasOwnProperty(name))    //If the user has candy
    {
        m.channel.send(m.author + " You dont have any candy! :frowning: ")
        cleanup(m)  //Deletes the message if this is a clean command
        return
    }
    
    if(data[name] < roleCost)    //If the user does not have enough candy
    {
        m.channel.send(m.author + " You dont have enough candy! :frowning: (Need **__" + roleCost + "__**, you have **__" + data[name] + "__**)")
        cleanup(m)  //Deletes the message if this is a clean command
        return
    }
    
    updateData(name, -roleCost)         //Remove candy
    m.member.addRole(role, "Bot")       //Give the user the role
    m.channel.send(m.author + " You have bought the **" + roleName + "** Role! Keep trying to earn candy! :sparkles: ")
    saveData()  //Save user candy data
    cleanup(m)  //Deletes the message if this is a clean command
}

function lb(m)    //Handles a lb command
{
    const array = sort()    //Sort the data
    var lbStr = ":candy: **__CandyBot Leaderboard!__** :candy:\n```"    //Starting leaderboard string
    
    for(i = 0; i<10; i++)    //First 10 places
    {
        if(i>array.length-1){break}    //Exit if less then 10 people exist in the JSON data
        
        if(i < 9)
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
    cleanup(m)              //Deletes the message if this is a clean command
}

function cleanup(m)     //Deletes a command message if the command is clean
{
    var cmd = m.content.slice(cmdPrefix.length, m.length)   //Get the command
    
    if (cleanCmds.indexOf(cmd) != -1)   //If its clean
    {
        m.delete()  //Delete the message
    }
}

function updateData(name, amount)    //Updates JSON data
{
    if(data.hasOwnProperty(name))    //If user exists in the JSON data
    {
        data[name] = data[name]+amount    //Add candy to a user
    }
    else
    {
        data[name] = amount    //Set users candy level
    }
    
    saveData()    //Save JSON data
}

function sort()    //Sorts JSON data
{
      var sortedArray = []    //Create temp array

      for(var i in data)    //Search all JSON data
      {
        sortedArray.push([data[i], i])    //Populate array
    }

    return sortedArray.sort((a,b) => b[0] - a[0])    //Sort array on sort function
}

function format(n)    //Format string for data alignment
{
    var l = n.toString()
    
    if (l.length == 3)
    {
        return l + " "
    }
    
    if (l.length == 2)
    {
        return l + "  "
    }
    
    if (l.length == 1)
    {
        return l + "   "
    }
    
    return l
}

function idtoname(str)    //Converts a user ID to a username
{
    var user = client.users.find("id", str) //Gets the user
    
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

function arraySet(a, k, v)    //Sets array dara
{
    for(i in a)
    {
        if (a[i][0] == k)
        {
            a[i][1] = v
            return
        }
    }
}

function arrayFind(a, k)    //Finds array data
{
    for(i in a)
    {
        if (a[i][0] == k)
        {
            return a[i][1]
        }
    }
}
