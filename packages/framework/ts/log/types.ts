import type { Logger, LogLevel } from 'standard-log'

export namespace Log {
  export type Context = { log: Logger }
  export type Config = { logLevel?: LogLevel }
}
