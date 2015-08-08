import { CancelledOperationError } from './cancel'

function op (request, op, duration, result, cancelled) {
  console.log('promises', request, op, 'start')
  return new Promise((resolve, reject) => {
    cancelled.register(() => reject(new CancelledOperationError()))
    setTimeout(() => resolve(result), duration)
  }).then(
    res => (console.log('promises', request, op, 'end'), res),
    err => (console.log('promises', request, op, 'err', err.message), Promise.reject(err)))
}

function handle (request) {
  return Promise
    .all([
      op(request.id, 'op1a', request.op1a, request.id, request.cancelled),
      op(request.id, 'op1b', request.op1b, request.id, request.cancelled)
    ])
    .then(() => op(request.id, 'op2', request.op2, request.id, request.cancelled))
}

export function run (requests, callback) {
  console.log('promises')
  requests
    .reduce(
      (promise, request) => promise
        .then(() => request())
        .then(request => (
          console.log('promises', request.id, 'start', request.details),
          handle(request)
            .then(result => console.log('promises', request.id, 'end'), err => console.log('promises', request.id, 'err', err.message)))),
      Promise.resolve())
    .then(() => console.log('promises', 'end'))
    .then(callback)
}

export function runAsync (requests, callback) {
  console.log('promises', 'start')
  Promise
    .all(requests.map(request => {
      request = request()
      console.log('promises', request.id, 'start', request.details)
      return handle(request)
        .then(result => console.log('promises', request.id, 'end'), err => console.log('promises', request.id, 'err', err.message))
    }))
    .then(() => console.log('promises', 'end'))
    .then(callback)
}
