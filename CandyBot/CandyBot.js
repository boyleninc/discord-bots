////////////////////////////////////////////////////////////////////////
//                              CANDYBOT                              //
////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
// Holiday Event Bot for Discord                                         //
// By axc450 (Github) / Super#0100 (Discord)                             //
//                                                                       //
// CandyBot spawns currency based off sent messages.                     //
// Users can collect the currency and use it to buy event discord roles. //
//                                                                       //
//                      READ THE README FOR HELP!!!                      //
///////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
// Config:                                                                  //
//                                                                          //
// currency        Currency name                                            //
// emoji           Currency emoji                                           //
// chance          Chance to spawn currency (0 = 0%, 1 = 100%)              //
// currMin         Minimum currency to drop                                 //
// currMax         Maximum currency to drop                                 //
// currCap         Maximum currency a user can hold (0 = no cap)            //
// serverName      Name of your server                                      //
// roleData        Role names & costs                                       //
// activeChannels  Text channels the bot is active in                       //
// cleanCmds       Commands that are 'clean' (command message auto-deleted) //
// pickLimit       Amount of times users can .pick in a row                 //
// blacklist_roles Roles that cannot interact with CandyBot                 //
// blacklist_users Users that cannot interact with CandyBot                 //
// cmdPrefix       Command prefix                                           //
// discordID       Discord Bot API Token                                    //
//////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////
// Commands:                                                                  //
//                                                                            //
// help                         Shows the CandyBot help menu            user  //
// pick                         Picks up currency when it spawns        user  //
// value                        Shows the users current currency        user  //
// lb                           Shows the leaderboard                   user  //
// roles                        Shows the buyable roles                 user  //
// buy <num>                    Attempts to buy an event role           user  //
// force                        Forces a currency proc                  admin //
// chance <num>                 Changes the chance of a currency proc   admin //
// candy <max/min/cap> <num>    Changes basic currency config           admin //
// channel <name>               Add/Remove an active channel            admin //
// pickcap <num>                Changes successive pick limit           admin //
// blacklist <user>             Add/Remove a user to the blacklist      admin //
// give <user> <num>                 Gives a user currency              admin //
////////////////////////////////////////////////////////////////////////////////

////////////////////////
// Code - DO NOT EDIT //
////////////////////////

const version           = 1.7                       //CandyBot Version
const Discord           = require("discord.js")     //Discord API
const fs                = require("fs")             //File System
const client            = new Discord.Client()      //CandyBot Instance
var data                = require("./data.json")    //CandyBot Data
var config              = require("./config.json")  //CandyBot Config
var readyForPicking     = []                        //Proccable channels
var pickid              = []                        //Last currency proc message
var lastSent            = []                        //Last user currency proc
var rolesList           = []                        //Sorted array of buyable roles
var lastPick            = [0, 0]                    //Last user currency pick
var channelsString      = ""                        //Active channels
var superString         = ""                        //Author String

const currMsg          = config.emoji + config.emoji + config.emoji + config.emoji + config.emoji + config.emoji + config.emoji + config.emoji + "\n**Random " + config.currency + " Appeared!**\n_Type **" + config.cmdPrefix + "pick** to pick it up!_"    //Bot message on currency proc

client.login(config.discordID)    //Connects to discord via the token

client.on("ready", () =>    //When the bot connected
{
    console.log("Setting up " + config.serverName + " Bot...")    //Log message

    for (var c of config.activeChannels)           //For all channels the bot is active in
    {
        channelVariables(c, true)                  //Set up environment variables
    }
    
    for (var r in config.roleData)                 //For all buyable roles
    {
        rolesList.push([r, config.roleData[r]])    //Set up role data
    }
    
    setupSuperString()  //Setup author string
    
    console.log("Channel array populated: " + readyForPicking)  //Log message
    console.log("Channel array populated: " + pickid)           //Log message
    console.log("Channel array populated: " + lastSent)         //Log message
    console.log("Roles list populated: " + rolesList)           //Log message
    
    console.log(config.serverName + " Bot Started!")            //Log message
})

