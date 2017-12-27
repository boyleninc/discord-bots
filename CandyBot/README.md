# CandyBot <img src="https://discordapp.com/assets/49b17ff287afeb1d5feffe0e7af3c2ec.svg" width="28" height="28">

Holiday Event Bot for Discord
By axc450 (Github) / Super#0100 (Discord)

CandyBot spawns currency based off sent messages.
Users can collect the currency and use it to buy event discord roles.

## Commands

| Command                       | Usage                                 | Type  |
|-------------------------------|---------------------------------------|-------|
| `help`                          | Shows the CandyBot help menu          | User  |
| `info` ![new](https://i.imgur.com/sBZ8aDu.png)                         | Shows the CandyBot info menu          | User  |
| `pick`                          | Picks up currency when it spawns      | User  |
| `value`                         | Shows the users current currency      | User  |
| `lb`                            | Shows the leaderboard                 | User  |
| `roles`                         | Shows the buyable roles               | User  |
| `buy <num>`                   | Attempts to buy an event role         | User  |
| `gift <user> <num>` ![new](https://i.imgur.com/sBZ8aDu.png)         | Gifts currency to another user                 | User |
| `force` ![new](https://i.imgur.com/sBZ8aDu.png)                         | Forces a currency proc                | Admin |
| `chance <num>` ![new](https://i.imgur.com/sBZ8aDu.png)                | Changes the chance of a currency proc | Admin |
| `candy <max/min/cap> <num>` ![new](https://i.imgur.com/sBZ8aDu.png) | Changes basic currency config         | Admin |
| `channel <name>` ![new](https://i.imgur.com/sBZ8aDu.png)              | Add/Remove an active channel          | Admin |
| `pickcap <num>` ![new](https://i.imgur.com/sBZ8aDu.png)               | Changes successive pick limit         | Admin |
| `blacklist <user>` ![new](https://i.imgur.com/sBZ8aDu.png)            | Add/Remove a user to the blacklist    | Admin |
| `give <user> <num>` ![new](https://i.imgur.com/sBZ8aDu.png)         | Gives a user currency                 | Admin |

## Changelog

#### v1.8

- Added `.info` command which shows CandyBot info & stats
	- Stats are automatically collected and stored in an external JSON (stats.json)
- Added `.gift` command which allows users to transfer their currency
- Bug Fixes
- Code Cleanup

#### v1.7

- All config data has been moved to an external JSON (config.json)
- Added full set of admin commands to allow change of config while the bot is running (see Commands above)
- Changed `.candy` command to `.value`
- Bug Fixes
- Code Cleanup
	- All code has been rewritten to accommodate the config JSON
	- All new code has been commented
	- Less code duplication
	- More helper functions

#### v1.6

- Added custom currency & emoji 
- Added optional candy cap
	- 0 = no cap
- Code Cleanup
	- CandyBot commands now ignore ASCII case
	- All code has been converted to use 'Currency' instead of 'Candy' to reflect custom currency

#### v1.5

- Added more spam protection
	- Amount of times a user can `.pick` in a row
- Added blacklists
	- Users
	- Roles
- Added Roadmap
- Bug Fixes
- Code Cleanup

#### v1.4

- Added Multirole Support
- Added `.roles` command to display buyable roles and their costs
- Bug Fixes

#### v1.3

- Added Changelog
- Added 'Clean Commands'
	- Commands that are 'clean' are automatically deleted when typed by a user
- Added custom command prefixes
	- e.g. `.pick`, `/pick`, `!pick`
- Bug Fixes
- Code Cleanup

#### v1.2

- Added Spam Protection
	- A user cannot cause candy to spawn if no-one else has been active in the text channel since the last candy spawn
- Bug Fixes

#### v1.1

- Added configurable bot options
- Added author details
- Code Cleanup
- Bug Fixes

#### v1.0

- CandyBot Release

## Roadmap

### Major

- Shop Overhaul!
	- Multiple types
		- Roles (:scroll:)
		- Bot Upgrades (:arrow_up:)
		- Currency (:moneybag:)
		- Discord Event? (Custom Message, Pins etc) (:desktop:)
	- Rename `.roles` to `.shop`
- Multicurrency
	- `.force` rework/rethink
- Embeds
- Setup application
- Convert CandyBot to exclusively use Discord IDs rather then names
- Error Logging + More console output

### Minor

- Redesign external file structure
- `.force` does nothing if the channel is ready for picking
- Channel-Specific Spawn Rates
- Ordered Roles
	- Users must buy the roles in order
- Custom Currency Proc Message
- Add `.multipick` code + command
	- `.multipick 3` = 3 people can .pick when it spawns
- `.gift` with no user spawns a proc of that amount
- Leaderboard rework/rethink
- Donate button
- Split 'Active' channels into 'Command' channels and 'Droppable' channels
- Split currency 'Name' into 'Singular Name' and 'Plural Name'
- Stop users from gifting themselfs
- Channel activation requires channel tag
- `.value <user>` shows their value

### Bugfixes

- Leaderboard fix when noone has candy
	- `.lb <page number>`
	- Always show current user
	- Gifting leaderboard?
- Role list fix when only one role
- Better Error Checking
- Make non existant JSON data message the same as 0 currency gained message
- Change "given" -> "Gifted" (`.gift` message)
- Remove the word "Total" from `.info`
- Reconnect fix
	- Array data can be duplicated if the bot loses connection but successfully reconnects
- Floor user input after sanitizing
- Admins cannot blacklist themselves
- Decimal number issue (`.chance 7`)