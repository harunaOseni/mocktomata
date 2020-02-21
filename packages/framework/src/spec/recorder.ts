import { PartialPick, required } from 'type-plus'
import { notDefined } from '../constants'
import { findPlugin, getPlugin } from '../spec-plugin/findPlugin'
import { SpecPlugin } from '../spec-plugin/types'
import { getArgumentContext, getPropertyContext, getResultContext, getThisContext } from '../utils'
import { createTimeTracker } from './createTimeTracker'
import { logAction, logCreateSpy, logRecordingTimeout } from './logs'
import { createSpecRecordBuilder } from './record'
import { getDefaultPerformer } from './subjectProfile'
import { Spec, SpecRecord } from './types'
import { Recorder, SpecRecordLive } from './types-internal'

export function createRecorder(specName: string, options: Spec.Options) {
  const timeTracker = createTimeTracker(options, () => logRecordingTimeout(specName, options.timeout))
  const record = createSpecRecordBuilder(specName)
  const context = { record, timeTracker }

  return {
    createSpy: <S>(subject: S) => createSpy(context, subject, { profile: 'target' }),
    end: () => timeTracker.stop(),
    getSpecRecord: () => record.getSpecRecord()
  }
}

function createSpy<S>(context: PartialPick<Recorder.Context, 'state'>, subject: S, options: { profile: SpecRecord.SubjectProfile }) {
  const spyOption = context.state?.spyOptions.find(o => o.subject === subject)
  const plugin = spyOption?.options.plugin ? getPlugin(spyOption.options.plugin) : findPlugin(subject)
  // this is a valid case because there will be new feature in JavaScript that existing plugin will not support
  // istanbul ignore next
  if (!plugin) return undefined
  // `context.state` can only be undefined at `createRecorder()`. At that time `options.profile` is default to `target`
  // so `context.state` will always be defined in this line.
  const profile = options.profile || context.state!.ref.profile

  // Possible sources:
  // spec subject: undefined
  // getProperty on object/function/class/instance.promise: { actionId: getId, site: [propertyName] }
  // getProperty on complex plugin: { actionId: getId, site: [...propPath] }
  // invoke argument: { actionId: invokeId, site: [argIndex] }
  // invoke return: { actionId: returnId }
  // invoke throw: { actionId: throwId }
  // instantiate argument: { actionId: instantiateId, site: [argIndex] }
  // getSpyId from array: no source
  const source = context.state?.source
  const ref: SpecRecordLive.Reference = { plugin: plugin.name, profile, overrideProfiles: [], subject, testDouble: notDefined, source }
  const refId = context.record.addRef(ref)
  const state = { ref, refId, spyOptions: [] }
  logCreateSpy(state, profile, subject)
  const newContext = { ...context, state }
  ref.testDouble = plugin.createSpy(createPluginSpyContext(newContext), subject)
  // TODO: fix circular reference
  return ref.testDouble
}

export function createPluginSpyContext(context: Recorder.Context): SpecPlugin.SpyContext<any> {
  return {
    setSpyOptions: (subject, options) => setSpyOptions(context, subject, options),
    setMeta: meta => setMeta(context, meta),
    getSpyId: value => getSpyId(context, value),
    getProperty: (options, handler) => getProperty(context, options, handler),
    setProperty: (options, handler) => setProperty(context, options, handler),
    invoke: (options, handler) => invoke(context, options, handler),
    instantiate: (options, handler) => instantiate(context, options, handler),
  }
}

export function getSpy<S>(context: Recorder.Context, subject: S, options: { source?: SpecRecord.ReferenceSource, profile?: SpecRecord.SubjectProfile }): S {
  const { record, state } = context

  const sourceRef = state.ref
  const profile = options.profile || sourceRef.profile

  const ref = record.findRef(subject)
  if (ref) {
    if (ref.testDouble === notDefined) {
      const plugin = getPlugin(ref.plugin)
      ref.testDouble = plugin.createSpy(createPluginSpyContext({ ...context, state: { ...state, source: undefined } }), ref.subject)
    }
    return ref.testDouble
  }

  return createSpy({ ...context, state: required(state, { source: options.source ?? state.source }) }, subject, { profile }) || subject
}

function getSpyId<V>(context: Recorder.Context, value: V) {
  const { record } = context
  const spy = getSpy(context, value, {})
  return record.findRefId(spy) || value
}

function setSpyOptions(context: Recorder.Context, subject: any, options: SpecPlugin.SpyContext.setSpyOptions.Options) {
  context.state.spyOptions.push({ subject, options })
}

function setMeta<M extends SpecRecord.Meta>({ state }: Recorder.Context, meta: M) {
  return state.ref.meta = meta
}

function getProperty<V>(
  context: Recorder.Context,
  { key, performer }: SpecPlugin.SpyContext.getProperty.Options,
  handler: SpecPlugin.SpyContext.getProperty.Handler<V>
): V {
  const { record, timeTracker, state } = context
  const action: SpecRecord.GetAction = {
    type: 'get',
    refId: state.refId,
    performer: performer || getDefaultPerformer(state.ref.profile),
    tick: timeTracker.elaspe(),
    key,
  }
  const actionId = record.addAction(action)
  logAction(context.state, actionId, action)
  return handleResult(context, actionId, action.type, handler)
}

