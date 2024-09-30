import { Context, Json } from './context.js'
import { verify } from './lib/jwt.js'

export * from '@riddance/host/lib/http'
export * from './context.js'

/*@__INLINE__*/
export function withStatus(error: Error, status: number) {
    return Object.assign(error, { statusCode: status })
}

export function withPublicMessage(error: Error, message?: string): Error {
    if (message) {
        const enriched = error as unknown as { [key: string]: unknown }
        if (enriched.body) {
            ;(enriched.body as { [key: string]: unknown }).message = message
        } else {
            enriched.body = { message }
        }
    }
    return error
}

export function badRequest(publicMessage?: string) {
    return withPublicMessage(withStatus(new Error('Bad request'), 400), publicMessage)
}

/** Please authenticate yourself, e.g. log in or refresh your tokens. */
export function unauthorized() {
    return withStatus(new Error('Unauthorized'), 401)
}

/** I known who you are; you're never getting in. */
export function forbidden() {
    return withStatus(new Error('Forbidden'), 403)
}

export function notFound() {
    return withStatus(new Error('Not found'), 404)
}

export function notImplemented() {
    return withStatus(new Error('Not implemented'), 501)
}

/*@__NO_SIDE_EFFECTS__*/ export function getBearer(
    context: Context,
    req: { headers: { authorization?: string } },
): Json {
    const key = context.env.BEARER_PUBLIC_KEY
    if (!key) {
        throw new Error('Please set the BEARER_PUBLIC_KEY environment variable to extract bearer.')
    }
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
        throw unauthorized()
    }
    try {
        const token = authHeader.slice('Bearer '.length)
        const certificate = '-----BEGIN PUBLIC KEY-----/n' + key + '/n-----END PUBLIC KEY-----'
        return /*@__PURE__*/ verify(token, certificate)
    } catch (e) {
        context.log.debug('Error verifying jwt.', e)
        throw unauthorized()
    }
}
