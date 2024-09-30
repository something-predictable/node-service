import { badRequest, forbidden, get, unauthorized } from '@riddance/service/http'

get('check', (_, request) => {
    const key = request.url.searchParams.get('key')
    if (key === null) {
        throw unauthorized()
    }
    if (key !== '🤫') {
        throw forbidden()
    }
    const query = request.url.searchParams.get('q')
    if (query === null) {
        throw badRequest('No query provided.')
    }
    return {
        body: JSON.stringify({
            items: [],
        }),
    }
})
