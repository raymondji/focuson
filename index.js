#!/usr/bin/env node

const commandLineArgs = require("command-line-args");
const util = require("util");
const exec = util.promisify(require("child_process").exec);
const chalk = require("chalk");
const fs = require("fs");
const { homedir } = require("os");

// ========================
// Read config file options
// ========================
const configFile = `${homedir()}/.focuson.cfg.json`;

let CONFIG = {};
if (fs.existsSync(configFile)) {
  console.log(chalk.dim(`Reading config file from ${configFile}`));
  CONFIG = JSON.parse(fs.readFileSync(configFile, "utf8"));
}

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
  { name: "doneDuration", alias: "d", type: Number },
  { name: "quiet", alias: "q", type: Boolean },
];

const cliArgs = commandLineArgs(cliArgsDefinitions);

// ==========================
// Set all script parameters
// ==========================

const task = cliArgs.task ? cliArgs.task.join(" ") : "unspecified";
const quiet = cliArgs.quiet ?? false;
const sessions = cliArgs.sessions ?? CONFIG["sessions"] ?? 3;
const focusConfig = {
  uri: CONFIG["focus"]["uri"] ?? null,
  volume: CONFIG["focus"]["volume"] ?? null,
  duration: cliArgs.focusDuration ?? CONFIG["focus"]["duration"] ?? 20,
};
const restConfig = {
  uri: CONFIG["rest"]["uri"] ?? null,
  volume: CONFIG["rest"]["volume"] ?? null,
  duration: cliArgs.restDuration ?? CONFIG["rest"]["duration"] ?? 1,
};
const doneConfig = {
  uri: CONFIG["done"]["uri"] ?? null,
  volume: CONFIG["done"]["volume"] ?? null,
  duration: cliArgs.doneDuration ?? CONFIG["done"]["duration"] ?? 20,
};
const logFile = `${homedir()}/focuson.log.json`;

// ==================
// Main script begins
// ==================

async function playMusic(kind) {
  let config;
  if (kind === "focus") {
    config = focusConfig;
  } else if (kind === "rest") {
    config = restConfig;
  } else if (kind === "done") {
    config = doneConfig;
  }

  if (!config.uri) {
    console.log(chalk.dim("Shh, no URI set."));
    await stopMusic();
    return;
  }

  await setVolume(config.volume);

  const { _, stderr } = await exec(
    `osascript -e 'tell application "Spotify" to play track "${config.uri}"'`
  );
  if (stderr) {
    console.error(stderr);
  }
  console.log(chalk.dim(`Playing ${kind} music...`));
}

async function stopMusic() {
  const { _, stderr } = await exec(
    `osascript -e 'tell application "Spotify" to pause'`
  );
  if (stderr) {
    console.error(stderr);
  }
  console.log(chalk.dim("Stopped music."));
}

function getSessionStartMessage(currentSession) {
  const prefix = `### 🧑🏻‍💻 Focus for ${focusConfig.duration}min (${currentSession}/${sessions})`;
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
    `### 😌 Nice work, rest for ${restConfig.duration}min ###`
  );
}

async function setVolume(volume) {
  const { _, stderr } = exec(
    `osascript -e 'tell application "Spotify" to set sound volume to ${volume}'`
  );
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
    parsedLog = JSON.parse(fs.readFileSync(logFile, "utf-8"));
  }

  return parsedLog;
}

function getTodayDate() {
  const today = new Date();
  const month = today.getMonth() + 1;
  const datestring = `${month}-${today.getDate()}-${today.getFullYear()}`;
  return datestring;
}

function updateLogFile() {
  const parsedLog = readLogFile();

  const datestring = getTodayDate();
  if (!parsedLog[datestring]) {
    parsedLog[datestring] = {};
  }
  if (!parsedLog[datestring][task]) {
    parsedLog[datestring][task] = 0;
  }

  parsedLog[datestring][task] += focusConfig.duration;

  fs.writeFileSync(logFile, JSON.stringify(parsedLog));
}

function printDoneMessages() {
  console.log(
    chalk.green.bold("### 🎉 Congrats! You finished your focus sessions ###")
  );
  console.log("");
  console.log(chalk.green.bold("Today's focused work:"));
  const todayStats = readLogFile()[getTodayDate()] ?? {};
  const tasks = Object.getOwnPropertyNames(todayStats);
  for (let task of tasks) {
    const minutes = todayStats[task];
    console.log(chalk.green(`${minutes}min ${task}`));
  }
  console.log("");
  console.log(chalk.dim(`View work log at ${logFile}`));
}

async function main() {
  for (let currentSession = 1; currentSession <= sessions; ++currentSession) {
    console.log(getSessionStartMessage(currentSession));
    if (quiet) {
      await stopMusic();
    } else {
      await playMusic("focus");
    }
    await wait(focusConfig.duration);
    updateLogFile();

    if (currentSession < sessions) {
      console.log(getRestMessage());
      await playMusic("rest");
      await wait(restConfig.duration);
    }
  }

  printDoneMessages();
  await playMusic("done");
  await wait(doneConfig.duration);
  await stopMusic();
}

main().catch((error) => {
  console.log(error);
});

process.on("SIGINT", function () {
  console.log(chalk.bold.gray("\nStopping..."));

  stopMusic().finally(() => {
    process.exit();
  });
});
