import { badRequest, forbidden, get, getBearer, objectSpreadable } from '@riddance/service/http'

get('authorized', (context, request) => {
    const { sub } = objectSpreadable(getBearer(context, request))
    if (sub !== '🤫') {
        throw forbidden()
    }
    const query = request.url.searchParams.get('q')
    if (query === null) {
        throw badRequest('None query provided.')
    }
    return {
        body: JSON.stringify({
            items: [],
        }),
    }
})
