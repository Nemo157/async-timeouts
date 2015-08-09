import { CancelledOperationError } from './cancel'

async function op (request, op, duration, result, cancelled) {
  console.log('async', request, op, 'start')
  try {
    var res = await new Promise((resolve, reject) => {
      cancelled.register(() => reject(new CancelledOperationError()))
      setTimeout(() => resolve(result), duration)
    })
    console.log('async', request, op, 'end')
    return res
  } catch (err) {
    console.log('async', request, op, 'err', err.message)
    throw err
  }
}

async function handle (request) {
  await Promise.all([
    op(request.id, 'op1a', request.op1a, request.id, request.cancelled),
    op(request.id, 'op1b', request.op1b, request.id, request.cancelled)
  ])
  await op(request.id, 'op2', request.op2, request.id, request.cancelled)
}

export function run (requests, callback) {
  (async function (requests) {
    console.log('async')
    for (var request of requests) {
      request = request()
      console.log('async', request.id, 'start', request.details)
      try {
        await handle(request)
        console.log('async', request.id, 'end')
      } catch (err) {
        console.log('async', request.id, 'err', err.message)
      }
    }
    console.log('async', 'end')
  })(requests).then(callback)
}

export function runAsync (requests, callback) {
  (async function (requests) {
    console.log('async', 'start')
    await Promise.all(requests.map(async function (request) {
      request = request()
      console.log('async', request.id, 'start', request.details)
      try {
        await handle(request)
        console.log('async', request.id, 'end')
      } catch (err) {
        console.log('async', request.id, 'err', err.message)
      }
    }))
    console.log('async', 'end')
  })(requests).then(callback)
}
