let _canvas = null
let _frame = 0

let loginForm = document.getElementById("fileSubmitForm")
loginForm.addEventListener("submit", (e) => {
    e.preventDefault()

    let file = document.getElementById("file")
    const reader = new FileReader()
    reader.onload = (e) => {
        loadProgram(e.target.result)
    }
    reader.readAsArrayBuffer(file.files[0])
    console.log(file.files[0])
})

function screenWidth() {
    return 64
}

function screenHeight() {
    return 32
}

function setup() {
    frameRate(120)
    width = screenWidth()
    height = screenHeight()
    _canvas = createCanvas(64, 32)
    pixelDensity(1)

    _canvas.parent("chip8Canvas")
    _canvas.canvas.style.width = `${_canvas.width * 8}px`
    _canvas.canvas.style.height = `${_canvas.height * 8}px`
    _canvas.canvas.style.imageRendering = "pixelated"
}

function draw() {

    cycle()

    // let width = screenWidth()
    // let height = screenHeight()
    // loadPixels()
    // for (let row = 0; row < height; row++) {
    //     for (let col = 0; col < width; col++) {
    //       let index = 4 * (row * width + col)

    //       // (R, G, B, A)
    //       pixels[index] = 125 + width + _frame % 255
    //       pixels[index + 1] = (row * col + _frame) % 255
    //       pixels[index + 2] = (row + col + _frame % 255) * (row + col + _frame % 255) % 255
    //       pixels[index + 3] = 255
    //     }
    //   }
    // updatePixels()
    // _frame++
}

const ctx = {
    regs: new Uint8Array(0xF),
    IReg: 0x0,
    DTReg: 0x0,
    STReg: 0x0,

    FReg: 0x0,  // unused
    
    pc: 0x200,
    sp: 0x0,

    memory: new Uint8Array(0xFFF),
    stack: new Uint16Array(0xF),

    loaded: false,
}

function cycle() {
    if (!ctx.loaded) return
    instruction = read16(ctx.pc)
    ctx.pc += 2
    actionFunc = lookup(instruction)
    console.log(`${ctx.pc.toString(16)} : ${actionFunc}`)
    actionFunc()
}

function loadProgram(arrayBuffer) {
    const uInt8Arr = new Uint8Array(arrayBuffer)

    ctx.memory.forEach((_, index) => {
        ctx.memory[index] = 0x0
    })

    uInt8Arr.forEach((byte, index) => {
        ctx.memory[0x200 + index] = byte
    })

    const rom = document.getElementById("chip8rom")

    for (let i = 0; i < uInt8Arr.length / 2; i++) {
        const para = document.createElement("p")
        // const node = document.createTextNode(`0x${(i*2).toString(16)}: ${read16(0x200 + 2 * i).toString(16)}`)
        const node = document.createTextNode(`0x${(0x200 + i*2).toString(16)}: ${lookup(read16(0x200 + 2 * i)).toString()}: ${read16(0x200 + 2 * i).toString(16)}`)
        para.appendChild(node)
        rom.appendChild(para)
    }

    loadSprites()
    CLS()

    ctx.loaded = true
}

function loadSprites() {
    const sprites = [
        [0xF0, 0x90, 0x90, 0x90, 0xF0],  // 0
        [0x20, 0x60, 0x20, 0x20, 0x70],  // 1
        [0xF0, 0x10, 0xF0, 0x80, 0xF0],  // 2
        [0xF0, 0x10, 0xF0, 0x10, 0xF0],  // 3
        [0x90, 0x90, 0xF0, 0x10, 0x10],  // 4
        [0xF0, 0x80, 0xF0, 0x10, 0xF0],  // 5
        [0xF0, 0x80, 0xF0, 0x90, 0xF0],  // 6
        [0xF0, 0x10, 0x20, 0x40, 0x40],  // 7
        [0xF0, 0x90, 0xF0, 0x90, 0xF0],  // 8
        [0xF0, 0x90, 0xF0, 0x10, 0xF0],  // 9
        [0xF0, 0x90, 0xF0, 0x90, 0x90],  // A
        [0xE0, 0x90, 0xE0, 0x90, 0xE0],  // B
        [0xF0, 0x80, 0x80, 0x80, 0xF0],  // C
        [0xE0, 0x90, 0x90, 0x90, 0xE0],  // D
        [0xF0, 0x80, 0xF0, 0x80, 0xF0],  // E
        [0xF0, 0x80, 0xF0, 0x80, 0x80],  // F
    ]

    sprites.forEach((sprite, sIndex) => {
        sprite.forEach((data, dIndex) => {
            ctx.memory[(sIndex * 5) + dIndex] = data
        })
    })
}

