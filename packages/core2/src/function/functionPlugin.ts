// import { reduceKey } from 'type-plus';
import { SpecPlugin } from '../spec';
import { hasPropertyInPrototype } from '../utils';

export const functionPlugin: SpecPlugin<Function, Record<string, any>> = {
  name: 'function',
  support: subject => {
    if (typeof subject !== 'function') return false

    if (hasPropertyInPrototype(subject)) return false

    return true
  },
  createSpy: ({ declare, getSpy }, subject) => {
    // types of subjects:
    // * the actual spec subject
    // * a supplied function (from arg) that the subject should invoke
    // * a supplied function (from arg) that the caller should invoke
    // * a function created by the subject that is
    // *   returned or thrown, or
    // *   added to the argument (out param, modifying the input directly), and
    // *   the subject should invoke, or
    // *   the caller should invoke.
    // * for object/instance, the properties can be in or out location.
    // func foo({ cb }) {
    //   cb() // active call
    //   return { body }
    // }
    // const r = foo(...)
    // r.body() // passive call
    // func prom() {
    //   return Promise.resolve()
    // }
    // const p = prom()
    // p.then(() => { // active call
    //
    // })
    const spy = function (this: any, ...args: any[]) {
      // Assuming any functions or functions within object are callbacks to be called by the subject.
      const invocation = spyRecorder.invoke(args, { transform: arg => getSpy(arg, { mode: 'autonomous' }) })
      try {
        const result = subject.apply(this, invocation.args)
        return invocation.returns(result, { transform: result => getSpy(result, { mode: 'passive' }) })
      }
      catch (err) {
        throw invocation.throws(err, { transform: err => getSpy(err, { mode: 'passive' }) })
      }
    }
    const spyRecorder = declare(spy)
    return spy
  },
  createStub({ declare, getStub }, subject) {
    // for the spec subject,
    // it can contain additional property for callbacks,
    // so need to access the input subject.
    // e.g.
    // const subject = Object.assign(function () { }, { callback() { } })
    // class Foo { static callback() { } }
    // const subject = { ajax() { }, callback() { } }
    const stub = function (this: any, ...args: any[]) {
      // No transform. The creation of stub/imitator is handled by the framework.
      const invocationResponder = stubRecorder.invoke(args)
      const result = invocationResponder.getResult()
      // the responder will handle the the stub and imitate automatically.
      // so we may not need to do anything in the plugin,
      // and `getResult()` will already return the right stub/imitator.
      if (result.type === 'return') {
        return result.value
        // return invocationResponder.returns(result.value)
      }
      else {
        throw result.value
        // throw invocationResponder.throws(result.value)
      }
    }
    const stubRecorder = declare(stub)
    return stub
    // const stub = function (this: any, ...args: any[]) {
    //   const invocation = stubPlayer.invoke(args)
    //   const result = invocation.getResult()
    //   if (result.type === 'return') {
    //     return invocation.returns(result.payload)
    //   }
    //   else {
    //     throw invocation.throws(result.payload)
    //   }
    // }
    // if (representation) {
    //   Object.assign(stub,
    //     reduceKey(representation, (p, k) => {
    //       // p[k] = player.resolve(representation[k])
    //       return p
    //     }, {} as Record<string, any>))
    // }
    // const stubPlayer = declare()
    // stubPlayer.setTarget(stub)
    // if (!subject) {
    //   // player.on('invoke', args => {
    //   //   stub(...args)
    //   // })
    // }
    // return stub
  },
}
