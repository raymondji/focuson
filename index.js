const commandLineArgs = require("command-line-args");
const { exec } = require("child_process");

const cliArgsDefinitions = [
  {
    name: "goal",
    alias: "g",
    type: String,
    multiple: true,
    defaultOption: true,
  },
  { name: "sessions", alias: "s", type: String },
  { name: "focusDuration", alias: "f", type: Number },
  { name: "restDuration", alias: "r", type: Number },
  { name: "quiet", alias: "q", type: Boolean },
];

const focusUri = "spotify:playlist:0vvXsWCC9xrXsKd4FyS8kM";
const restUri = "spotify:track:7HrE6HtYNBbGqp5GmHbFV0";
const doneUri = "spotify:playlist:4ZcGI2hFTy5Rruln175z9X";
const cliArgs = commandLineArgs(cliArgsDefinitions);

const goal = cliArgs.goal ? cliArgs.goal.join(" ") : null;
const defaultSessions = 3;
const sessions = cliArgs.sessions ? cliArgs.sessions : defaultSessions;
const defaultFocusDuration = 20;
const focusDuration = cliArgs.focusDuration
  ? cliArgs.focusDuration
  : defaultFocusDuration;
const defaultRestDuration = 20;
const restDuration = cliArgs.restDuration
  ? cliArgs.restDuration
  : defaultRestDuration;
const quiet = cliArgs.quiet ? cliArgs.quiet : false;

function playFocusMusic() {
  playSpotifyUri(focusUri);
}

function playRestMusic() {
  playSpotifyUri(restUri);
}

function playDoneMusic() {
  playSpotifyUri(doneUri);
}

function playSpotifyUri(uri) {
  exec(`spotify play uri ${uri}`, (error, stdout, stderr) => {
    if (error) {
      console.log(
        `Could not play Spotify, did you run install.sh? Error: ${error.message}`
      );
      return;
    }
    if (stderr) {
      console.error(stderr);
      return;
    }

    console.log(stdout);
  });
}

function stopMusic() {
  exec("spotify stop", (error, stdout, stderr) => {
    console.log(stdout);
  });
}

function getSessionStartMessage(currentSession) {
  const prefix = `### Focus for ${focusDuration} minutes (${currentSession}/${sessions})`;
  const suffix = "###";
  if (goal) {
    return prefix + `: ${goal} ` + suffix;
  } else {
    return prefix + " " + suffix;
  }
}

function getRestMessage() {
  return `### Nice work, rest for ${restDuration} minutes ###`;
}

async function wait(minutes) {
  return new Promise((resolve) => {
    setTimeout(resolve, 1000 * 60 * minutes);
  });
}

async function startSesssion(currentSession) {
  console.log(getSessionStartMessage(currentSession));
  if (quiet) {
    stopMusic();
  } else {
    playFocusMusic();
  }
  await wait(focusDuration);

  console.log(getRestMessage());
  playRestMusic();
  await wait(restDuration);
}

async function main() {
  for (let currentSession = 1; currentSession <= sessions; ++currentSession) {
    console.log(getSessionStartMessage(currentSession));
    if (quiet) {
      stopMusic();
    } else {
      playFocusMusic();
    }
    await wait(focusDuration);

    if (currentSession < sessions) {
      console.log(getRestMessage());
      playRestMusic();
      await wait(restDuration);
    }
  }

  console.log("### Congrats! You finished your focus sessions :)");
  playDoneMusic();
}

main().catch((error) => {
  console.log(error);
});
