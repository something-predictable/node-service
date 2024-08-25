import { clientFromHeaders, executeRequest } from '@riddance/host/http'
import { Method, getHandlers } from '@riddance/host/registry'
import jwt from 'jsonwebtoken'
import { Environment } from '../http.js'
import { getEnvironment } from './context.js'
import { createMockContext, setup } from './setup.js'

export * from './context.js'

setup()

export type Response = {
    headers: { [key: string]: string }
    status: number
    // Used to assert on in tests, so no need for the type system to get in the way
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body?: any
}

type RequestOptions = BodylessRequestOptions | StringRequestOptions | JsonRequestOptions

type BodylessRequestOptions = {
    method?: Method
    uri: string
    headers?: { readonly [key: string]: string }
}

type StringRequestOptions = BodylessRequestOptions & {
    body: string
}

type JsonRequestOptions = BodylessRequestOptions & {
    json: object
}

export async function request(options: RequestOptions): Promise<Response> {
    const handlers = getHandlers('http')
    const matchingHandlers = handlers.filter(
        h => h.pathRegExp.test(options.uri) && h.method === (options.method ?? 'GET'),
    )
    const [handler] = matchingHandlers
    const { log, context, success, flush } = createMockContext(
        clientFromHeaders(options.headers),
        handler?.config,
        handler?.meta,
    )
    if (!handler) {
        log.error('Request END', undefined, {
            handlers: handlers.map(h => ({
                pathPattern: h.pathPattern,
                pathRegExp: h.pathRegExp.toString(),
                method: h.method,
            })),
            response: {
                status: 404,
            },
        })
        return {
            headers: {},
            status: 404,
        }
    }
    if (matchingHandlers.length !== 1) {
        log.error('Multiple matching handlers.', undefined, { matchingHandlers })
        log.error('Request END', undefined, {
            handlers: handlers.map(h => ({
                pathPattern: h.pathPattern,
                pathRegExp: h.pathRegExp.toString(),
                method: h.method,
            })),
            response: {
                status: 500,
            },
        })
        return {
            headers: {},
            status: 500,
        }
    }
    log.trace('Found handler', undefined, {
        handler: {
            pathPattern: handler.pathPattern,
            pathRegExp: handler.pathRegExp.toString(),
            method: handler.method,
        },
    })

    const response = await executeRequest(
        log,
        context,
        handler,
        {
            ...options,
            uri: 'http://localhost/' + options.uri,
        },
        success,
    )
    await flush()

    return {
        headers: response.headers,
        status: response.status,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        body: response.body ? JSON.parse(response.body.toString()) : undefined,
    }
}

export function withBearer(payload: object, requestOptions: RequestOptions): RequestOptions {
    const token = createBearerToken(getEnvironment(), payload, {
        issuer: 'https://riddance.example.com/oauth/',
        audience: 'https://riddance.example.com/',
        expiresIn: 60, // seconds
    })
    return {
        ...requestOptions,
        headers: {
            ...requestOptions.headers,
            authorization: `Bearer ${token}`,
        },
    }
}

export type BearerTokenOptions = {
    issuer?: string
    audience?: string | string[]
    subject?: string
    expiresIn: number
}

export function createBearerToken(
    env: Environment,
    payload: object,
    options: BearerTokenOptions,
): string {
    const key = env.BEARER_PRIVATE_KEY
    if (!key) {
        throw new Error(
            'Please set the BEARER_PRIVATE_KEY environment variable to be able to create bearer tokens.',
        )
    }
    const certificate = '-----BEGIN EC PRIVATE KEY-----\n' + key + '\n-----END EC PRIVATE KEY-----'
    return jwt.sign(payload, certificate, {
        algorithm: 'ES384',
        ...options,
    })
}