function lookup(instruction) {
    msb = (instruction >>> 8) & 0xFF
    lsb = instruction & 0xFF

    msbu = (msb >>> 4) & 0xF
    msbl = msb & 0xF

    lsbu = (lsb >>> 4) & 0xF
    lsbl = lsb & 0xF

    x = msbl
    y = lsbu

    kk = lsb
    n = lsbl
    nnn = instruction & 0x7FF

    switch (msbu) {
        case 0x0:
            if (lsb === 0xE0) {
                return () => { CLS() }
            }

            if (lsb === 0xEE) {
                return () => { RET() }
            }

            return () => { SYSaddr(nnn) }
        case 0x1:
            return () => { JPaddr(nnn) }
        case 0x2:
            return () => { CALLaddr(nnn) }
        case 0x3:
            return () => { SEVxbyte(x, kk)}
        case 0x4:
            return () => { SNEVxbyte(x, kk) }
        case 0x5:
            return () => { SEVxVy(x, y) }
        case 0x6:
            return () => { LDVxbyte(x, kk) }
        case 0x7:
            return () => { ADDVxbyte(x, kk) }
        case 0x8:
            switch (n) {
                case 0x0:
                    return () => { LDVxVy(x, y) }
                case 0x1:
                    return () => { ORVxVy(x, y) }
                case 0x2:
                    return () => { ANDVxVy(x, y) }
                case 0x3:
                    return () => { XORVxVy(x, y) }
                case 0x4:
                    return () => { ADDVxVy(x, y) }
                case 0x5:
                    return () => { SUBVxVy(x, y) }
                case 0x6:
                    return () => { SHRVxVy(x, y) }
                case 0x7:
                    return () => { SUBNVxVy(x, y) }
                case 0x8:
                    return () => { SHLVxVy(x, y) }
                case 0xE:
                    return () => { SHLVxVy(x, y) }
                default:
                    return () => {}
            }
        case 0x9:
            if (lsbl === 0x0) {
                return () => { SNEVxVy(x, y) }
            }

            return () => {}
        case 0xA:
            return () => { LDIaddr(nnn) }
        case 0xB:
            return () => { JPV0addr(nnn) }
        case 0xC:
            return () => { RNDVxbyte(x, kk) }
        case 0xD:
            return () => { DRWVxVynibble(x, y, n) }
        case 0xE:
            if (lsb === 0x9E) {
                return () => { SKPVx(x) }
            }

            if (lsb === 0xA1) {
                return () => { SKNPVx(x) }
            }

            return () => {}
        case 0xF:
            switch (lsb) {
                case 0x07:
                    return () => { LDVxDT(x) }
                case 0x0A:
                    return () => { LDVxK(x) }
                case 0x15:
                    return () => { LDDTVx(x) }
                case 0x18:
                    return () => { LDSTVx(x) }
                case 0x1E:
                    return () => { ADDIVx(x) }
                case 0x29:
                    return () => { LDFVx(x) }
                case 0x33:
                    return () => { LDBVx(x) }
                case 0x55:
                    return () => { LDIVx(x) }
                case 0x65:
                    return () => { LDVxI(x) }
                default:
                    return () => {}
            }
        default:
            return () => {}
    }
}

function pushStack(value) {
    ctx.stack[ctx.sp++] = value
}

function popStack() {
    return ctx.stack[--ctx.sp]
}

function read(memAddr) {
    return ctx.memory[memAddr]
}

function read16(memAddr) {
    return (read(memAddr) << 8) | read(memAddr + 1)
}

function write(memAddr, value) {
    ctx.memory[memAddr] = value
}


/*** Standard Chip-8 Instructions ***/
function SYSaddr(nnn) {
}

function CLS() {
    //clear the display
    let width = screenWidth()
    let height = screenHeight()
    loadPixels()
    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
          let index = 4 * (row * width + col)

          // (R, G, B, A)
          pixels[index] = 0
          pixels[index + 1] = 0
          pixels[index + 2] = 0
          pixels[index + 3] = 255
        }
      }
    updatePixels()
}

function RET() {
    ctx.pc = popStack()
}

function JPaddr(nnn) {
    ctx.pc = nnn
}

function CALLaddr(nnn) {
    pushStack(ctx.pc)
    ctx.pc = nnn
}

function SEVxbyte(x, kk) {
    if (ctx.regs[x] === kk) {
        ctx.pc += 2
    }
}

function SNEVxbyte(x, kk) {
    if (ctx.regs[x] !== kk) {
        ctx.pc += 2
    }
}

function SEVxVy(x, y) {
    if (ctx.regs[x] === ctx.regs[y]) {
        ctx.pc += 2
    }
}

function LDVxbyte(x, kk) {
    ctx.regs[x] = kk
}

function ADDVxbyte(x, kk) {
    ctx.regs[x] += kk
}

function LDVxVy(x, y) {
    ctx.regs[x] = ctx.regs[y]
}

function ORVxVy(x, y) {
    ctx.regs[x] |= ctx.regs[y]
}

function ANDVxVy(x, y) {
    ctx.regs[x] &= ctx.regs[y]
}

function XORVxVy(x, y) {
    ctx.regs[x] ^= ctx.regs[y]
}

function ADDVxVy(x, y) {
    result = ctx.regs[x] + ctx.regs[y]
    ctx.FReg = (result > 255) ? 0x1 : 0x0
    ctx.regs[x] = result & 0xFF
}

