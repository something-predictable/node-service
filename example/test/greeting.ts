import { getLoggedEntries, request, timeShiftTo } from '@riddance/service/test/http'
import assert from 'node:assert/strict'

describe('greeting', () => {
    it('should say hi', async () => {
        timeShiftTo(new Date(Date.UTC(2024, 8, 20, 20, 20)))
        const response = await request({ uri: `greeting/step?who=world` })

        assert.strictEqual(response.status, 200)
        assert.strictEqual(response.body.step, 'step')
        assert.strictEqual(response.body.message, 'Hello, world!')
        assert.strictEqual(response.body.now.slice(0, 14), '2024-09-20T20:')
        assert.deepStrictEqual(
            getLoggedEntries()
                .filter(e => e.level === 'info')
                .map(e => e.message),
            ['here'],
        )
    })
})
