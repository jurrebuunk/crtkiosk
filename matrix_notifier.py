import asyncio
import os
from nio import AsyncClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

HOMESERVER = os.getenv("MATRIX_HOMESERVER")
BOT_USER = os.getenv("MATRIX_BOT_USER")
BOT_PASSWORD = os.getenv("MATRIX_BOT_PASSWORD")
ROOM_ID = os.getenv("MATRIX_ROOM_ID")

async def send_matrix_message(message):
    if not all([HOMESERVER, BOT_USER, BOT_PASSWORD, ROOM_ID]):
        print("Error: Matrix credentials not found in environment variables.")
        return False

    # Create the client
    client = AsyncClient(HOMESERVER, BOT_USER)

    try:
        # Log in
        login_response = await client.login(BOT_PASSWORD)
        if not login_response or not hasattr(login_response, "access_token"):
            print("Login failed:", login_response)
            return False

        # Try to join the room
        await client.join(ROOM_ID)

        # Send the message
        response = await client.room_send(
            room_id=ROOM_ID,
            message_type="m.room.message",
            content={
                "msgtype": "m.text",
                "body": message
            }
        )
        
        if hasattr(response, "event_id"):
            print(f"Successfully sent to Matrix! Event ID: {response.event_id}")
            return True
        else:
            print(f"Failed to send to Matrix. Response: {response}")
            return False
    except Exception as e:
        print(f"Exception in matrix_notifier: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        # Close the connection cleanly
        await client.close()

if __name__ == "__main__":
    import sys
    msg = sys.argv[1] if len(sys.argv) > 1 else "Hello from Python!"
    asyncio.run(send_matrix_message(msg))