client.on("message", (m) =>        //When a message is sent
{
    if (config.activeChannels.indexOf(m.channel.name) == -1){return}    //Exit if its an inactive channel
    
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

    if (Math.random() < config.chance && !arrayFind(readyForPicking, m.channel.name) && (arrayFind(lastSent, m.channel.name) != m.author.id) && !m.content.startsWith(config.cmdPrefix))    //If the requirements to drop currency are met
    {
        proc(m) //Proc a currency drop
    }
    
    if (!m.content.startsWith(config.cmdPrefix)){return}    //Exit if the message is not a CandyBot command
    
    const args = cmdFormat(m.content)    //Format the command and extract arguments
    
    if (userHasRole(m.member.roles, config.blacklist_roles)){m.delete(); return}        //Exit if user role is in the blacklist
    if (config.blacklist_users.indexOf(m.member.user.tag) != -1){m.delete(); return}    //Exit if user tag is in the blacklist
    
    switch (args[0]) //Command List (user)
    {
        case ("pick"): pick(m); break        //Pick
        case ("value"): value(m); break      //Value
        case ("help"): help(m); break        //Help
        case ("roles"): roles(m); break      //Roles
        case ("lb"): lb(m); break            //Leaderboard
        case ("buy"): buy(m, args); break    //Buy
    }
    
    if (!userHasRole(m.member.roles, config.admin_roles)){cleanup(m, args); return}     //Exit if the user does not have an admin role
    
    switch (args[0]) //Command List (admin)
    {
        case ("force"): proc(m); break                  //Force
        case ("chance"): chance(m, args); break         //Chance
        case ("candy"): candy(m, args); break           //Candy
        case ("channel"): channel(m, args); break       //Channel
        case ("pickcap"): pickcap(m, args); break       //Pick Cap
        case ("blacklist"): blacklist(m, args); break   //Blacklist
        case ("give"): give(m, args); break             //Candy
    }
    
    cleanup(m, args)    //Delete the command if it is clean
})

function proc(m)    //Procs a currency drop
{
    m.channel.send(currMsg)    //Drop currency
    arraySet(readyForPicking, m.channel.name, true)    //Dont drop more until the currency has been picked
    arraySet(lastSent, m.channel.name, m.author.id)    //Store the user that procced the currency drop
}

