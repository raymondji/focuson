const commandLineArgs = require("command-line-args");
const util = require("util");
const exec = util.promisify(require("child_process").exec);
const chalk = require("chalk");

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
const focusVolume = 57;
const restUri = "spotify:track:7HrE6HtYNBbGqp5GmHbFV0";
const restVolume = 55;
const doneUri = "spotify:playlist:1OJW3eYKYtMNVlF8AbRV0q";
const doneVolume = 45;
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

async function playFocusMusic() {
  playSpotifyUri(focusUri);
}

async function playRestMusic() {
  playSpotifyUri(restUri);
}

async function playDoneMusic() {
  playSpotifyUri(doneUri);
}

async function playSpotifyUri(uri) {
  const { _, stderr } = await exec(`spotify play uri ${uri}`);
  if (stderr) {
    console.error(stderr);
  }
  console.log(chalk.dim("Playing music."));
}

async function stopMusic() {
  const { _, stderr } = await exec("spotify stop");
  if (stderr) {
    console.error(stderr);
  }
  console.log(chalk.dim("Stopped music."));
}

function getSessionStartMessage(currentSession) {
  const prefix = `### Focus for ${focusDuration}min (${currentSession}/${sessions})`;
  const suffix = "###";
  let msg = "";
  if (goal) {
    msg = prefix + `: ${goal} ` + suffix;
  } else {
    msg = prefix + " " + suffix;
  }

  return chalk.blue.bold(msg);
}

function getRestMessage() {
  return chalk.magenta.bold(`### Nice work, rest for ${restDuration}min ###`);
}

async function setVolume(volume) {
  const { _, stderr } = exec(`spotify vol ${volume}`);
  if (stderr) {
    console.error(stderr);
  }
  console.log(chalk.dim(`Volume: ${volume}`));
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
      await stopMusic();
    } else {
      await setVolume(focusVolume);
      await playFocusMusic();
    }
    await wait(focusDuration);

    if (currentSession < sessions) {
      console.log(getRestMessage());
      await setVolume(restVolume);
      playRestMusic();
      await wait(restDuration);
    }
  }

  console.log(
    chalk.green.bold("### Congrats! You finished your focus sessions :)")
  );

  await setVolume(doneVolume);
  await playDoneMusic();
}

process.on("SIGINT", function () {
  console.log(chalk.bold.yellow("\nStopping..."));

  stopMusic().finally(() => {
    process.exit();
  });
});

main().catch((error) => {
  console.log(error);
});
