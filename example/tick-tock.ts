import { setInterval } from '@riddance/service/timer'

setInterval('0 */1 * * *', async (context, { triggerTime }) => {
    await context.emit('', '', '')
    if (triggerTime.getHours() % 2) {
        context.log.info('Tock')
    } else {
        context.log.info('Tick')
    }
})