function setProperty<V, R>(
  context: Recorder.Context,
  { key, value, performer }: SpecPlugin.SpyContext.setProperty.Options<V>,
  handler: SpecPlugin.SpyContext.setProperty.Handler<V, R>
): R {
  const { record, timeTracker, state } = context
  const action: SpecRecord.SetAction = {
    type: 'set',
    refId: state.refId,
    performer: performer || getDefaultPerformer(state.ref.profile),
    tick: timeTracker.elaspe(),
    key,
    value: notDefined
  }

  const actionId = record.addAction(action)

  return handleResult(context, actionId, action.type, () => {
    const spiedValue = getSpy(
      getPropertyContext(context, actionId, key),
      value,
      { profile: getThisProfile(state.ref.profile), source: { type: 'this', id: actionId } }
    )
    action.value = record.findRefId(spiedValue) || value
    logAction(context.state, actionId, action)
    const result = handler(spiedValue)
    return result
  })
}

function invoke<V, T, A extends any[]>(
  context: Recorder.Context,
  { thisArg, args, performer, site }: SpecPlugin.SpyContext.invoke.Options<T, A>,
  handler: SpecPlugin.SpyContext.invoke.Handler<V, T, A>) {
  const { record, state, timeTracker } = context

  const action: SpecRecord.InvokeAction = {
    type: 'invoke',
    refId: state.refId,
    performer: performer || getDefaultPerformer(state.ref.profile),
    site,
    thisArg: notDefined,
    payload: [],
    tick: timeTracker.elaspe(),
  }
  const actionId = record.addAction(action)

  return handleResult(context, actionId, action.type, () => {
    const spiedThisArg = getSpy(
      getThisContext(context, actionId),
      thisArg,
      { profile: getThisProfile(state.ref.profile), source: { type: 'this', id: actionId } }
    )
    action.thisArg = record.findRefId(spiedThisArg) ?? thisArg

    const spiedArgs = args.map((arg, key) => {
      const spiedArg = getSpy(
        getArgumentContext(context, actionId, key),
        arg,
        { profile: getArgumentProfile(state.ref.profile), source: { type: 'argument', id: actionId, key: key } }
      )
      action.payload.push(record.findRefId(spiedArg) ?? arg)
      return spiedArg
    })

    logAction(context.state, actionId, action)
    const result = handler({ thisArg: spiedThisArg, args: spiedArgs as A })
    // remove overrideProfiles for this and args
    return result
  })
}

function instantiate<V, A extends any[]>(
  context: Recorder.Context,
  { args, performer }: SpecPlugin.SpyContext.instantiate.Options<A>,
  handler: SpecPlugin.SpyContext.instantiate.Handler<V, A>
): V {
  const { record, state, timeTracker } = context
  performer = performer || getDefaultPerformer(state.ref.profile)

  const action: SpecRecord.InstantiateAction = {
    type: 'instantiate',
    refId: state.refId,
    performer,
    payload: [],
    tick: timeTracker.elaspe(),
  }
  const actionId = record.addAction(action)

  return handleResult(context, actionId, action.type, () => {
    const spiedArgs = args.map((arg, key) => {
      const spiedArg = getSpy(
        getArgumentContext(context, actionId, key),
        arg,
        { profile: getArgumentProfile(state.ref.profile), source: { type: 'argument', id: actionId, key: key } }
      )
      action.payload.push(record.findRefId(spiedArg) || arg)
      return spiedArg
    }) as A
    logAction(context.state, actionId, action)
    const result = handler({ args: spiedArgs })

    return result
  })
}

function handleResult(
  context: Recorder.Context,
  actionId: SpecRecord.ActionId,
  actionType: SpecRecord.CauseActions['type'],
  handler: () => any
) {
  try {
    const result = handler()
    return addResultAction(context, actionId, actionType, 'return', result)
  }
  catch (e) {
    throw addResultAction(context, actionId, actionType, 'throw', e)
  }
}
function addResultAction(
  context: Recorder.Context,
  actionId: SpecRecord.ActionId,
  actionType: SpecRecord.CauseActions['type'],
  type: 'return' | 'throw',
  subject: any
) {
  const { record, timeTracker } = context
  const action = { type, actionId, tick: timeTracker.elaspe(), payload: notDefined }
  const id = record.addAction(action)
  const resultContext = getResultContext(context, actionId)
  const spy = getSpy(
    resultContext,
    subject,
    { profile: getResultProfile(context.state.ref.profile, actionType), source: { type: 'result', id } }
  )
  const refId = record.findRefId(spy)
  action.payload = refId !== undefined ? refId : subject
  logAction(resultContext.state, id, action)
  return spy
}

function getThisProfile(parentProfile: SpecRecord.SubjectProfile): SpecRecord.SubjectProfile {
  switch (parentProfile) {
    case 'target': return 'input'
    case 'input': return 'output'
    case 'output': return 'input'
  }
}

function getArgumentProfile(parentProfile: SpecRecord.SubjectProfile): SpecRecord.SubjectProfile {
  switch (parentProfile) {
    case 'target': return 'input'
    case 'input': return 'output'
    case 'output': return 'input'
  }
}

function getResultProfile(
  parentProfile: SpecRecord.SubjectProfile,
  actionType: SpecRecord.CauseActions['type'],
): SpecRecord.SubjectProfile {
  switch (parentProfile) {
    case 'target': return actionType === 'get' ? 'target' : 'output'
    case 'input': return 'input'
    case 'output': return 'output'
  }
}
