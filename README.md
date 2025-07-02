# Code is a Liability

It slows you down, creates risks, increases maintainability burdens. So let's commit less of it.

With just _one dependency_, you get a modern microservice framework

- **Testing** with built-in mocking and timeshift support
- **HTTP** endpoints
- **Pub/sub** events
- **CRON**
- **Structured logging**
- **LLM rules** and customized **MCP server** (coming soon)
- **JWT** support built-in
- **Minification** to protect your IP from hosting providers

with as little code as possible.

## Get Started

Simply run

```sh
$ npm install @riddance/service
```

Drop a `.ts` file in the directory, e.g.

```ts
// greeting.ts
import { get } from '@riddance/service/http';

get('greeting', (context, request) => {
    return {
        body: { message: 'Hello, World!' },
    };
});
```

and a correspoding file in a `test` subdirectory:

```ts
// test/greeting.ts
import { request } from '@riddance/service/test/http';
import assert from 'node:assert/strict';

describe('greeting', () => {
    it('should say hi', async () => {
        const response = await request({ uri: 'greeting' });

        assert.strictEqual(response.status, 200);
        assert.strictEqual(response.body.message, 'Hello, World!');
    });
});
```

It doesn't get shorter than that, right? See the `example` directory for other examples.

To deploy it to your favorite cloud provider, create a `../glue/glue.json` file:

```json
{
    "services": {
        "greeting": {}
    }
}
```

and run

```sh
$ npx @riddance/deploy test
```

It'll end it's output with something like

```
hosting on https://xyz.execute-api.eu-central-1.amazonaws.com/
```

and you can then try it out

```sh
$ curl https://xyz.execute-api.eu-central-1.amazonaws.com/greeting
```
