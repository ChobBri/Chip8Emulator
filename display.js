// import { cycle, loadProgram } from "./chip8"

let _canvas = null
let _frame = 0

function screenWidth() {
    return 64
}

function screenHeight() {
    return 32
}

function setup() {
    width = screenWidth()
    height = screenHeight()
    _canvas = createCanvas(64, 32)
    pixelDensity(1)

    _canvas.parent("chip8Canvas")
    _canvas.canvas.style.width = `${_canvas.width * 8}px`
    _canvas.canvas.style.height = `${_canvas.height * 8}px`
    _canvas.canvas.style.imageRendering = "pixelated"

    loadProgram("slipperyslope.ch8")
}

function draw() {
    background(125)
    cycle()
    let width = screenWidth()
    let height = screenHeight()
    loadPixels()
    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
          let index = 4 * (row * width + col)

          // (R, G, B, A)
          pixels[index] = 125 + width + _frame % 255
          pixels[index + 1] = (row * col + _frame) % 255
          pixels[index + 2] = (row + col + _frame % 255) * (row + col + _frame % 255) % 255
          pixels[index + 3] = 255
        }
      }
    updatePixels()
    _frame++
}

document.addEventListener('keydown', (event) => {
    if(event.key == "ArrowLeft") {
        _canvas.canvas.style.imageRendering = "auto"
    }
    else if (event.key == "ArrowDown") {
        _canvas.canvas.style.imageRendering = "pixelated"
    }
});
