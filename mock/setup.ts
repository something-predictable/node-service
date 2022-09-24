/* eslint-disable no-console */
import { resetMemoryDocuments, setupMemoryDocuments } from '@riddance/docs/test/in-memory'
import {
    BufferedEvent,
    ClientInfo,
    createContext,
    LogEntry,
    LogLevel,
    LogTransport,
} from '@riddance/host/context'
import { Metadata, setMeta } from '@riddance/host/registry'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { EOL } from 'node:os'
import { basename, extname, join, resolve } from 'node:path'
import { performance } from 'node:perf_hooks'
import { pathToFileURL } from 'node:url'
import { Environment, Json } from '../context.js'

export function setup() {
    setupTestContext()
    installDocs()
    before(async () => {
        const { name, config } = await readConfig()
        const dir = process.cwd()
        const files = (await readdir('.')).filter(
            file => extname(file) === '.ts' && !file.endsWith('.d.ts'),
        )
        for (const file of files) {
            const base = basename(file, '.ts')
            setMeta(name, base, undefined, config)
            await import(pathToFileURL(join(dir, base + '.js')).toString())
        }
    })
}

async function readEnv() {
    try {
        const envText = await readFile('test/env.txt', 'utf-8')
        return Object.fromEntries(
            envText
                .split(EOL)
                .filter(l => l.length !== 0 && !l.startsWith('#'))
                .map(line => {
                    const ix = line.indexOf('=')
                    return [line.substring(0, ix).trim(), line.substring(ix + 1).trim()]
                }),
        )
    } catch (e) {
        if ((e as { code?: string }).code === 'ENOENT') {
            return {}
        }
        throw e
    }
}

async function readConfig() {
    const packageJson = JSON.parse(await readFile('package.json', 'utf-8')) as {
        name: string
        config?: object
    }
    return packageJson
}

function installDocs() {
    beforeEach(setupMemoryDocuments)
    afterEach(resetMemoryDocuments)
}

let testContext: TestContext | undefined

function setupTestContext() {
    beforeEach('Clear logged entries', async () => {
        const env = await readEnv()
        if (testContext) {
            throw Error('Context exists.')
        }
        testContext = new TestContext(env)
    })

    afterEach('Check log', async function () {
        if (!testContext) {
            throw Error('Test context lost.')
        }
        const test = this.currentTest
        if (test) {
            const title = test.fullTitle()
            if (test.isFailed()) {
                await testContext.log.dumpLog(title)
            }
            if (testContext.log.failed) {
                if (!test.isFailed()) {
                    await testContext.log.dumpLog(title)
                    throw Error(
                        `"${title}" passed but subsequently failed because errors was logged during the test. Wrap the test code in allowErrorLogs if the error log entries are expected.`,
                    )
                }
            }
        }
        testContext = undefined
    })
}

export function createMockContext(client: ClientInfo, meta?: Metadata) {
    const ctx = getTestContext()
    return createContext(
        client,
        [ctx.log],
        {
            publishRate: 100,
            sendEvents: (topic, events: BufferedEvent[]) => {
                ctx.emitted.push(
                    ...events.map(e => ({
                        topic,
                        type: e.meta.type,
                        subject: e.meta.subject,
                        data: e.json,
                        messageId: e.meta.id,
                    })),
                )
                return Promise.resolve()
            },
        },
        { default: 15 },
        new AbortController(),
        meta,
        ctx.env,
        () => ctx.now(),
    )
}

export function getTestContext(): TestContext {
    if (!testContext) {
        throw Error('No test is running.')
    }
    return testContext
}

class MockLogger implements LogTransport {
    #entries: LogEntry[] = []
    readonly #startTime = Math.round(performance.now() * 10000)
    failOnErrorLogs = true
    failed = false

