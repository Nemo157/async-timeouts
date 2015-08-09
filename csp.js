import csp from 'js-csp'
import { CancellationToken, CancelledOperationError } from './cancel'

CancellationToken.prototype.asChan = function () {
  let chan = csp.chan()
  this.register(() => csp.putAsync(chan, new CancelledOperationError()))
  return chan
}

function* op (request, op, duration, result, cancelled) {
  console.log('csp', request, op, 'start')
  let ch = csp.go(function* () {
    yield csp.timeout(duration)
    return result
  })

  var res = (yield csp.alts([ch, cancelled])).value
  if (res instanceof Error) {
    console.log('csp', request, op, 'err', res.message)
  } else {
    console.log('csp', request, op, 'end')
  }
  return res
}

function* handle (request) {
  var op1 = [
    csp.go(op, [request.id, 'op1a', request.op1a, request.id, request.cancelled.asChan()]),
    csp.go(op, [request.id, 'op1b', request.op1a, request.id, request.cancelled.asChan()])
  ]
  while (op1.length) {
    let done = yield csp.alts(op1)
    op1 = op1.filter(o => o !== done.channel)
  }
  return yield csp.go(op, [request.id, 'op2', request.op2, request.id, request.cancelled.asChan()])
}

export function run (requests, callback) {
  csp.go(function* () {
    console.log('csp', 'start')
    for (var request of requests) {
      request = request()
      console.log('csp', request.id, 'start', request.details)
      try {
        var result = yield csp.take(csp.go(handle, [request]))
        if (result instanceof Error) {
          throw result
        }
        console.log('csp', request.id, 'end')
      } catch (err) {
        console.log('csp', request.id, 'err', err.message)
      }
    }
    console.log('csp', 'end')
    callback()
  })
}

export function runAsync (requests, callback) {
  csp.go(function* () {
    console.log('csp', 'start')
    let holders = requests.map(request => {
      request = request()
      console.log('csp', request.id, 'start', request.details)
      return {
        channel: csp.go(handle, [request]),
        request
      }
    })
    while (holders.length) {
      let done = yield csp.alts(holders.map(req => req.channel))
      let holder = holders.find(req => req.channel === done.channel)
      var result = done.value
      if (result instanceof Error) {
        console.log('csp', holder.request.id, 'err', result.message)
      } else {
        console.log('csp', holder.request.id, 'end')
      }
      holders = holders.filter(hol => hol !== holder)
    }
    console.log('csp', 'end')
    callback()
  })
}
