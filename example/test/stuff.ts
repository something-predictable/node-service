import { allowErrorLogs, emit, getLoggedEntries } from '@riddance/service/test/event'
import assert from 'node:assert/strict'

describe('stuff event', () => {
    it('throws on bad subject', async () => {
        using _ = allowErrorLogs()
        await emit('stuff', 'happened', '1', {
            what: 'this',
        })

        assert.deepStrictEqual(
            getLoggedEntries().filter(e => e.level === 'info'),
            [],
        )
        assert.deepStrictEqual(
            getLoggedEntries()
                .filter(e => e.level === 'error')
                .map(e => e.message),
            ['Event END'],
        )
    })

    it('throws on bad data', async () => {
        using _ = allowErrorLogs()
        await emit('stuff', 'happened', '1234', {
            what: 3,
        })

        assert.deepStrictEqual(
            getLoggedEntries().filter(e => e.level === 'info'),
            [],
        )
        assert.deepStrictEqual(
            getLoggedEntries()
                .filter(e => e.level === 'error')
                .map(e => e.message),
            ['Event END'],
        )
    })

    it('gets the message', async () => {
        await emit('stuff', 'happened', '1234', {
            what: new Date(),
        })

        assert.deepStrictEqual(
            getLoggedEntries()
                .filter(e => e.level === 'info')
                .map(e => e.message),
            ['So it did'],
        )
    })
})
