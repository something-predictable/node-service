import { request } from '@riddance/service/test/http'
import assert from 'node:assert/strict'

describe('echo', () => {
    it('should kick json back', async () => {
        const response = await request({
            method: 'POST',
            uri: 'echo/step',
            json: { message: 'hi' },
        })
        assert.strictEqual(response.status, 200)
        assert.strictEqual(response.headers['x-in-response-to'], 'http://localhost/echo/step')
        assert.strictEqual(response.body.message, 'hi')
    })
})
