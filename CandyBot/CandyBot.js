////////////////////////////////////////////////////////////////////////
//                              CANDYBOT                              //
////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////
// Holiday Event Bot for Discord                                      //
// By axc450 (Github) / Super#0100 (Discord)                          //
//                                                                    //
// CandyBot spawns candy based off sent messages.                     //
// Users can collect the candy and use it to buy event discord roles. //
////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////
// Commands:                                  //
//                                            //
// help         Shows the CandyBot help menu  //
// pick         Picks up candy when it spawns //
// candy        Shows the users current candy //
// lb           Shows the leaderboard         //
// roles        Shows the buyable roles       //
// buy <num>    Attempts to buy an event role //
////////////////////////////////////////////////

/////////////////////////
// Setup - DO NOT EDIT //
/////////////////////////

const version           = 1.4                       //CandyBot Version
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

const chance            = 0.5              //Chance to spawn a candy (0 = 0%, 1 = 100%)
const candyMin          = 1                //Minimum candy to drop
const candyMax          = 10               //Maximum candy to drop
const serverName        = "My Server"      //Name of your server
const roleData          = [["Role1", 10], ["Role2", 20]]  //Role names & costs
const activeChannels    = ["Channel 1", "Channel 2"]      //Text channels the bot is active in
const cleanCmds         = ["pick", "buy"]                 //Commands that are 'clean' (command message auto-deleted)

const pickLimit         = 3                 //Amount of times users can .pick in a row
const blacklist_roles   = ["BadRole"]       //Roles that cannot interact with CandyBot
const blacklist_users   = ["BadUser#1234"]  //Users that cannot interact with CandyBot

const cmdPrefix         = "."   //Command prefix
const discordID         = "???????????????????????????????????????????????????????????"    //Discord Bot API Token

////////////////////////
// Code - DO NOT EDIT //
////////////////////////

const candyMsg          = ":candy::candy::candy::candy::candy::candy::candy:\n**Random Candy Appeared!**\n_Type **" + cmdPrefix + "pick** to pick them up!_"    //Bot message on candy proc

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
        channelsString = channelsString + client.channels.find("name",c) + " "
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
        if (m.content == candyMsg)    //If the bot dropped some candy
        {
            arraySet(pickid, m.channel.name, m.id)    //Store the message ID of the dropped candy message
        }
        return    //Exit
    }
    
    if (arrayFind(lastSent, m.channel.name) != m.author.id)  //If a different user has spoken
    {
        arraySet(lastSent, m.channel.name, 0)   //Allow candy to drop
    }

    if (Math.random() < chance && !arrayFind(readyForPicking, m.channel.name) && (arrayFind(lastSent, m.channel.name) != m.author.id) && !m.content.startsWith(cmdPrefix))    //If the requirements to drop candy are met
    {
        m.channel.send(candyMsg)    //Drop candy
        arraySet(readyForPicking, m.channel.name, true)    //Dont drop more until the candy has been picked
        arraySet(lastSent, m.channel.name, m.author.id)
    }
    
    if (!m.content.startsWith(cmdPrefix)){return}                  //Exit if the message is not a CandyBot command
    if (findBlacklistRoles(m.member.roles)){cleanup(m); return}    //Exit if user role is in the blacklist
    if (blacklist_users.indexOf(m.member.user.tag) != -1){cleanup(m); return}    //Exit if user tag is in the blacklist
    
    switch (m.content) //Command List
    {
        case (cmdPrefix + "pick"): pick(m); break        //Pick
        case (cmdPrefix + "candy"): candy(m); break      //Candy
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
    if (arrayFind(readyForPicking, m.channel.name) && !(lastPick[0] == m.author.id && lastPick[1] >= pickLimit))    //If there has been candy dropped and user hasnt hit the pick limit
    {
        const amount = getRandomInt(candyMin, candyMax)                              //Create a random amount of candy
        m.channel.messages.find("id", arrayFind(pickid, m.channel.name)).delete()    //Delete the candy drop message
        m.channel.send(m.author + " picked up __**" + amount + "**__ :candy: !")     //Send the picked message
        updateData(m.author.id, amount)                                              //Update the users candy level
        arraySet(readyForPicking, m.channel.name, false)                             //Set the bot to start dropping candy
        
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

function candy(m)    //Handles a candy command
{
    if (data.hasOwnProperty(m.author.id))    //If user has candy
    {
        m.channel.send(m.author + " You have __**" + data[m.author.id] + "**__ candy!")    //Display users candy
    }
    else
    {
        m.channel.send(m.author + " You dont have any candy! :frowning: ")    //Display "no candy"
    }
}

function help(m)    //Handles a help command
{
    m.channel.send(":candy: **__Candy Bot Help!__** :candy:\n```" + cmdPrefix + "help        Shows this help menu\n" + cmdPrefix + "pick        Picks up candy\n" + cmdPrefix + "candy       Shows your current candy\n" + cmdPrefix + "lb          Shows the leaderboard\n"  + cmdPrefix + "roles       Shows the buyable roles (inc. role numbers & cost)\n" + cmdPrefix + "buy <num>   Buys a " + serverName + " Event Role```**CandyBot v" + version + "** active in: " + channelsString + "\n[_Made for " + serverName + "_] [_Created by " + superString + "_]")
}

function roles(m)
{
    var rolesStr = ":candy: **__CandyBot Roles!__** :candy:\n```"   //Starting roles string
    
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
    
    if (!data.hasOwnProperty(name))    //If the user has candy
    {
        m.channel.send(m.author + " You dont have any candy! :frowning: ")
        cleanup(m)  //Deletes the message if this is a clean command
        return
    }
    
    if (data[name] < roleSelection[1])    //If the user does not have enough candy
    {
        m.channel.send(m.author + " You dont have enough candy! :frowning: (Need **__" + roleSelection[1] + "__**, you have **__" + data[name] + "__**)")
        cleanup(m)  //Deletes the message if this is a clean command
        return
    }
    
    updateData(name, -roleSelection[1])         //Remove candy
    m.member.addRole(role, "Bot")       //Give the user the role
    m.channel.send(m.author + " You have bought the **" + roleSelection[0] + "** Role! Keep trying to earn candy! :sparkles: ")
    saveData()  //Save user candy data
}

function lb(m)    //Handles a lb command
{
    const array = sort()    //Sort the data
    var lbStr = ":candy: **__CandyBot Leaderboard!__** :candy:\n```"    //Starting leaderboard string
    
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
