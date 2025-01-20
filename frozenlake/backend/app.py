from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import gym
import numpy as np
import base64
from io import BytesIO
from PIL import Image
import logging

# Set up logging to capture errors
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize the environment
env = gym.make("FrozenLake-v1", is_slippery=True, map_name="8x8", render_mode="rgb_array")
env.reset()  # Ensure the environment is initialized

app = FastAPI()

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)

# Helper function to encode the environment's image
def encode_image(image):
    pil_image = Image.fromarray(image)
    buffered = BytesIO()
    pil_image.save(buffered, format="PNG")
    return base64.b64encode(buffered.getvalue()).decode("utf-8")

@app.post("/step")
async def step(request: Request):
    try:
        # Get the action from the request body
        data = await request.json()
        action = data.get("action")
        
        if action is None:
            raise HTTPException(status_code=400, detail="Action is required")
        
        # Log the action received
        logger.info(f"Action received: {action}")
        
        # Validate action range (should be between 0 and 3)
        if action not in [0, 1, 2, 3]:
            raise HTTPException(status_code=400, detail="Invalid action")
        
        # Take the action in the environment
        observation, reward, done, truncated, info = env.step(action)
        
        # Log environment state after step
        logger.info(f"Step result - Observation: {observation}, Reward: {reward}, Done: {done}, Truncated: {truncated}, Info: {info}")
        
        # Get the last action (move name)
        move_name = ["Left", "Down", "Right", "Up"][action]  # Example move names (adjust as needed)

        # Render the environment and encode it
        image = env.render()
        encoded_image = encode_image(image)

        return {
            "state": observation,  # Optionally return the state
            "reward": reward,
            "done": done,
            "truncated": truncated,  # Return the truncated flag
            "image": encoded_image,
            "move": move_name,
        }
    except Exception as e:
        logger.error(f"Error during step: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.post("/reset")
async def reset():
    try:
        # Reset the environment and get the initial state
        initial_state = env.reset()
        image = env.render()
        encoded_image = encode_image(image)
        return {
            "state": initial_state,
            "image": encoded_image
        }
    except Exception as e:
        logger.error(f"Error during reset: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
