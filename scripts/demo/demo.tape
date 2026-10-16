# Records the real Claude Code session behind assets/demo.gif (https://github.com/charmbracelet/vhs).
#
# Setup: a scratch project directory with a .mcp.json that runs `npx -y stock-images-mcp@latest` with your
# provider keys in env and STOCK_IMAGES_DOWNLOAD_DIR=./downloads, and a throwaway Claude Code config
# (CLAUDE_CONFIG_DIR) so no personal settings appear. Adjust the paths below to match.
# Record:  vhs demo.tape   -> session.mp4, then copy the downloaded photo to hero.jpg and run make-gif.sh.
# The session is real and not deterministic: re-record until the agent searches, downloads and gives the credit.
# Delete the scratch project and config afterwards: they hold your API keys.

Output session.mp4

Set Shell bash
Set FontSize 18
Set Width 1000
Set Height 720
Set Padding 16
Set Theme "Catppuccin Mocha"
Set Framerate 30

Hide
Type "cd /private/tmp/demo-stock-images-mcp-proj && export CLAUDE_CONFIG_DIR=/private/tmp/demo-stock-images-mcp-config && export PS1='$ ' && rm -rf downloads && mkdir downloads && clear"
Enter
Sleep 1s
Show

Type "claude --mcp-config /private/tmp/demo-stock-images-mcp-proj/.mcp.json --strict-mcp-config"
Enter
Wait+Screen@30s /Try|\? for shortcuts|esc to interrupt|❯/
Sleep 1s

Type "Find three photos of a rainy city street at night and download the most atmospheric landscape one. Tell me why you picked it and the credit to add."
Sleep 1s
Enter

Wait+Screen@240s /done at|done \d+:\d+/
Sleep 4s
