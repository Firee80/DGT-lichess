// @ts-nocheck
import {
  read,
  testConnection,
  closePort,
} from './serial.ts';

import {
  clockVersion,
  sendTextToClock,
  clearTextFromClock,
  readClock,
  setTime,
  readButton,
  beep,
} from './clock.ts'

import {
  getFEN,
  getLongSerialNumber,
  getSerialNumber,
  getTrademark,
  getBatteryStatus,
  getVersion,
  sendCustom,
} from './board.ts'

import {
  parseFEN,
  parseClock,
  parseVersion,
  parseBattery,
  parseASCII,
} from './parsers.ts';

export async function openPort(): Promise<boolean> {
  if (!('serial' in navigator)) {
      return false;
  }

  let port;

  try {
    const ports = await navigator.serial.getPorts();
    port = ports[0];

    if ('dgt' in window && port) {
      return true;
    }

    if (!port) {
      port = await navigator.serial.requestPort();
    }

    const connectionWorks = await testConnection(port);

    if (!connectionWorks) {
      return false;
    }

    setupDGTAPI(port);
    startReader(port);

    if ('dgt' in window && !window.dgt.timer) {
      messageHandler(port);
    }

    return true;
  } catch (e) {
    console.log('Error', e);
  }

  return false;
}

function setupDGTAPI(port) {
  Object.assign(window, {
    dgt: {
      port,
      getFEN: () => getFEN(port),
      getSerial: () => getSerialNumber(port),
      getLongSerial: () => getLongSerialNumber(port),
      getTrademark: () => getTrademark(port),
      getBattery: () => getBatteryStatus(port),
      getVersion: () => getVersion(port),
      sendCustom: (...hex) => sendCustom(port, ...hex),
      close: () => closePort(port),

      clock: {
        setTime: (...time) => setTime(port, ...time),
        setText: (text, delay) => sendTextToClock(port, text, delay),
        clearText: (priority) => clearTextFromClock(port, priority),
        beep: (time) => beep(port, time),

        getTime: () => readClock(port),
        getVersion: () => clockVersion(port),
        getButtons: () => readButton(port),
      },
      data: [],
    },
  })
}

function startReader(port) {
  setTimeout(async () => {
    await read(port, {
      [134]: parseFEN,
      [141]: parseClock,
      [145]: parseASCII,  // board serial number
      [146]: parseASCII,  // trademark
      [147]: parseVersion,
      [160]: parseBattery,
      [162]: parseASCII,  // board long serial number
    });
  })
}

function messageHandler(port) {
  const timerId = setInterval(() => {
    const messages = [...window.dgt.data];
    window.dgt.data.length = 0;

    messages.forEach(message => {
      const { code, data } = message;

      switch (code) {
        case 134:
          localStorage.setItem('boardFEN', data);
          break;
        case 141:
          localStorage.setItem('boardClock', JSON.stringify(data));
          break;
        case 145:
          localStorage.setItem('boardSerial', data);
          break;
        case 146:
          localStorage.setItem('boardTrademark', data);
          break;
        case 147:
          localStorage.setItem('boardVersion', data);
          break;
        case 160:
          localStorage.setItem('boardBattery', JSON.stringify(data));
          break;
      }
    })
  }, 300)

  window.dgt.timer = timerId;
}