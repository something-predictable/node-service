import { badRequest, forbidden, get, getBearer, objectSpreadable } from '@riddance/service/http'

get('authorized', async (context, request) => {
    const { sub } = objectSpreadable(await getBearer(context, request))
    if (sub !== '🤫') {
        throw forbidden()
    }
    const query = request.url.searchParams.get('q')
    if (query === null) {
        throw badRequest('None query provided.')
    }
    return {
        body: {
            items: [],
        },
    }
})
