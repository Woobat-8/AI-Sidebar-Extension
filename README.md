<h1 align="center">AI Sidebar Chat</h1>

<p align="center">AI chat in a simple sidebar. Use your own API keys. Works with OpenAI and Google Gemini. Works with Firefox based browsers.</p>

<p align="center">
  <a href="#install-from-store">Install</a> |
  <a href="#download-locally">Download</a> |
  <a href="#usage">Usage</a> |
  <a href="#free-api-keys">Free API Keys</a> |
  <a href="#future-plans">Future Plans</a> |
  <a href="#known-issues">Known Issues</a> |
  <a href="#license-and-credits">License and Credits</a>
</p>

## Install from Store
>This extension requires you to have an active, working API key with either OpenAI's GPT or Google's Gemini. Your API key is stored locally and sent ONLY to the selected provider.
### Install the latest version from the [Firefox Extensions Page!](https://addons.mozilla.org/en-US/firefox/addon/ai-assistant-sidebar/)

#### View the latest version's release notes [here.](https://github.com/Woobat-8/AI-Sidebar-Extension/releases/latest)
#### Get a free Gemini API Key [here.](https://github.com/Woobat-8/AI-Sidebar-Extension/tree/main?tab=readme-ov-file#free-api-keys)

## Download Locally
>If you are unable to access the extensions page for your browser, or wish to modify the extension to your liking, you can run locally out of a .zip or .xpi file.

### Steps
#### Firefox-based:
1. Download the latest version [here.](https://github.com/Woobat-8/AI-Sidebar-Extension/releases)
2. Go to `about:addons` → `Settings` → `Install Add-on From File` and select the `ai-sidebar-extension.zip` or `.xpi` file.
3. To modify, unzip `ai-sidebar-extension`, open in your IDE of choice and modify!
4. Once you've made your changes, re-zip to a `.zip` or `.xpi` file and repeat Step 2.
5. If you don't wish to re-zip, go to `about:debugging` → `This [browser]` → `Load Temporary Add-on` and select `manifest.json` to load.

## Usage
>This extension requires you to have an active, working API key. Google Gemini offers a "Free" plan with limits to users with a valid Google account. OpenAI does not offer a free plan, but has reasonable, relatively cheap token prices.
1. Install or Download `.zip`/`.xpi`
2. Run the extension and go to `Options` when prompted
3. Select your provider, input your API key, select your model, and press `Save`
4. Reload the extension if it doesn't automatically, and chat!

## Free API Keys
>A "Free" tier is available through Google's Gemini with acceptable limits on lighter models. Signing up requires a Google account that has a verified age.
1. Go to [aistudio.google.com](https://aistudio.google.com/api-keys) and sign in.
2. Click `Get API Key` in the bottom-left sidebar.
3. Select `Create API key in New Project`
4. Your API key will be displayed, **copy it and save it somewhere local** as you won't be able to view it again.
5. Paste the key into the `Options` menu when prompted and Save.
6. Select the recommended model and begin chat!

## Future Plans
>One or more of these will be included in the next **minor** version.
### In no particular order:
- Chromium Support (priority)
- Safari Support
- Claude AI Option
- Deepseek Option
- Save Chats
- Popout sidebar
- Read from current page (as context)
- Upload images (for applicable models)

## Known Issues
>If you've encountered an issue not listed here, report it [here.](https://github.com/Woobat-8/AI-Sidebar-Extension/issues) This covers known issues or untested features I’m aware of and actively working on. One or more will **likely** be fixed in the next **patch**.
- Very long responses sometimes cause UI to scale incorrectly. (Happened twice, unable to reproduce reliably)

## License and Credits
#### Licensed under the [GPLv3 License.](https://github.com/Woobat-8/AI-Sidebar-Extension/blob/main/LICENSE) Special thanks to a friend for helping with the JavaScript files `background.js` and `chat.js`!
#### © 2026 [Woobat8](https://github.com/Woobat-8)
