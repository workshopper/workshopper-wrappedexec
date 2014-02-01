const path    = require('path')
    , fs      = require('fs')
    , mods    = JSON.parse(process.argv[2])
    , ctxFile = process.argv[3]
    , ctx     = JSON.parse(fs.readFileSync(ctxFile, 'utf8'))
    , prexit  = process.exit
    , mainProgram = path.resolve(process.cwd(), process.argv[4])

ctx.mainProgram = mainProgram

for (var i = 0; i < mods.length; i++) {
  try {
    // load module
    var rm = require(mods[i])
    // give it the ctx if it exports a function
    if (typeof rm == 'function')
      rm(ctx)
  } catch (e) {
    console.error('Internal error loading wrapped module', mods[i])
  }
}


var wrote = false


// write back the context data so it can be read by the parent
function writeback () {
  if (wrote)
    return

  fs.writeFileSync(ctxFile, JSON.stringify(ctx), 'utf8')
  wrote = true
}


// remove evidence of main, mods, ctx
process.argv.splice(1, 3)


// just in case they use it
process.exit = function () {
  writeback()
  prexit.apply(process, arguments)
}


try {
  // run original main as if it were loaded directly
  require(mainProgram)
} finally {
  writeback()
}
