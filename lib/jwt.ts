import { jwtVerify } from 'jose/jwt/verify'
import { createPublicKey } from 'node:crypto'
import type { Json } from '../context.js'

export async function verify(token: string, certificate: string): Promise<Json> {
    const result = await jwtVerify<Json>(token, createPublicKey({ key: certificate }))
    return result.payload
}
