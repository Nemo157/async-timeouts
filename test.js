import { CancellationTokenSource } from './cancel'
import * as callbacks from './callbacks'
import * as promises from './promises'
import * as csp from './csp'

let id = 0
let createRequest = (op1a, op1b, op2, cancelAfter) => () => ({
  id: id++,
  details: { op1a, op1b, op2, cancelAfter },
  op1a, op1b, op2,
  cancelled: new CancellationTokenSource().cancelAfter(cancelAfter).token
})

let requests = [
  createRequest(200, 200, 300, 1000),
  createRequest(200, 200, 700, 500),
]

callbacks.run(requests.slice(), () =>
  promises.run(requests.slice(), () =>
    csp.run(requests.slice(), () => 
      callbacks.runAsync(requests.slice(), () =>
        promises.runAsync(requests.slice(), () =>
          csp.runAsync(requests.slice(), () => {}))))))
