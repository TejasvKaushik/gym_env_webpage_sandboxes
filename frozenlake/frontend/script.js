let isGameRunning = false;
let currentPosition = null; // To store the agent's current position

// Grid size (since you are using "8x8" map)
const gridSize = 8;

async function resetEnvironment() {
    try {
        const response = await fetch("http://localhost:8000/reset", {
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

        if (data.image) {
            document.getElementById("gameCanvas").src = `data:image/png;base64,${data.image}`;
        }

        // Convert the state to (x, y) coordinates
        currentPosition = indexToCoords(data.state); // Convert flat state to (x, y) position

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
    document.getElementById("status").textContent = "Start on the icy surface 🥶🥶🥶";
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
        const response = await fetch("http://localhost:8000/step", {
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

        // Debugging: Log the positions
        console.log("Current Position:", currentPosition);
        console.log("Action taken:", action);

        // Calculate expected position based on current position and action
        if (currentPosition !== null) {
            const expectedPosition = getExpectedPosition(currentPosition, action);

            // Debugging: Log the expected position
            console.log("Expected Position:", expectedPosition);

            // Convert the state to (x, y) coordinates for comparison
            const newPosition = indexToCoords(data.state);

            // Debugging: Log the new position
            console.log("New Position after Action:", newPosition);

            // Check if the agent has slipped (i.e., whether the position matches the expected one)
            const slipped = !positionsMatch(expectedPosition, newPosition);

            // Debugging: Log the slip status
            console.log("Slipped:", slipped);

            // Update the status message
            if (slipped) {
                document.getElementById("status").textContent = "HAHAHAHAHAH! You Slipped!! 🤣🤣🤣";
            } else {
                document.getElementById("status").textContent = "One step closer to the target 😮😮😮";
            }

            // Update current position
            currentPosition = newPosition;
        }

        // Check if the game is over
        if (data.done) {
            isGameRunning = false;
            document.getElementById("status").textContent = "GAME OVER!";
        }
    } catch (error) {
        console.error("Error during fetch:", error);
        alert("Failed to connect to the backend.");
    }
}

// Helper function to convert a flat state index to (x, y) coordinates
function indexToCoords(index) {
    const x = Math.floor(index / gridSize); // Row
    const y = index % gridSize; // Column
    return [x, y];
}

// Helper function to check if the agent's position matches the expected one
function positionsMatch(expected, actual) {
    return expected[0] === actual[0] && expected[1] === actual[1];
}

// Function to get the expected position based on the current position and action
function getExpectedPosition(position, action) {
    const [x, y] = position;

    switch (action) {
        case 0: // Left
            return [x, y - 1];
        case 1: // Down
            return [x + 1, y];
        case 2: // Right
            return [x, y + 1];
        case 3: // Up
            return [x - 1, y];
        default:
            return position; // In case of invalid action
    }
}

// Map arrow keys to actions
const keyActionMap = {
    ArrowLeft: 0, // Move Left
    ArrowDown: 1, // Move Down
    ArrowRight: 2, // Move Right
    ArrowUp: 3, // Move Up
};

// Listen for keydown events
document.addEventListener("keydown", (event) => {
    if (!isGameRunning) return;

    const action = keyActionMap[event.key];
    if (action !== undefined) {
        sendAction(action);
    }
});
