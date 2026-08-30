from langchain.callbacks.base import AsyncCallbackHandler
import asyncio


class StreamingCallbackHandler(AsyncCallbackHandler):
    def __init__(self):
        self.queue = asyncio.Queue()
        self.done = asyncio.Event()

    async def on_llm_new_token(self, token: str, **kwargs):
        await self.queue.put(token)

    async def on_llm_end(self, *args, **kwargs):
        self.done.set()

    async def token_generator(self):
        while True:

            if self.done.is_set() and self.queue.empty():
                break

            try:
                token = await asyncio.wait_for(
                    self.queue.get(),
                    timeout=0.1
                )
                yield token

            except asyncio.TimeoutError:
                continue