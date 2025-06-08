# DSU - Discord Server Utility Bot

DSU is an all-in-one Discord bot designed to help manage and enhance your server with powerful moderation, automation, translation, and interactive features. Whether you're running a small community or a large-scale server, DSU provides essential utilities to keep things organized, safe, and engaging.

---

## 🔧 Features

### Moderation & Automod
- **Automod system:** Block Discord links, prevent mention spam, ghost pings, filter bad words, and soft spam.
- **Customizable sanctions:** Warn, mute, kick, ban, with automatic warn logging.
- **Role ignore:** Configure roles to be ignored by automod.
- **Moderator roles:** Assign roles that can use moderation commands (ban, warn, kick, mute, viewwarn, clearwarn).

### Logging System
- **Event logging:** Track message edits/deletions, member joins/leaves, voice state updates (join/leave/switch), and moderation actions.
- **Configurable categories:** Enable/disable logs per category (arrived, farewell, vocal, mod, automod).
- **Log channel:** Set a dedicated channel for all logs.

### Leveling System
- **XP & Levels:** Members gain XP by chatting. Level-up gets harder as you progress.
- **Role boosters:** Assign roles that multiply XP gain.
- **Level-up messages:** Customizable embed sent in a configured channel when a member levels up.
- **Commands:** `/level setchannel`, `/level setrolebooster`, `/level enable`, `/level disable`, `/level status`, `/level reset`, `/level messagetest`.

### Welcome & Farewell
- **Welcome system:** Greet new members with a custom embed in a chosen channel.
- **Farewell system:** Send a custom embed when a member leaves.

### Announcement System
- **Announcement command:** Easily send announcements to a specified channel, with support for message presets.

### Translation System
- **Automatic translation:** Translate every message in the server using [LibreTranslate](https://libretranslate.com/) API.
- **Configurable source/target:** Set source and target languages per server.
- **Embed output:** Translated messages are sent as embeds with a custom footer.
- **Commands:** `/translation status`, `/translation enable`, `/translation disable`, `/translation setup source:<lang> target:<lang>`

### Slash Commands
- **Modern management:** All features are managed via clean and intuitive slash commands.
- **Dynamic reload:** `/reloadcommand` to reload all commands without restarting the bot.

---

## ⚙️ Configuration

- **settings.json:** All server-specific configurations are stored here (per guild ID).
- **No code editing required:** All major features are configurable via slash commands.

---

## 🚀 Getting Started

1. Clone the repository and install dependencies (`npm install`).
2. Configure your `config.json` and `.env` with your bot token and IDs.
3. Start the bot (`node index.js`).
4. Use slash commands to configure logs, automod, translation, leveling, and more.

---

## 🛠️ Main Slash Commands

- `/log enable|disable|status|reset`
- `/logchannelset salon:<channel>`
- `/automod enable|disable|status|category|sanction|ignore`
- `/moderatorrole role:<role> remove:true|false`
- `/level setchannel|setrolebooster|enable|disable|status|reset|messagetest`
- `/translation status|enable|disable|setup source:<lang> target:<lang>`
- `/reloadcommand`

---

## 📝 Notes

- **Permissions:** The bot requires permissions to manage roles, kick/ban members, manage messages, and send embeds.
- **Translation:** Uses the public [LibreTranslate API](https://libretranslate.com/). For production, consider self-hosting or using an API key.
- **Leveling:** XP gain and level progression are exponential and can be boosted by roles.
- **Automod:** All members (including admins) can be affected unless ignored by role.

---

## 📄 License

MIT License

---

**DSU - Discord Server Utility Bot**  
*Made with ❤️ for your community!*
