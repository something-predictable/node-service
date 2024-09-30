import { get } from '@riddance/service/http'

get('greeting/*', (context, request) => {
    context.log.info('here')
    return {
        body: JSON.stringify({
            now: context.now(),
            step: request.url.pathStepAt(1),
            message: `Hello, ${request.url.searchParams.get('who') ?? 'World'}!`,
        }),
    }
})
