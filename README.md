[![Node.js CI](https://github.com/versx/DeviceMonitor/actions/workflows/node.js.yml/badge.svg)](https://github.com/versx/DeviceMonitor/actions/workflows/node.js.yml)
![ts](https://badgen.net/badge/Built%20With/TypeScript/blue)
[![GitHub Release](https://img.shields.io/github/release/versx/DeviceMonitor.svg)](https://github.com/versx/DeviceMonitor/releases/)
[![GitHub Contributors](https://img.shields.io/github/contributors/versx/DeviceMonitor.svg)](https://github.com/versx/DeviceMonitor/graphs/contributors/)
[![Discord](https://img.shields.io/discord/552003258000998401.svg?label=&logo=discord&logoColor=ffffff&color=7389D8&labelColor=6A7EC2)](https://discord.gg/zZ9h9Xa)  

# Device Monitor

Discord bot to monitor device statuses for [RealDeviceMap](https://github.com/realdevicemap/realdevicemap). Displays device statuses grouped by: Online, Warned, and Offline in a Discord channel.  

## Features  
- Keeps track of device statuses
- Updates at an interval every specified minutes  
- Supports multiple Discord servers  
- Log level filtering  

## Preview  
![Image Preview](https://raw.githubusercontent.com/versx/DeviceMonitor/master/.github/images/preview.png)  

## Prerequisites
- [Node.js v16 or higher](https://nodejs.org/en/download)  

## Installation
1. Clone repository: `git clone https://github.com/versx/DeviceMonitor`  
1. Install packages: `npm install`  
1. Copy example config: `cp src/config.example.json src/config.json`  
1. Fill out config options.  
1. Build project in root folder: `npm run build`  
1. Run: `npm run start`  

## Updating  
1. Pull latest changes in root folder `git pull`  
1. Build project in root folder: `npm run build`  
1. Run: `npm run start`  

## Configuration  
```json
{
  // Clear all messages in channel upon startup.
  "clearMessagesOnStartup": true,
  // List of device names to ignore from the device status page.
  "ignoredDevices": [],
  // Interval in minutes to update the device status page.
  "updateIntervalM": 1,
  // List of Discord user IDs to send a direct message of device
  // status alerts.
  "userAlerts": [],
  // Discord bot configuration.
  "bot": {
    // Discord bot commands prefix.
    "prefix": "!",
    // Discord bot activity status.
    "status": "Monitoring devices...",
    // Discord bot client ID.
    "clientId": "<DISCORD_BOT_CLIENT_ID>",
    // Discord bot token.
    "token": "<DISCORD_BOT_TOKEN>"
  },
  // Logging configuration.
  "logs": {
    // Log level to filter logs by.
    // Available values:
    //  - trace (log everything)
    //  - debug (only log debug, info, warnings, and errors)
    //  - info (only log info, warnings, and errors)
    //  - warn (only log warnings and errors)
    //  - error (only log errors)
    //  - none (disable logging)
    "level": "info",
    // Log color dictionary.
    "colors": {
      // Normal text
      "text": "#ffffff",
      // Variables
      "variable": "#ff624d",
      // Dates
      "date": "#4287f5",
      // Errors
      "error": "#ff0000"
    }
  },
  // RealDeviceMap API configuration.
  "scanner": {
    // Backend scanner. rdm or golbat
    "type": "rdm",
    // URL of RealDeviceMap host, no trailing slashes.
    "url": "http://rdmip:9000",
    // Golbat API secret
    "secret": "",
    // RDM admin username to use with RDM API request.
    "username": "<RDM_ADMIN_USERNAME>",
    // RDM admin password to use with RDM API request.
    "password": "<RDM_ADMIN_PASSWORD>"
  },
  // Time delays configuration.
  "times": {
    // Minutes before a device is marked offline.
    "offlineM": 15,
    // Minutes before a device is marked wanred.
    "warningM": 10
  },
  // Discord guilds configuration.
  "servers": {
    // Discord guild ID.
    "<DISCORD_GUILD1_ID>": {
      // Descriptive name for Discord guild. (not actually used, just for your reference)
      "name": "<DESCRIPTIVE_NAME>",
      // Discord channel ID to post device status summary.
      "summaryChannelId": "00000000001"
    }
  }
}
```

## Credits  
- [Chuckleslove](https://github.com/Chuckleslove/RDMMonitor)  
- [Kneckter](https://github.com/Kneckter/RDMMonitor)  
