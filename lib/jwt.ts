import jwt from 'jsonwebtoken/index.js'
import type { Json } from '../context.js'

/*@__NO_SIDE_EFFECTS__*/ export function verify(token: string, certificate: string): Json {
    return jwt.verify(token, certificate, {})
}