    getEntries() {
        return [...this.#entries]
    }

    clear() {
        this.#entries = []
        this.failOnErrorLogs = true
        this.failed = false
    }

    sendEntries(entries: LogEntry[]) {
        if (this.failOnErrorLogs && entries.some(e => e.level === 'error' || e.level === 'fatal')) {
            this.failed = true
        }
        this.#entries.push(...entries)
        return undefined
    }

    #msSinceStart(entry: LogEntry) {
        return (Math.round(entry.timestamp * 10000) - this.#startTime) / 10000
    }

    async dumpLog(testTitle: string) {
        if (this.#entries.length !== 0) {
            const p = this.writeLog()
            const errors = this.#entries.filter(e => e.level === 'fatal' || e.level === 'error')
            if (errors.length !== 0) {
                console.error(testTitle + ' error log:')
                errors.forEach(e => {
                    console.error(
                        `@${this.#msSinceStart(e)}ms ${levelString(e.level)} ${e.message}`,
                    )
                    if (e.error) {
                        console.error(e.error)
                    }
                })
            }
            const logFile = await p
            if (logFile) {
                console.info(`Full log of "${testTitle}" saved to ${resolve(logFile)}`)
            }
        }
    }

    async writeLog() {
        try {
            const resultPath = join('test', 'results')
            await mkdir(resultPath, { recursive: true })
            const name = join(
                resultPath,
                'log-' + new Date().toISOString().replaceAll(':', '') + '.json',
            )
            await writeFile(
                name,
                `[${this.#entries
                    .map(e =>
                        JSON.stringify(
                            {
                                timeOffset: this.#msSinceStart(e),
                                ...JSON.parse(e.json),
                            },
                            undefined,
                            '  ',
                        ),
                    )
                    .join(',' + EOL)}]`,
            )
            return name
        } catch (e) {
            console.error(`Error saving log:`)
            console.error(e)
            console.log('Full log:')
            this.#entries.forEach(entry => {
                console.log(
                    `@${this.#msSinceStart(entry)}ms ${levelString(entry.level)} ${entry.message}`,
                )
                if (entry.error) {
                    console.log(entry.error)
                }
            })
            return undefined
        }
    }
}

function levelString(level: LogLevel) {
    switch (level) {
        case 'trace':
            return '[TRACE]  '
        case 'debug':
            return '[DEBUG]  '
        case 'info':
            return '[INFO]   '
        case 'warning':
            return '[WARNING]'
        case 'error':
            return '[ERROR]  '
        case 'fatal':
            return '[FATAL]  '
        default:
            return '         '
    }
}

interface Event {
    topic: string
    type: string
    subject: string
    data?: Json
    messageId: string | undefined
}

class TestContext {
    readonly log: MockLogger

    get env() {
        return this.environment
    }

    environment: { [key: string]: string }
    emitted: Event[] = []

    timeShift = 0

    constructor(env: Environment) {
        this.environment = {
            BEARER_PUBLIC_KEY:
                'MHYwEAYHKoZIzj0CAQYFK4EEACIDYgAESKk7sgjLJNz4erSkGiuFRQCUZiVELR4VjqrWS01kKxZSthAKuX5A4ib8ODd2le/4m99vBIKpDKWP6CT/LvhzcXstSxz4VaOkbczfo3VUvKREi0yUZLasKB5oQP2AGAyr',
            BEARER_PRIVATE_KEY:
                'MIGkAgEBBDCuIjzsQ+q0iCuyEiLq9vFfZ6Lj6/vxlZDxLanGoO88yL9V0EsZbofwvpW4cb32++SgBwYFK4EEACKhZANiAARIqTuyCMsk3Ph6tKQaK4VFAJRmJUQtHhWOqtZLTWQrFlK2EAq5fkDiJvw4N3aV7/ib328EgqkMpY/oJP8u+HNxey1LHPhVo6RtzN+jdVS8pESLTJRktqwoHmhA/YAYDKs=',
            ...env,
        }
        this.log = new MockLogger()
    }

    now(): Date {
        const d = new Date()
        d.setUTCSeconds(d.getUTCSeconds() + this.timeShift)
        return d
    }
}
