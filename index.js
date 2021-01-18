const commandLineArgs = require("command-line-args");
const util = require("util");
const exec = util.promisify(require("child_process").exec);
const chalk = require("chalk");
const fs = require("fs");
const toml = require("@iarna/toml");
const { homedir } = require("os");

// ========================
// Read config file options
// ========================
const configFile = `${homedir()}/.focuson.cfg.toml`;

let CONFIG = {};
if (fs.existsSync(configFile)) {
  console.log(chalk.dim(`Reading config file from ${configFile}`));
  CONFIG = toml.parse(fs.readFileSync(configFile, "utf8"));
}

const focusUri = CONFIG["focus"]["uri"]; // "spotify:playlist:0vvXsWCC9xrXsKd4FyS8kM";
const focusVolume = CONFIG["focus"]["volume"] ? CONFIG["focus"]["volume"] : 50;
const restUri = CONFIG["rest"]["uri"]; // "spotify:track:7HrE6HtYNBbGqp5GmHbFV0";
const restVolume = CONFIG["rest"]["volume"] ? CONFIG["rest"]["volume"] : 50;
const doneUri = CONFIG["done"]["uri"]; // "spotify:playlist:1OJW3eYKYtMNVlF8AbRV0q";
const doneVolume = CONFIG["done"]["volume"] ? CONFIG["done"]["volume"] : 50;
const defaultSessions = CONFIG["defaultSessions"]
  ? CONFIG["defaultSessions"]
  : 3;
const logFile = CONFIG["logFile"]
  ? CONFIG["logFile"]
  : `${homedir()}/focuson.log.txt`;

// =============
// Read cli args
// =============
const cliArgsDefinitions = [
  {
    name: "task",
    alias: "t",
    type: String,
    multiple: true,
    defaultOption: true,
  },
  { name: "sessions", alias: "s", type: String },
  { name: "focusDuration", alias: "f", type: Number },
  { name: "restDuration", alias: "r", type: Number },
  { name: "quiet", alias: "q", type: Boolean },
];

const cliArgs = commandLineArgs(cliArgsDefinitions);

const task = cliArgs.task ? cliArgs.task.join(" ") : null;

const sessions = cliArgs.sessions ? cliArgs.sessions : defaultSessions;
const defaultFocusDuration = CONFIG["focus"]["defaultDuration"]
  ? CONFIG["focus"]["defaultDuration"]
  : 20;
const focusDuration = cliArgs.focusDuration
  ? cliArgs.focusDuration
  : defaultFocusDuration;
const defaultRestDuration = CONFIG["rest"]["defaultDuration"]
  ? CONFIG["rest"]["defaultDuration"]
  : 1;
const restDuration = cliArgs.restDuration
  ? cliArgs.restDuration
  : defaultRestDuration;
const quiet = cliArgs.quiet ? cliArgs.quiet : false;

// ===========
// Main script
// ===========

async function playFocusMusic() {
  if (!focusUri) {
    console.log(chalk.dim("Shh, no focus URI set."));
    await stopMusic();
    return;
  }

  await setVolume(focusVolume);
  await playSpotifyUri(focusUri);
}

async function playRestMusic() {
  if (!restUri) {
    console.log(chalk.dim("Shh, no rest URI set."));
    await stopMusic();
    return;
  }

  await setVolume(restVolume);
  await playSpotifyUri(restUri);
}

async function playDoneMusic() {
  if (!doneUri) {
    console.log(chalk.dim("Shh, no done URI set."));
    await stopMusic();
    return;
  }

  await setVolume(doneVolume);
  await playSpotifyUri(doneUri);
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
  const prefix = `### 🧑🏻‍💻 Focus for ${focusDuration}min (${currentSession}/${sessions})`;
  const suffix = "###";
  let msg = "";
  if (task) {
    msg = prefix + `: ${task} ` + suffix;
  } else {
    msg = prefix + " " + suffix;
  }

  return chalk.blue.bold(msg);
}

function getRestMessage() {
  return chalk.magenta.bold(
    `### 😌 Nice work, rest for ${restDuration}min ###`
  );
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

function readLogFile() {
  let parsedLog = {};
  if (fs.existsSync(logFile)) {
    parsedLog = toml.parse(fs.readFileSync(logFile, "utf-8"));
  }

  return parsedLog;
}

function getTodayDate() {
  const today = new Date();
  const month = today.getMonth() + 1;
  const datestring = `${month}-${today.getDate()}-${today.getFullYear()}`;
  return datestring;
}

function appendToLogFile() {
  const parsedLog = readLogFile();

  const datestring = getTodayDate();
  if (!parsedLog[datestring]) {
    parsedLog[datestring] = {};
  }
  if (!parsedLog[datestring][task]) {
    parsedLog[datestring][task] = 0;
  }

  parsedLog[datestring][task] += focusDuration;

  fs.writeFileSync(logFile, toml.stringify(parsedLog));
}

async function main() {
  for (let currentSession = 1; currentSession <= sessions; ++currentSession) {
    console.log(getSessionStartMessage(currentSession));
    if (quiet) {
      await stopbhMusic();
    } else {
      await playFocusMusic();
    }
    await wait(focusDuration);
    appendToLogFile();

    if (currentSession < sessions) {
      console.log(getRestMessage());
      await playRestMusic();
      await wait(restDuration);
    }
  }

  console.log(
    chalk.green.bold("### 🎉 Congrats! You finished your focus sessions ###")
  );
  console.log(chalk.green.bold("\nToday's stats (minutes):"));
  console.log(chalk.green(toml.stringify(readLogFile()[getTodayDate()])));

  await playDoneMusic();
}

process.on("SIGINT", function () {
  console.log(chalk.bold.gray("\nStopping..."));

  stopMusic().finally(() => {
    process.exit();
  });
});

main().catch((error) => {
  console.log(error);
});
