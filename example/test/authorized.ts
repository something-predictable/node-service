import { allowErrorLogs, request, withBearer } from '@riddance/service/test/http'
import assert from 'node:assert/strict'

describe('authorized', () => {
    it('should forbid', async () => {
        using _ = allowErrorLogs()
        const response = await request({ uri: `authorized` })

        assert.strictEqual(response.status, 401)
    })

    it('should authorize', async () => {
        using _ = allowErrorLogs()
        const response = await request(await withBearer({ sub: 'its me' }, { uri: `authorized` }))

        assert.strictEqual(response.status, 403)
    })

    it('should check', async () => {
        using _ = allowErrorLogs()
        const response = await request(await withBearer({ sub: '🤫' }, { uri: `authorized` }))

        assert.strictEqual(response.status, 400)
    })

    it('should check', async () => {
        const response = await request(
            await withBearer({ sub: '🤫' }, { uri: `authorized?q=stuff` }),
        )

        assert.strictEqual(response.status, 200)
        assert.deepStrictEqual(response.body, { items: [] })
    })
})
