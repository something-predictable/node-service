import { LogEntry } from '@riddance/host/context'
import { Environment, Json } from '../context.js'
import { getTestContext } from './setup.js'

export function getLoggedEntries(): LogEntry[] {
    return getTestContext().log.getEntries()
}

export function clearLoggedEntries() {
    getTestContext().log.clear()
}

export function getEmitted(): {
    topic: string
    type: string
    subject: string
    data?: Json
    messageId?: string
}[] {
    return [...getTestContext().emitted]
}

export function clearEmitted() {
    getTestContext().emitted = []
}

export function allowErrorLogs() {
    const l = getTestContext().log
    l.failOnErrorLogs = false
    return {
        [Symbol.dispose]: () => {
            l.failOnErrorLogs = true
        },
    }
}

export function timeShift(seconds: number) {
    getTestContext().timeShift += seconds
}

export function timeShiftTo(when: Date) {
    getTestContext().timeShift = 0
    timeShift((when.getTime() - Date.now()) / 1000)
}

export function freezeTime(when: Date) {
    getTestContext().frozenTime = when.getTime()
}

export function unfreezeTime() {
    getTestContext().frozenTime = undefined
}

export function getEnvironment() {
    return { ...getTestContext().env }
}

export function setEnvironment(env: Partial<Environment>) {
    Object.assign(getTestContext().env, env)
}
