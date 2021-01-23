# focuson

Pomodoro + Spotify + Command line + macOS.

## Usage

```
> focuson building todo app
Reading config file from /Users/spiderman/.focuson.cfg.json
### 🧑🏻‍💻 Focus for 20min (1/3): building todo app ###
Volume: 35
Playing focus music...
### 😌 Nice work, rest for 1min ###
Volume: 55
Playing rest music...
### 🧑🏻‍💻 Focus for 20min (2/3): building todo app ###
Volume: 35
Playing focus music...
### 😌 Nice work, rest for 1min ###
Volume: 55
Playing rest music...
### 🧑🏻‍💻 Focus for 20min (3/3): building todo app ###
Volume: 35
Playing focus music...
### 🎉 Congrats! You finished your focus sessions ###

Today's focused work:
60min building todo app
40min learning nodejs

View work log at /Users/raymondji/focuson.log.json
Volume: 40
Playing done music...
Stopped music.
```

User configuration:

```
> cp .focuson.cfg.example.json $HOME/.focuson.cfg.json
```

Command line flags

```
# do 5 focus sessions
> focuson --sessions 5
> focuson -s 5

# set focus time to 10min, rest time to 5min and play the done music for 20min
> focuson --focusDuration 10 --restDuration 5 --doneDuration 20
> focuson -f 10 -r 5 -d 20

# don't play music during the focus sessions
> focuson learning javascript --quiet
> focuson learning javascript -q
```

## Installation

Install the Spotify desktop app.

Clone this repo somewhere you're happy to leave it.

```
> npm install -g ${repo_path}
```

## Future work

Add linux support via https://github.com/pwittchen/spotify-cli-linux.

## Credits

Referenced [shpotify](https://github.com/hnarayanan/shpotify/blob/master/spotify) for spotify applescript commands.
