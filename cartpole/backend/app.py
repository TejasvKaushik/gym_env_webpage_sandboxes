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
env = gym.make("CartPole-v1", render_mode="rgb_array")
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
        data = await request.json()
        action = data.get("action")
        if action is None:
            raise HTTPException(status_code=400, detail="Action is required")
        
        # Take action in environment
        observation, reward, done, truncated, info = env.step(action)
        image = env.render()  # Render as RGB array
        encoded_image = encode_image(image)  # Encode image to base64
        
        return {
            "state": observation.tolist(),
            "reward": reward,
            "done": done,
            "truncated": truncated,
            "image": encoded_image,
            "move": ["Left", "Right"][action],  # Action names for CartPole
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.post("/reset")
async def reset():
    try:
        # Log the start of the reset process
        logging.info("Resetting the environment...")
        
        # Reset the environment and capture the initial state and image
        initial_state, _ = env.reset()
        logging.info(f"Initial state: {initial_state}")
        
        image = env.render()  # Render as RGB array
        logging.info("Rendered image successfully.")
        
        # Encode image to base64
        encoded_image = encode_image(image)
        logging.info("Image encoded to base64.")
        
        return {
            "state": initial_state.tolist(),  # Convert state to a serializable format
            "image": encoded_image,
        }
    except Exception as e:
        logging.error(f"Error during reset: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
