import { post } from '@riddance/service/http'

post('echo/*', (_, request) => {
    return {
        headers: {
            'x-in-response-to': request.url.href,
        },
        body: request.body ? JSON.stringify(request.body) : undefined,
    }
})
