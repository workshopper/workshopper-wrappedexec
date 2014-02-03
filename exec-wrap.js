const path        = require('path')
    , fs          = require('fs')
    , myargre     = /^\$execwrap\$(.*)$/
    , myargs      = process.argv.map(function (a) {
                      return myargre.test(a) && a.replace(myargre, '$1')
                    }).filter(Boolean)
    , mods        = JSON.parse(myargs[0])
    , ctxFile     = myargs[1]
    , ctx         = JSON.parse(fs.readFileSync(ctxFile, 'utf8'))
    , mainProgram = ctx.mainProgram = path.resolve(process.cwd(), myargs[2])
    , prexit      = process.exit


// remove evidence of main, mods, ctx
process.argv = process.argv.filter(function (a) {
  return !myargre.test(a)
})
// replace original main at position 2
process.argv.splice(1, 1, mainProgram)


// utility to catpture a stack trace at a particular method in an array
ctx.$captureStack = function captureStack (fn) {
  var err = new Error
    , stack
  Error._prepareStackTrace = Error.prepareStackTrace
  Error.prepareStackTrace = function (err, stack) { return stack }
  Error.captureStackTrace(err, fn)
  stack = err.stack // touch it to capture it
  Error.prepareStackTrace = Error._prepareStackTrace
  return stack
}


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
