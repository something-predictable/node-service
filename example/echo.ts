import { post } from '@riddance/service/http'

post('echo/*', (_, request) => {
    const now = (request.body as { now?: string } | undefined)?.now
    return {
        headers: {
            'x-in-response-to': request.url.href,
            ...(typeof now === 'string' && { time: new Date(now).getTime().toString() }),
        },
        body: request.body,
    }
})
