'use strict';
const path = require('path');
const execa = require('execa');

// binary may exist in any of these directories: app.asar.unpacked, app-x64.asar.unpacked or app-arm64.asar.unpacked
const binary = path.join(__dirname.replace(/(app)(\-[a-z0-9]+)?(\.asar)/,'$1$2$3.unpacked'),"audio-devices");

const generateExport = (name, getArgs, callback) => {
  module.exports[name] = async (...inputs) => {
    const result = await execa(binary, getArgs(...inputs));
    return callback(result);
  };

  module.exports[name].sync = (...inputs) => {
    const result = execa.sync(binary, getArgs(...inputs));
    return callback(result);
  };
};

const throwIfStderr = ({stderr}) => {
  if (stderr) {
    throw new Error(stderr);
  }
};

const parseStdout = ({stdout, stderr}) => {
  throwIfStderr({stderr});
  return JSON.parse(stdout);
};

generateExport('getAllDevices', () => ['list', '--json'], parseStdout);

generateExport('getInputDevices', () => ['list', '--input', '--json'], parseStdout);

generateExport('getOutputDevices', () => ['list', '--output', '--json'], parseStdout);

generateExport('getDevice', deviceId => ['get', '--json', deviceId], parseStdout);

generateExport('getDefaultOutputDevice', () => ['output', 'get', '--json'], parseStdout);

generateExport('getDefaultInputDevice', () => ['input', 'get', '--json'], parseStdout);

generateExport('getDefaultSystemDevice', () => ['system', 'get', '--json'], parseStdout);

generateExport('setDefaultOutputDevice', deviceId => ['output', 'set', deviceId], throwIfStderr);

generateExport('setDefaultInputDevice', deviceId => ['input', 'set', deviceId], throwIfStderr);

generateExport('setDefaultSystemDevice', deviceId => ['system', 'set', deviceId], throwIfStderr);

generateExport('getOutputDeviceVolume', deviceId => ['volume', 'get', deviceId], ({stdout, stderr}) => stderr ? undefined : stdout);

generateExport('setOutputDeviceVolume', (deviceId, volume) => ['volume', 'set', deviceId, volume], throwIfStderr);

generateExport(
  'createAggregateDevice',
  (name, mainDeviceId, otherDeviceIds, {multiOutput} = {}) => [
    'aggregate', 'create', '--json', (multiOutput && '--multi-output'), name, mainDeviceId, ...otherDeviceIds
  ].filter(Boolean),
  parseStdout
);

generateExport('destroyAggregateDevice', deviceId => ['aggregate', 'destroy', deviceId], throwIfStderr);
