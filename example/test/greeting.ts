import { freezeTime, getEmitted, getLoggedEntries, request } from '@riddance/service/test/http'
import assert from 'node:assert/strict'

describe('greeting', () => {
    it('should say hi', async () => {
        freezeTime(new Date(Date.UTC(2024, 8, 20, 20, 20)))
        const response = await request({ uri: `greeting/step?who=world` })

        assert.strictEqual(response.status, 200)
        assert.deepStrictEqual(response.body, {
            step: 'step',
            message: 'Hello, world!',
            now: '2024-09-20T20:20:00.000Z',
        })
        assert.deepStrictEqual(
            getLoggedEntries()
                .filter(e => e.level === 'info')
                .map(e => e.message),
            ['here'],
        )
        assert.deepStrictEqual(getEmitted(), [
            {
                topic: 'greeting',
                type: 'sent',
                subject: 'anonymous',
                messageId: undefined,
                data: {
                    message: 'hello',
                    who: 'world',
                },
            },
        ])
    })
})
