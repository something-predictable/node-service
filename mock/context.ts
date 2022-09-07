import { LogEntry } from '@riddance/host/context'
import { Environment, Json } from '../context.js'
import { getTestContext } from './setup.js'

export function getLoggedEntries(): LogEntry[] {
    return getTestContext().log.getEntries()
}

export function clearLoggedEntries() {
    return getTestContext().log.clear()
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

export async function allowErrorLogs<T>(fn: () => Promise<T> | T) {
    getTestContext().log.failOnErrorLogs = false
    try {
        return await fn()
    } finally {
        getTestContext().log.failOnErrorLogs = true
    }
}

export function timeShift(seconds: number): void {
    getTestContext().timeShift += seconds
}

export function timeShiftTo(when: Date): void {
    getTestContext().timeShift = 0
    timeShift((when.getTime() - new Date().getTime()) / 1000)
}

export function getEnvironment() {
    return { ...getTestContext().env }
}

export function setEnvironment(env: Environment) {
    Object.assign(getTestContext().env, env)
}
