import { CancelledOperationError } from './cancel'

function op (request, op, duration, result, cancelled, callback) {
  let done = false
  let callbackA = (err, result) => {
    if (err) {
      console.log('callbacks', request, op, 'err', err.message)
    } else {
      console.log('callbacks', request, op, 'end')
    }
    callback(err, result)
  }
  console.log('callbacks', request, op, 'start')
  cancelled.register(() => done || (done = true, callbackA(new CancelledOperationError())))
  setTimeout(() => done || (done = true, callbackA(null, result)), duration)
}

function handle (request, callback) {
  var op1 = [null, null]
  var op2 = () => {
    if (op1[0] !== null && op1[1] !== null) {
      op(request.id, 'op2', request.op2, request.id, request.cancelled, (err, result) => {
        callback(err, result)
      })
    }
  }
  op(request.id, 'op1a', request.op1a, request.id, request.cancelled, (err, result) => {
    if (err) {
      callback(err)
    } else {
      op1[0] = result
      op2()
    }
  })
  op(request.id, 'op1b', request.op1a, request.id, request.cancelled, (err, result) => {
    if (err) {
      callback(err)
    } else {
      op1[1] = result
      op2()
    }
  })
}

export function run (requests, callback) {
  let next = () => {
    let request
    if ((request = requests.shift())) {
      request = request()
      console.log('callbacks', request.id, 'start', request.details)
      handle(request, (err, result) => (console.log('callbacks', request.id, err ? 'err' : 'end', err ? err.message : ''), next()))
    } else {
      console.log('callbacks', 'end')
      callback()
    }
  }

  console.log('callbacks', 'start')
  next()
}

export function runAsync (requests, callback) {
  let finished = requests.map(request => false)

  requests.forEach((request, i) => {
    request = request()
    console.log('callbacks', request.id, 'start', request.details)
    handle(request, (err, result) => {
      console.log('callbacks', request.id, err ? 'err' : 'end', err ? err.message : '')
      finished[i] = true
      if (!finished.filter(f => !f).length) {
        console.log('callbacks', 'end')
        callback()
      }
    })
  })
}
