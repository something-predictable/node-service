import { objectSpreadable, on } from '@riddance/service/event'

on('stuff', 'happened', (context, subject, event) => {
    const { what } = objectSpreadable(event)
    if (typeof what !== 'string') {
        throw new TypeError('Unexpected event data.')
    }
    if (subject.length < 4) {
        throw new Error('Unsupported subject')
    }
    context.log.info('So it did')
})
