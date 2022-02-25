import websockets
import asyncio
import json

ID = "07e63f8d-549f-45dd-9e0f-e0bbb13112fe"
RemoteID = "59bd8809-0a26-44e4-aa19-f760fee70dce"

async def listen():
    url = "ws://localhost:3000/" + ID
    async with websockets.connect(url) as ws:
        while True:
            try:
                inComing = await ws.recv()
                inComingPacket = json.loads(inComing.decode("utf-8"))
                print(inComingPacket["destinationID"])
                if(inComingPacket["destinationID"] == ID and inComingPacket["id"] == RemoteID):
                    print("Command Attempt: " + inComingPacket["type"])
                else:
                    print("Attempt Denayed")
            except Exception as e: 
                print("ERROR: " , e)

        
            
asyncio.get_event_loop().run_until_complete(listen())
