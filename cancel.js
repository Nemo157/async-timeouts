export class CancelledOperationError extends Error {
  constructor() {
    super()
    this.message = 'Operation cancelled'
    this.name = 'CancelledOperationError'
  }
}

export class CancellationTokenSource {
  constructor(...tokens) {
    tokens.forEach(token => token.register(() => this.cancel()))
    this._cancelled = false
    this._token = new CancellationToken(this)
  }
  get token() {
    return this._token
  }
  get cancelled() {
    return this._cancelled
  }
  cancel() {
    if (!this.cancelled) {
      this._cancelled = true
      this._token._cancel()
    }
    return this
  }
  cancelAfter(milliseconds) {
    setTimeout(() => this.cancel(), milliseconds)
    return this
  }
}

export class CancellationToken {
  constructor(source) {
    this._source = source
    this._callbacks = []
  }
  get cancelled() {
    return this._source.cancelled
  }
  register(callback) {
    if (this.cancelled) {
      callback()
    } else {
      this._callbacks.push(callback)
      return () => this._callbacks.filter(cb => cb !== callback)
    }
  }
  throwIfCancellationRequested() {
    if (this.cancelled) {
      throw new CancelledOperationError()
    }
  }
  _cancel() {
    this._callbacks.forEach(callback => callback())
  }
}

