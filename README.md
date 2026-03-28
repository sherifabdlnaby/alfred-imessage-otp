# Alfred iMessage Code

Alfred workflow to grab verification codes from recent iMessages and copy them to clipboard.

macOS's built-in verification code autofill doesn't work in Chrome, so this provides a quick `otp` keyword to grab codes.

## Installation

1. Download the `.alfredworkflow` file from [Releases](https://github.com/sherifabdlnaby/alfred-imessage-code/releases)
2. Double-click to install in Alfred
3. Grant **Full Disk Access** to Alfred (System Settings → Privacy & Security → Full Disk Access)

## Usage

Type `otp` in Alfred to see recent verification codes from your iMessages.

- Select a code to copy it to clipboard
- Press `⌘L` on any result to see the full message text

## How it works

Reads the last 50 received messages from the past 24 hours from the iMessage database and extracts verification codes using:

1. **Keyword-anchored matching** - codes near words like "code", "OTP", "PIN", "verification", "passcode"
2. **Broad fallback** - any 4-8 digit number (filtering out years and round numbers)

## Requirements

- macOS
- [Alfred](https://www.alfredapp.com/) with Powerpack
- Full Disk Access for Alfred
