import { handle } from '@riddance/host/event'
import { getHandlers } from '@riddance/host/registry'
import type { Json } from '../context.js'
import { createMockContext, getTestContext } from './setup.js'

export * from './context.js'

export async function emit(
    topic: string,
    type: string,
    subject: string,
    data: unknown,
    messageId?: string,
): Promise<boolean> {
    const timestamp = getTestContext().now()
    const matching = getHandlers('event').filter(h => h.topic === topic && h.type === type)
    const serialized =
        data === undefined
            ? undefined
            : // eslint-disable-next-line unicorn/prefer-structured-clone
              (JSON.parse(JSON.stringify(data)) as {
                  readonly [key: string]: Json
              })
    const result = await Promise.allSettled(
        matching.map(async handler => {
            const { log, context, success, flush } = createMockContext(
                {},
                handler.config,
                handler.meta,
            )
            log.trace('Found handler', undefined, {
                handler: { topic, type },
            })
            const succeeded = await handle(
                log,
                context,
                handler,
                { subject, event: serialized, timestamp, messageId },
                success,
            )
            await flush()
            return succeeded
        }),
    )
    return result.every(r => r.status === 'fulfilled' && r.value)
}