function pick(m)    //Handles a pick command
{
    if (arrayFind(readyForPicking, m.channel.name) && !(lastPick[0] == m.author.id && lastPick[1] >= config.pickLimit))    //If there has been currency dropped and user hasnt hit the pick limit
    {
        const amount = getRandomInt(config.currMin, config.currMax)                              //Create a random amount of currency
        m.channel.messages.find("id", arrayFind(pickid, m.channel.name)).delete()    //Delete the currency drop message
        m.channel.send(m.author + " picked up __**" + amount + "**__ " + config.emoji + " !")     //Send the picked message
        updateCandyData(m.author.id, amount)                                              //Update the users currency value
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

function value(m)    //Handles a value command
{
    if (data.hasOwnProperty(m.author.id))    //If user has currency
    {
        m.channel.send(m.author + " You have __**" + data[m.author.id] + "**__ " + config.emoji + "!")    //Display users currency
    }
    else
    {
        m.channel.send(m.author + " You dont have any " + config.emoji + "! :frowning: ")    //Display "no currency"
    }
}

function help(m)    //Handles a help command
{
    channelsString = ""
    for (var c of config.activeChannels)    //Regenerate channel string
    {
        channelsString = channelsString + client.channels.find("name",c).toString() + " "
    }
    
    m.channel.send(config.emoji + " **__CandyBot Help!__** " + config.emoji + "\n```" + config.cmdPrefix + "help        Shows this help menu\n" + config.cmdPrefix + "pick        Picks up " + config.currency + "\n" + config.cmdPrefix + "value       Shows your current " + config.currency + "\n" + config.cmdPrefix + "lb          Shows the leaderboard\n"  + config.cmdPrefix + "roles       Shows the buyable roles (inc. role numbers & cost)\n" + config.cmdPrefix + "buy <num>   Buys a " + config.serverName + " Event Role```**CandyBot v" + version + "** active in: " + channelsString + "\n[_Made for " + config.serverName + "_] [_Created by " + superString + "_]")
}

function roles(m)   //Handles a roles command
{
    var rolesStr = config.emoji + " **__CandyBot Roles!__** " + config.emoji + "\n```"   //Starting roles string
    
    for(i = 0; i<rolesList.length; i++)  //Get all roles
    {   
        if(i < 9)
        {
            rolesStr = rolesStr + (i+1) + ".    " + rolesList[i][0] + "    " + rolesList[i][1] + "\n" //Form roles string
        }
        else
        {
            rolesStr = rolesStr + (i+1) + ".   " + rolesList[i][0] + "    " + rolesList[i][1] + "\n"  //Form roles string
        }
    }
    
    rolesStr = rolesStr + "```_Type **" + config.cmdPrefix + "buy <num>** to buy a role!_"     //Add a suffix
    m.channel.send(rolesStr)   //Send the leaderboard string
}

function buy(m, args)    //Handles a buy command
{
    const roleNum = Number(args[1])   //Get the role number based on the argument
    
    if (!roleNum || roleNum > rolesList.length || roleNum < 0) {return}     //Exit if a valid role hasnt been selected
    
    const roleSelection = rolesList[roleNum-1]               //Get selected role
    const name = m.author.id                                //Get users id
    const hasRole = m.member.roles.find("name", roleSelection[0])   //Get users role
    const role = m.guild.roles.find("name", roleSelection[0])       //Get the server role
    
    if (!role)   //If the role doesnt exist
    {
        console.log("Something Went Wrong! (Role does not exist)")    //Throw error
        return
    }
    
    if (hasRole)    //If the user has the role
    {
        m.channel.send(m.author + " You already have the role! :joy: ")
        return
    }
    
    if (!data.hasOwnProperty(name))    //If the user has no currency
    {
        m.channel.send(m.author + " You dont have any " + config.emoji + "!")
        return
    }
    
    if (data[name] < roleSelection[1])    //If the user does not have enough currency
    {
        m.channel.send(m.author + " You dont have enough " + config.emoji + "! (Need **__" + roleSelection[1] + "__**, you have **__" + data[name] + "__**)")
        return
    }
    
    updateCandyData(name, -roleSelection[1])         //Remove currency
    m.member.addRole(role, "Bot")       //Give the user the role
    m.channel.send(m.author + " You have bought the **" + roleSelection[0] + "** Role! Keep trying to earn " + config.emoji + "!")
    saveData()  //Save user currency data
}

function chance(m, args)    //Handles a chance command
{
    const procChance = Number(args[1])  //The new proc chance
    
    if (isNaN(procChance) || procChance > 100 || procChance < 0) {return}     //Exit if invalid input
    
    config["chance"] = procChance/100     //Set the proc chance
    m.channel.send(config.emoji + " drop chance in " + m.channel + " has been changed to **__" + procChance + "%__** by " + m.author + "!")
    
    saveData(1) //Save the JSON data
}

function candy(m, args)    //Handles a candy command
{
    const op = args[1]              //The candy operation to perform
    const value = Number(args[2])   //The value to apply to the operation
    
    if (isNaN(value) || value < 0) {return}     //Exit if invalid input
    
    switch(op)  //Operation list
    {
        case ("min"):
            config["currMin"] = value     //Set the minimum currency drop
            m.channel.send(config.emoji + " minimum has been changed to **__" + value + "__** by " + m.author + "!")
            break
        case ("max"):
            config["currMax"] = value     //Set the maximum currency drop
            m.channel.send(config.emoji + " minimum has been changed to **__" + value + "__** by " + m.author + "!")
            break
        case ("cap"):
            config["currCap"] = value     //Set the currency cap
            m.channel.send(config.emoji + " cap has been changed to **__" + value + "__** by " + m.author + "!")
            break
    }
    
    saveData(1) //Save the JSON data
}

function channel(m, args)    //Handles a channel command
{
    const value = args[1]  //The channel to activate/deactive
    const ch = client.channels.find("name", value)  //Find if the channel exists
    
    if (!ch) {return}     //Exit if invalid input
    
    if(config.activeChannels.indexOf(ch.name) == -1)    //If the channel is not active
    {
        config["activeChannels"].push(ch.name)  //Add it to the list of active channels
        channelVariables(ch.name, true)         //Set up environment variables
        ch.send("CandyBot has been **enabled** in this channel by " + m.author + "!")
    }
    else    //If the channel is active
    {
        config["activeChannels"].splice(config.activeChannels.indexOf(ch.name), 1)  //Remove it from the list of active channels
        channelVariables(ch.name, false)    //Remove environment variables
        ch.send("CandyBot has been **disabled** in this channel by " + m.author + "!")
    }
    
    saveData(1) //Save the JSON data
}

function pickcap(m, args)    //Handles a pickcap command
{
    const newCap = Number(args[1])  //The new pick limit
    
    if (isNaN(newCap) || newCap < 1) {return}     //Exit if invalid input
    
    config["pickLimit"] = newCap    //Set the new pick limit
    m.channel.send(config.emoji + " pick limit has been changed to **__" + newCap + "__** by " + m.author + "!")
    
    saveData(1) //Save the JSON data
}

function blacklist(m, args)    //Handles a blacklist command
{
    const value = args[1]  //The user
    const user = client.users.get(value.substr(2).slice(0, -1)) //Search for the user
    
    if (!user) {return}     //Exit if invalid input
    
    if(config.blacklist_users.indexOf(user.tag) == -1)  //If user isnt in the blacklist
    {
        config["blacklist_users"].push(user.tag)    //Add the user to the blacklist
        m.channel.send(user + " has been **added** to the CandyBot blacklist by " + m.author + "!")
    }
    else
    {
        config["blacklist_users"].splice(config.blacklist_users.indexOf(user.tag), 1)   //Remove the user from the blacklist
        m.channel.send(user + " has been **removed** from the CandyBot blacklist by " + m.author + "!")
    }
    
    saveData(1) //Save the JSON data
}

function give(m, args)    //Handles a give command
{
    const u = args[1]   //The user
    const value = Number(args[2])   //The amount of currency to give
    const user = client.users.get(u.substr(2).slice(0, -1)) //Search for the user
    
    if (isNaN(value) || !user) {return}     //Exit if invalid input
    
    updateCandyData(user.id, value)         //Update the users currency value
    m.channel.send(user + " You have been given **__" + value + "__** " + config.emoji + " by " + m.author + "! (You now have **__" + data[user.id] + "__** " + config.emoji + ")")
    
    saveData(0) //Save the JSON data
}

function lb(m)    //Handles a lb command
{
    const array = sort()    //Sort the data
    var lbStr = config.emoji + " **__CandyBot Leaderboard!__** " + config.emoji + "\n```"    //Starting leaderboard string
    
    for (var i = 0; i<10; i++)    //First 10 places
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

function cleanup(m, args)     //Deletes a command message if the command is clean
{
    if (config.cleanCmds.indexOf(args[0]) != -1)   //If its clean
    {
        m.delete()  //Delete the message
    }
}

function updateCandyData(name, amount)    //Updates JSON data
{
    if (data.hasOwnProperty(name))    //If user exists in the JSON data
    {
        if (data[name]+amount >= config.currCap && config.currCap != 0)     //If currency cap has been reached
        {
            data[name] = config.currCap              //Cap currecny
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
    
    saveData(0)    //Save JSON data
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

function saveData(file)    //Save JSON data
{
    if (file == 0)  //Save currency data
    {
        fs.writeFile("data.json", JSON.stringify(data, null, 2), 'utf8', (error) => { if (error) {console.log("Something Went Wrong!")} })
    }
    else            //Save config data
    {
        fs.writeFile("config.json", JSON.stringify(config, null, 2), 'utf8', (error) => { if (error) {console.log("Something Went Wrong!")} })
    }
    
}

function getRandomInt(min, max)    //Return random integer
{
    return Math.floor(Math.random() * (max - min + 1)) + min
}

function setupSuperString() //Set author strong
{
    superString = client.users.get("157591768177573888")       //Get Super tag
    
    if (superString == undefined)    //If Super is not on the server
    {
        superString = "Super#0010"  //Use Discord tag instead
    }
}

function userHasRole(r1, r2)    //Checks if a user has a role that exists within a role database
{
    for (var r of r2)
    {
        if(r1.find("name", r)){return true}
    }
    return false
}

function channelVariables(c, disabled)   //Handles environment variables for core channel data
{
    if(disabled) //If the channel is to be enabled, add channel data
    {
        readyForPicking.push([c, false])
        pickid.push([c, 0])
        lastSent.push([c, 0])
    }
    else        //If the channel is to be disabled, search for and remove channel data
    {
        for(var i = 0; i < readyForPicking.length; i++)
        {
            if(readyForPicking[i][0] == c)
            {
                readyForPicking.splice(i, 1)
            }
        }
        
        for(var i = 0; i < pickid.length; i++)
        {
            if(pickid[i][0] == c)
            {
                pickid.splice(i, 1)
            }
        }
        
        for(var i = 0; i < lastSent.length; i++)
        {
            if(lastSent[i][0] == c)
            {
                lastSent.splice(i, 1)
            }
        }
    }
}

function cmdFormat(command) //Formats an entered command and extracts arguments
{
    command = command.substr(config.cmdPrefix.length)  //Remove the command prefix
    command = command.toLowerCase()                    //Ignore uppercase/lowercase in a command
    return command.split(" ")                          //Split command
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