function SUBVxVy(x, y) {
    result = ctx.regs[x] - ctx.regs[y]
    ctx.FReg = (ctx.regs[x] > ctx.regs[y]) ? 0x1 : 0x0
    ctx.regs[x] = result

    if (ctx.regs[x] < 0) {
        ctx.regs[x] += 0x100
    }
}

function SHRVxVy(x, y) {
    ctx.FReg = ctx.regs[x] & 0x1
    ctx.regs[x] >>>= 1
}

function SUBNVxVy(x, y) {
    result = ctx.regs[y] - ctx.regs[x]
    ctx.FReg = (ctx.regs[y] > ctx.regs[x]) ? 0x1 : 0x0
    ctx.regs[x] = result

    if (ctx.regs[x] < 0) {
        ctx.regs[x] += 0x100
    }
}

function SHLVxVy(x, y) {
    ctx.FReg = (ctx.regs[x] >>> 0xF) & 0x1
    ctx.regs[x] <<= 1
    ctx.regs[x] &= 0xFF
}

function SNEVxVy(x, y) {
    if (ctx.regs[x] !== ctx.regs[y]) {
        pc++
    }
}

function LDIaddr(nnn) {
    ctx.IReg = nnn
}

function JPV0addr(nnn) {
    ctx.pc = nnn + ctx.regs[0]
}

function RNDVxbyte(x, kk) {
    ctx.regs[x] = Math.floor(Math.random() * 256) & kk
}

function DRWVxVynibble(x, y, n) {
    // display n-byte sprite starting
    // at memory location I at (Vx, Vy),
    // set VF = collision
    let width = screenWidth()
    let height = screenHeight()
    loadPixels()
    const startRow = ctx.regs[y]
    const startCol = ctx.regs[x]
    for (let row = startRow, byteIndex = 0; row < startRow + n; row++, byteIndex++) {
        spriteByte = read(ctx.IReg + byteIndex)
        for (let col = startCol, bitIndex = 0; col < startCol + 8; col++, bitIndex++) {
            let index = 4 * (row * width + col)

            const bit = (spriteByte >>> (7 - bitIndex)) & 0x1
            
            const color = bit === 0x1 ? 255 : 0
            // (R, G, B, A)
            pixels[index] = color
            pixels[index + 1] = color
            pixels[index + 2] = color
            pixels[index + 3] = 255
        }
      }
    updatePixels()
}

function SKPVx(x) {
    // Skip next instruction if key with the value of Vx is pressed
    currentKey = getCurrentKey()

    if (currentKey === ctx.regs[x]) {
        ctx.pc += 2
    }
}

function SKNPVx(x) {
    // Skip next instruction if key with the value of Vx is not pressed
    currentKey = getCurrentKey()

    if (currentKey !== ctx.regs[x]) {
        ctx.pc += 2
    }
}

function LDVxDT(x) {
    ctx.regs[x] = ctx.DTReg
}

function LDVxK(x) {
    // Wait for a key press, store the value of the key in Vx
    currentKey = getCurrentKey()
    if (currentKey) {
        ctx.regs[x] = currentKey
    } else {
        ctx.pc -= 2
    }
}

function LDDTVx(x) {
    ctx.DTReg = ctx.regs[x]
}

function LDSTVx(x) {
    ctx.STReg = ctx.regs[x]
}

function ADDIVx(x) {
    ctx.IReg += ctx.regs[x]
}

function LDFVx(x) {
    // set I = location sprite for digit Vx
    ctx.IReg = ctx.regs[x] * 5
}

function LDBVx(x) {
    num = ctx.regs[x]
    hundreds = Math.floor(num / 100) % 10
    tens = Math.floor(num / 10) % 10
    ones = num % 10

    write(ctx.IReg, hundreds)
    write(ctx.IReg + 1, tens)
    write(ctx.IReg + 2, ones)
}

function LDIVx(x) {
    for (let i = 0; i <= x; i++) {
        write(ctx.IReg + i, ctx.regs[i])
    }
}

function LDVxI(x) {
    for (let i = 0; i <= x; i++) {
        ctx.regs[i] = read16(ctx.IReg + i)
    }
}

function getCurrentKey() {
    if (!keyIsPressed) {
        return undefined
    }

    switch (key) {
        case "1":
            return 0x1
        case "2":
            return 0x2
        case "3":
            return 0x3
        case "4":
            return 0xC
        case "Q":
        case "q":
            return 0x4
        case "W":
        case "w":
            return 0x5
        case "E":
        case "e":
            return 0x6
        case "R":
        case "r":
            return 0xD
        case "A":
        case "a":
            return 0x7
        case "S":
        case "s":
            return 0x8
        case "D":
        case "d":
            return 0x9
        case "F":
        case "f":
            return 0xE
        case "Z":
        case "z":
            return 0xA
        case "X":
        case "x":
            return 0x0
        case "C":
        case "c":
            return 0xB
        case "V":
        case "v":
            return 0xF
        default:
            return undefined
    }
}
