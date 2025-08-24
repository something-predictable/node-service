import { get } from '@riddance/service/http'

get('greeting/*', async (context, request) => {
    context.log.info('here')
    const who = request.url.searchParams.get('who') ?? 'World'
    await context.emit('greeting', 'sent', 'anonymous', { message: 'hello', who })
    return {
        body: {
            now: context.now(),
            step: request.url.pathStepAt(1),
            message: `Hello, ${who}!`,
        },
    }
})
