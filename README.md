# focuson

Pomodoro + Spotify + Cli + macOS.

## Usage

```
> focuson updating the docs
Reading config file from /Users/spiderman/.focuson.cfg.json
### 🧑🏻‍💻 Focus for 20min (1/3): updating the docs ###
Volume: 35
Playing focus music...
### 😌 Nice work, rest for 1min ###
Volume: 55
Playing rest music...
### 🧑🏻‍💻 Focus for 20min (2/3): updating the docs ###
Volume: 35
Playing focus music...
### 😌 Nice work, rest for 1min ###
Volume: 55
Playing rest music...
### 🧑🏻‍💻 Focus for 20min (3/3): updating the docs ###
Volume: 35
Playing focus music...
### 🎉 Congrats! You finished your focus sessions ###

Today's focused work:
updating the docs: 60min

View work log at /Users/raymondji/focuson.log.txt
Volume: 40
Playing done music...
Stopped music.
```

User configuration:

```
> cp .focuson.cfg.example.json $HOME/.focuson.cfg.json
```

Commandline flags

```
# do 5 focus sessions
> focuson --sessions 5
> focuson -s 5

# set focus time to 10min, rest time to 5min and play the done music for 20min
> focuson --focusDuration 10 --restDuration 5 --doneDuration 20
> focuson -f 10 -r 5 -d 20

# don't play music during the focus sessions
> focuson --quiet
> focuson -q
```

## Installation

Install the Spotify desktop app.

Clone this repo somewhere you're happy to leave it.

```
> npm install -g ${repo_path}
```

## Credits

Referenced [shpotify](https://github.com/hnarayanan/shpotify/blob/master/spotify) for spotify applescript commands.
