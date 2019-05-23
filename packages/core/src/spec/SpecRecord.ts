import { getPlugin } from '../plugin';
import { SimulationMismatch } from './errors';
import { isMismatchAction } from './isMismatchAction';
import { InvokeAction, SpecAction, SpecRecord, GetAction, SetAction } from './types';
import { log } from '../common';
import { tersify } from 'tersify';

export type SpecRecordTracker = ReturnType<typeof createSpecRecordTracker>

export function createSpecRecordTracker(record: SpecRecord) {
  return {
    getId(plugin: string, target: any, isSubject?: true) {
      const id = this.findId(target)
      if (!id) {
        record.refs.push(isSubject ? { plugin, target, isSubject } : { plugin, target })
        return String(record.refs.length - 1)
      }

      return id
    },
    findId(target: any) {
      const id = record.refs.findIndex(ref => ref.target === target)
      if (id !== -1) return String(id)
      return undefined
    },
    invoke(ref: string, args: any[]) {
      record.actions.push({
        type: 'invoke',
        id: ref,
        payload: args.map(arg => this.findId(arg) || arg)
      })
    },
    get(ref: string, prop: string | number) {
      record.actions.push({
        type: 'get',
        id: ref,
        payload: prop
      })
    },
    set(ref: string, prop: string | number, value: any) {
      record.actions.push({
        type: 'set',
        id: ref,
        payload: [prop, value]
      })
    },
    return(ref: string, result: any) {
      const payload = this.findId(result) || result
      record.actions.push({
        type: 'return',
        id: ref,
        payload
      })
    },
    throw(ref: string, err: any) {
      const payload = this.findId(err) || err
      record.actions.push({
        type: 'throw',
        id: ref,
        payload
      })
    },

    addAction(action: SpecAction) {
      record.actions.push(action)
    }
  }
}

export type SpecRecordValidator = ReturnType<typeof createSpecRecordValidator>

export function createSpecRecordValidator(id: string, loaded: SpecRecord, record: SpecRecord) {
  // not using specific type as the type is platform specific (i.e. NodeJS.Immediate)
  const scheduled: any[] = []
  return {
    loaded,
    record,
    getId(plugin: string, target: any) {
      const ref = this.findId(target)
      if (!ref) {
        record.refs.push({ plugin, target })
        return String(record.refs.length - 1)
      }

      return ref
    },
    findId(target: any) {
      const ref = record.refs.findIndex(ref => ref.target === target)
      if (ref !== -1) return String(ref)
      return undefined
    },
    getRef(id: string) {
      return record.refs[Number(id)]
    },
    isSubject(ref: string) {
      const index = Number(ref)
      return !!loaded.refs[index].isSubject
    },
    getTarget(ref: string) {
      const index = Number(ref)
      let specRef = record.refs[index]
      if (specRef) return specRef.target

      specRef = loaded.refs[index]
      if (specRef) {
        const plugin = getPlugin(specRef.plugin)
        if (plugin && plugin.deserialize) {
          return plugin.deserialize(specRef.target)
        }
        else {
          return specRef.target
        }
      }

      return undefined
    },
    peekNextAction(): SpecAction | undefined {
      return loaded.actions[record.actions.length]
    },
    invoke(ref: string, args: any[]) {
      const action: InvokeAction = {
        type: 'invoke',
        id: ref,
        payload: args.map(arg => this.findId(arg) || arg)
      }
      validateAction(id, loaded, record, action)
      record.actions.push(action)
    },
    get(ref: string, prop: string | number) {
      const action: GetAction = {
        type: 'get',
        id: ref,
        payload: prop
      }
      validateAction(id, loaded, record, action)
      record.actions.push(action)
    },
    set(ref: string, prop: string | number, value: any) {
      const action: SetAction = {
        type: 'set',
        id: ref,
        payload: [prop, value]
      }
      validateAction(id, loaded, record, action)
      record.actions.push(action)
    },
    return() {
      const next = this.peekNextAction()!
      const result = this.getTarget(next.payload) || next.payload
      validateAction(id, loaded, record, next)
      record.actions.push(next)
      return result
    },
    throw() {
      const next = this.peekNextAction()!
      const err = this.getTarget(next.payload) || next.payload
      validateAction(id, loaded, record, next)
      record.actions.push(next)
      return err
    },
    addAction(action: SpecAction) {
      validateAction(id, loaded, record, action)
      record.actions.push(action)
    },
    succeed() {
      const next = this.peekNextAction()!
      return next.type === 'return'
    },
    processNextActions() {
      const next = this.peekNextAction()
      log.debug(`next action:`, next)
      if (!next || this.isSubject(next.id)) return

      const ref = this.getRef(next.id)
      const plugin = getPlugin(ref.plugin)!
      const target = this.getTarget(next.id)

      // TOTHINK: where does the return value go to? All not used?
      switch (next.type) {
        case 'invoke':
          const args = next.payload.map(x => typeof x === 'string' ? this.getTarget(x) : x)
          log.onDebug(() => `auto invoke: "${this.findId(target)}" with ${tersify(args)}`)
          plugin.invoke!(target, args)
          this.processNextActions()
          break;
        case 'get':
          log.onDebug(() => `auto get: "${this.findId(target)}" for ${tersify(next.payload)}`)
          plugin.get!(target, next.payload)
          this.processNextActions()
          break;
      }
    },
    scheduleProcessNextActions() {
      scheduled.push(setImmediate(() => this.processNextActions()))
    },
    stop() {

      scheduled.forEach(s => clearImmediate(s))
    }
  }
}

function validateAction(id: string, actualRecord: SpecRecord, record: SpecRecord, action: SpecAction) {
  const expected = actualRecord.actions[record.actions.length]
  if (isMismatchAction(action, expected)) {
    throw new SimulationMismatch(id, expected, action)
  }
}
