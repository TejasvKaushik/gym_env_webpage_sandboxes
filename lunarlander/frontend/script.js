let isGameRunning = false;
let currentState = null; // To store the agent's current state

async function resetEnvironment() {
    try {
        const response = await fetch("http://localhost:8001/reset", {
            method: "POST",
        });

        if (!response.ok) {
            const error = await response.json();
            console.error("Error resetting environment:", error);
            alert("Failed to reset the environment: " + (error.error || "Unknown error"));
            return false;
        }

        const data = await response.json();
        console.log("Environment reset:", data);

        // Set the image to the game canvas
        if (data.image) {
            document.getElementById("gameCanvas").src = `data:image/png;base64,${data.image}`;
        }

        // You can also log the state or handle it here as needed
        console.log("Initial state:", data.state);

        return true;
    } catch (error) {
        console.error("Error during reset:", error);
        alert("Failed to connect to the backend.");
        return false;
    }
}


async function startGame() {
    if (isGameRunning) return;

    const resetSuccess = await resetEnvironment();
    if (!resetSuccess) return;

    isGameRunning = true;
    document.getElementById("status").textContent = "Preparing for landing 🚀";
    document.querySelector("button").textContent = "Game Running..."; // Change button text
}

async function resetGame() {
    const resetSuccess = await resetEnvironment();
    if (!resetSuccess) return;

    isGameRunning = true;
    alert("Game Reset!");
}

async function sendAction(action) {
    if (!isGameRunning) return;

    try {
        const response = await fetch("http://localhost:8001/step", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ action }),
        });

        if (!response.ok) {
            const error = await response.json();
            console.error("Backend error:", error);
            alert("An error occurred: " + (error.detail || "Unknown error"));
            return;
        }

        const data = await response.json();
        console.log("Agent state:", data);

        // Update the game image
        if (data.image) {
            document.getElementById("gameCanvas").src = `data:image/png;base64,${data.image}`;
        }

        // Update the last move message
        document.getElementById("lastMove").textContent = `Last Move: ${data.move}`;

        // Update current state
        currentState = data.state;

        // Check if the game is over
        if (data.done) {
            isGameRunning = false;
            document.getElementById("status").textContent = "GAME OVER! 🚀";
            document.querySelector("button").textContent = "Start Game"; // Reset button text
        }
    } catch (error) {
        console.error("Error during fetch:", error);
        alert("Failed to connect to the backend.");
    }
}

// Action mappings for LunarLander (Discrete Actions)
const actionMap = {
    ArrowLeft: 0, // Fire Left Engine
    ArrowDown: 1, // Fire Main Engine
    ArrowRight: 2, // Fire Right Engine
    ArrowUp: 3, // Do Nothing
};

// Listen for keydown events to trigger actions
document.addEventListener("keydown", (event) => {
    if (!isGameRunning) return;

    const action = actionMap[event.key];
    if (action !== undefined) {
        sendAction(action);
    }
});
