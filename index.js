const { app, BrowserWindow, TouchBar } = require('electron')
const player = require('play-sound')({})

const { TouchBarButton, TouchBarLabel } = TouchBar

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const buttons = {
  red: {
    off: '#350A01',
    on: '#521508',
    active: '#FD4A24'
  },
  blue: {
    off: '#041F2C',
    on: '#002D43',
    active: '#149EE2'
  },
  yellow: {
    off: '#3D3A15',
    on: '#403A00',
    active: '#F0DA00'
  },
  green: {
    off: '#062515',
    on: '#023B1E',
    active: '#4BFFA3'
  }
}

const STARTING_SPEED = 500
const COLORS = Object.keys(buttons)
const BACKGROUND_COLORS = Object.values(buttons)

const pattern = []
const input = []
let currentSpeed = STARTING_SPEED
let score = 0
let listening = false
let playing = false

const startGame = async () => {
  if (!playing) {
    scoreLabel.label = ''
    touchBar.escapeItem = null
    reset()
    await turnLights('on')
    return nextRound()
  }
}

const touchBarItems = Object.keys(buttons).map((color, i) => {
  return new TouchBarButton({
    label: '                               ',
    backgroundColor: buttons[color].off,
    click: () => handleClickButton(i)
  })
})
const scoreLabel = new TouchBarLabel({ label: '' })
const escapeItem = new TouchBarButton({ label: 'Start', click: startGame })
const touchBar = new TouchBar({
  items: [
    ...touchBarItems,
    scoreLabel
  ],
  escapeItem
})

// adds a random color (index) to the 'pattern' array
const addColor = () => pattern.push(Math.floor(Math.random() * COLORS.length))

const showPattern = async (pattern) => {
  if (pattern.length) {
    await blinkButton(pattern[0])
    await sleep(50)
    return showPattern(pattern.slice(1, pattern.length))
  }
}

const blinkButton = async (index) => {
  // turn light on
  touchBarItems[index].backgroundColor = BACKGROUND_COLORS[index].active

  // play sound
  player.play(`sounds/${COLORS[index]}.mp3`)
  await sleep(getToneDuration())

  // turn light off
  touchBarItems[index].backgroundColor = BACKGROUND_COLORS[index].on
}

const getToneDuration = () => {
  if (pattern.length < 6) {
    return 420
  } else if (pattern.length < 14) {
    return 320
  } else {
    return 220
  }
}

let buttonTimer
const handleClickButton = (index) => {
  if (listening) {
    clearTimeout(buttonTimer)
    const pushedButton = touchBarItems[index]
    const pushedColor = COLORS[index]

    if (index !== pattern[input.length]) {
      return gameOver()
    }

    player.play(`sounds/${COLORS[index]}.mp3`)
    input.push(index)
    if (input.length === pattern.length) {
      currentSpeed -= 20
      return nextRound()
    } else {
      buttonTimer = setTimeout(() => {
        return gameOver()
      }, 3000)
    }
  }
}

const nextRound = async () => {
  listening = false
  input.length = 0
  addColor()
  await sleep(800)
  await showPattern(pattern)
  listening = true
  buttonTimer = setTimeout(() => {
    return gameOver()
  }, 3000)
}

const gameOver = async () => {
  listening = false
  player.play(`sounds/gameover.mp3`)
  await turnLights('off')
  touchBar.escapeItem = escapeItem
  scoreLabel.label = `Score: ${pattern.length - 1}`
  playing = false
}

const turnLights = async (onOrOff = 'on') => {
  for (let [i, item] of touchBarItems.entries()) {
    item.backgroundColor = BACKGROUND_COLORS[i][onOrOff]
    await sleep(80)
  }
}

const reset = () => {
  score = 0
  pattern.length = 0
  currentSpeed = STARTING_SPEED
}

let window
app.once('ready', () => {
  window = new BrowserWindow({
    frame: false,
    titleBarStyle: 'hiddenInset',
    width: 200,
    height: 200,
    backgroundColor: '#000'
  })
  window.loadURL('about:blank')
  window.setTouchBar(touchBar)
})
