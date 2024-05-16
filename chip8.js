const ctx = {
    regs: Array(0xF),
    IReg: 0,
    DTReg: 0,
    STReg: 0,

    FReg: 0,  // unused
    
    pc: 0,
    sp: 0,

    memory: Array(0xFFF),
    stack: Array(0xF)
}

function cycle() {
    instruction = read(0x200 + _pc++)

    actionFunc = lookup(instruction)
    actionFunc()
}

function loadProgram(fileName) {
    let fr = new FileReader()

    fr.readAsArrayBuffer(fileName)
    fr.onload = () => {
        let datas = new Int8Array(fr.result)
        datas.forEach((data, index) => write(0x200 + index, data))
    }
}

function lookup(instruction) {
    msb = (instruction >>> 8) & 0xFF
    lsb = instruction & 0xFF

    msbu = msb >>> 4 & 0xF
    msbl = msb & 0xF

    lsbu = lsb >>> 4 & 0xF
    lsbl = lsb & 0xF

    x = msbl
    y = lsbu

    kk = lsb
    n = lsbl
    nnn = (instruction >> 12) & 0x7FF

    switch (msbu) {
        case 0x0:
            if (lsbu === 0xE) {
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

function push(value) {
    ctx.stack[++sp] = value 
}

function pop() {
    return ctx.stack[sp--]
}

function read(memAddr) {
    return ctx.memory[memAddr]
}

function write(memAddr, value) {
    ctx.memory[memAddr] = value
}


/*** Standard Chip-8 Instructions ***/
function SYSaddr(nnn) {
    console.log(`SYSaddr invoked! How? nnn = ${nnn.toString(16)}`)
}

function CLS() {
    //clear the display
}

function RET() {
    ctx.pc = read(pop())
}

function JPaddr(nnn) {
    ctx.pc = nnn
}

function CALLaddr(nnn) {
    push(ctx.pc)
    ctx.pc = nnn
}

function SEVxbyte(x, kk) {
    if (ctx.regs[x] === kk) {
        pc++
    }
}

function SNEVxbyte(x, kk) {
    if (ctx.regs[x] !== kk) {
        pc++
    }
}

function SEVxVy(x, y) {
    if (ctx.regs[x] === cctx.regs[y]) {
        pc++
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
}

function SKPVx(x) {
    // Skip next instruction if key with the value of Vx is pressed
}

function SKNPVx(x) {
    // Skip next instruction if key with the value of Vx is not pressed
}

function LDVxDT(x) {
    ctx.regs[x] = ctx.DTReg
}

function LDVxK(x) {
    // Wait for a key press, store the value of the key in Vx
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
        ctx.regs[i] = read(ctx.IReg + i)
    }
}
